# Plano de Implementação — Protocolo de Sepse (arquitetura multi-protocolo)

> Objetivo: adicionar o **Protocolo de Sepse** (FORM SEP) ao módulo de protocolos,
> reaproveitando a UI/UX e a arquitetura já existentes do **Protocolo de Dor Torácica**,
> e generalizando o módulo para suportar N protocolos clínicos.

---

## 1. Decisões já tomadas

| # | Decisão | Implicação |
|---|---------|-----------|
| D1 | **Sepse é UM tipo** (`protocolType = 'sepse'`), com **variante por idade**: `> 1 mês e < 18 anos → pediátrico`; senão → adulto. Detectada automaticamente pela idade na abertura do paciente; operador pode confirmar/sobrescrever. | Um único tipo no seletor; o conjunto de blocos/forms muda conforme a variante. |
| D2 | **Indicadores do dashboard de Sepse derivados dos formulários** (bundle ILAS 2022 / SSC 2026). Propostos neste plano (seção 7) para revisão. | Estratégia de métricas própria por tipo de protocolo. |
| D3 | **Home dos protocolos = grade de cards** (Dor Torácica, Sepse). Clicar entra no protocolo. Um **seletor no topo** permite trocar de protocolo a qualquer momento. | Novas rotas com `protocolType` e nova home. |
| D4 | **Papéis reaproveitados**: os mesmos `protocolo_operador / protocolo_medico / protocolo_admin / protocolo_admin_global / holding_admin` valem para ambos os protocolos (sem papéis novos). | Sem mudança em guards de papel. |

---

## 2. Princípio arquitetural: **Protocol Registry**

Hoje o módulo é monolítico em torno de Dor Torácica: stages, blocos, forms, métricas e
rótulos estão hardcoded. A mudança central é introduzir, **no backend e no frontend**, um
**registro declarativo por tipo de protocolo** (`ProtocoloDefinition`). Todo o resto
(criação, rascunho, fechamento de etapa, edição, histórico, encerramento) já é genérico e
**permanece igual** — passa apenas a consultar a definição em vez de constantes fixas.

```
ProtocoloDefinition {
  type:        'dor_toracica' | 'sepse'
  label, shortLabel, icon, color
  stages:      StageDef[]              // ordenadas: { key, titulo, equipe, registroLabel }
  variants?:   ('adulto'|'pediatrico')  // só Sepse; resolvida por idade
  blockForm:   Record<stageKey, ReactComponent>   // (frontend)
  metrics:     MetricsStrategy                     // (backend) + config de indicadores (frontend)
  campoLabels: Record<path, label>     // rótulos do histórico de alterações
}
```

> **Regra de ouro:** nada do fluxo de Dor Torácica deve mudar de comportamento. A Fase 0 é
> uma refatoração *sem mudança funcional* que torna o existente "type-aware"; só depois Sepse entra.

---

## 3. Estado atual — o que é reutilizável vs. acoplado

### Backend (`backend/src/modules/protocolos/`)
**Reutilizável (genérico):**
- Tabela `protocolos` já tem coluna `protocolType varchar(40)` (hoje fixa em `'dor_toracica'`).
- `currentStage varchar(20)` — aceita qualquer nome de etapa.
- Rascunho, edição de bloco, encerramento antecipado, `historicoAlteracoes`, `historicoAcoes`,
  diff de campos (`utils/bloco-diff.util.ts`), slug (`utils/slug-time.util.ts`), auditoria.
- Guards de papel (`protocolo-roles.ts`) — independentes de tipo.

**Acoplado a Dor Torácica (precisa virar type-aware):**
- `protocolos.service.ts:84` — `protocolType: 'dor_toracica'` **hardcoded** no `create()`.
- `NEXT_STAGE` (service ~l.31) — mapa fixo de etapas de dor torácica.
- Colunas JSONB fixas: `triagem`, `ecg`, `investigacao`, `desfecho` (+ rascunhos).
- Endpoints de fechamento fixos: `PATCH /:slug/{triagem|ecg|investigacao|desfecho}`.
- `getMetrics()` (service ~l.415–570) — **totalmente** acoplado (porta-agulha, trombólise,
  HEART, VIA, troponina). Inservível para Sepse.
- `protocolo-types.ts` — `BlocoTriagem/Ecg/Investigacao/Desfecho` com campos de dor torácica.

### Frontend (`src/pages/protocolos/`, `src/services`, `src/types`)
**Reutilizável:** componentes de `form/form-ui.tsx` (NumericInput, CheckRow, RadioPill,
DateField, PendenciasBox, FecharEtapaBar, etc.), o esqueleto de `form/index.tsx` (mapa
`BLOCO_FORM`, modos view/fill/edit, auto-save, histórico), `novo-paciente-modal.tsx`, o
padrão de `Select` no topo, `ProtocoloRoute` (guard de papel), header com abas.

**Acoplado:** `constants.ts` (STAGE_META/LABEL/STYLE/ORDER/BLOCOS, CAMPO_LABEL, VALOR_LABEL),
os 4 `bloco-*.tsx`, `dashboard/index.tsx` (INDICADORES + distribuições), títulos "Dor Torácica"
espalhados (`index.tsx:64`, `dashboard:73`, `concluidos:74`), `types/index.ts` (blocos/métricas).

---

## 4. Modelo de dados (backend) e migração

**Abordagem recomendada — armazenamento genérico de blocos** (escala para N protocolos):

1. **Migração** `add-protocolo-multi-tipo.sql`:
   - Adicionar `blocos jsonb NOT NULL DEFAULT '{}'` — mapa `{ [stageKey]: BlocoData }`.
   - Adicionar `rascunhos jsonb NOT NULL DEFAULT '{}'` — mapa `{ [stageKey]: Partial<BlocoData> }`.
   - Adicionar `pesoKg varchar` ao header (dose pediátrica) — opcional.
   - Adicionar `variante varchar(12) NULL` (`'adulto'|'pediatrico'`, só Sepse).
   - **Backfill**: copiar `triagem→blocos.triagem`, `ecg→blocos.ecg`, etc. (e rascunhos), e
     `protocolType` permanece `'dor_toracica'` nos registros existentes.
   - Manter as colunas antigas por 1 release (compatibilidade) e remover depois.
2. **Entity** (`protocolo.entity.ts`): adicionar `blocos`, `rascunhos`, `pesoKg`, `variante`.
   Manter getters de compatibilidade para Dor Torácica se necessário durante a transição.
3. **`protocolType`**: vira parâmetro do `CreateProtocoloDto` (default `'dor_toracica'`),
   usado no `create()` no lugar do valor fixo (remove o hardcode da linha 84).

> **Alternativa mais conservadora** (se preferir risco mínimo agora): manter as 4 colunas de
> Dor Torácica e **adicionar** colunas JSONB de Sepse (`abertura`, `pacote1h`, `reavaliacao`,
> `desfechoSepse`), com o service ramificando por `protocolType`. Mais aditivo, porém não
> escala elegantemente. **O plano segue com a abordagem genérica (mapa de blocos).**

---

## 5. Modelo de domínio da Sepse (derivado dos formulários)

Stages da Sepse (4 etapas + `concluido`), mapeadas sobre a mesma máquina sequencial do
módulo (`abertura → pacote1h → reavaliacao → desfecho → concluido`):

### Etapa 1 — `abertura` (Identificação + Gatilho/Triagem + Classificação)
Header do paciente (reaproveitado) + **horário zero** (data/hora — marco inicial dos prazos).

- **Comum:** `horarioZeroData`, `horarioZeroHora`; `focoPrincipal` (pulmonar, urinário,
  abdominal, pele/partes moles, SNC, cateter, endocardite*, não definido, outro+desc);
  `classificacao`.
  - Adulto → `'sepse' | 'choque_septico' | 'infeccao_sem_disfuncao'`
  - Pediátrico → `'sepse' | 'sepse_grave' | 'choque_septico'`
- **Adulto:** `disfuncoesOrganicas` (ILAS): hemodinâmico, renal, respiratório, hematológico,
  metabólico, neurológico, hepático, coagulopatia (booleans); critério (infecção+disfunção
  ou ≥2 SIRS).
- **Pediátrico:** `sirsPediatrica` (temperatura*, taquicardia, taquipneia, leucocitose* —
  ≥2, obrigatório temperatura **ou** leucócitos); `sinaisHipoperfusao` (TEC>2s/choque frio,
  perfusão flash/choque quente, alteração mental, oligúria, hipotensão tardia).

### Etapa 2 — `pacote1h` (Pacote de 1 hora)
- **Adulto:** `lactato{feito,hora,valor}`, `hemoculturas{feito,hora}` (antes ATM),
  `culturasFoco{feito,hora,foco}`, `antimicrobiano{hora1aDose}`,
  `reposicaoVolemica{indicada,hora,mlTotal}` (RL 30 mL/kg),
  `vasopressor{indicado,hora,via,dose}` (noradrenalina se PAM<65).
- **Pediátrico (5 passos):**
  - `passo1Acesso{abcde, o2Ofertado, acessoVenoso, acessoIO, ioLocal}`
  - `passo2Coletas`: lactato, hemoculturas (antes ATM), kit sepse (gaso/hemograma/creat/bili/coag),
    glicemia{valor} (<60 corrigir), cálcio iônico{valor}
  - `passo3ATM{doseCalculadaMg, hora1aDose, via(periferico|io|central), atmPrevio}` (Pip-tazo 100 mg/kg)
  - `passo4Volume`: `bolus1{ml,hora,tecPos,estertores}`, `bolus2{ml,hora,tecPos,estertores}` (20 mL/kg RL)
  - `passo5Vasoativo{tipoChoque(frio|quente), droga(adrenalina|noradrenalina), doseInicial, hora, via}`

### Etapa 3 — `reavaliacao`
- **Adulto:** reavaliação 6h — PAM, TEC, diurese, SpO₂, consciência (GCS), glicemia (cada um
  com "meta atingida" sim/não); `recoletaLactato{hora, valor, clareamento≥20%}`.
- **Pediátrico:** **Phoenix Sepsis Score 2024** — respiratório (0–3), cardiovascular/vasoativo
  (0–2), cardiovascular/lactato (0–2), coagulação (0–2), neurológico (0–2), `total`,
  `classificacao(sepse≥2 | choque | incompleto)`; reavaliação 1–2h (TEC, diurese, PAS p/ idade,
  GCS, SpO₂); `recoletaLactato{hora, valor}`.

### Etapa 4 — `desfecho` (Transferência + Encerramento do protocolo)
- **Comum:** `criteriosTransferenciaUTI` (checklist) + `utiAcionadaHora` + `vagaStatus`
  (confirmada/aguardando/N-A); `encerramentoClinico.tipo` (sepse confirmada / dx alternativo+desc /
  infecção sem disfunção / cuidados de fim de vida / transferência); `dataHoraEncerramento`;
  `desfecho` (alta / óbito / transferência / evento sentinela).

> O `encerrar` antecipado já existente (motivos `nao_continuidade`/`nao_indicacao`) continua
> genérico e válido para Sepse — é independente desta etapa final.

`*` campos que só existem numa variante.

---

## 6. Mudanças por camada (com arquivos)

### Backend
| Arquivo | Mudança |
|---|---|
| `dto/create-protocolo.dto.ts` | Adicionar `protocolType?`, `pesoKg?`, `variante?`. |
| `protocolos.service.ts` | `create()` usa `dto.protocolType`; `NEXT_STAGE` e validação de ordem vêm da **definição** por tipo; `submitBloco` e `editarBloco` gravam em `blocos[stageKey]`/`rascunhos[stageKey]`. |
| `protocolos.controller.ts` | Substituir os 4 PATCH fixos por **`PATCH /:slug/blocos/:stageKey`** (fechar) e **`PATCH /:slug/blocos/:stageKey/rascunho`** + `/editar`. Manter aliases antigos por 1 release. |
| `protocolo-definitions/` (novo) | `dor-toracica.definition.ts`, `sepse.definition.ts` (stages, NEXT_STAGE, metrics strategy). |
| `metrics/` (novo) | `MetricsStrategy` (interface) + `DorToracicaMetrics` (extrair de `getMetrics`) + `SepseMetrics`. `getMetrics(tenant, {protocolType})` despacha pela estratégia. |
| `protocolo-types.ts` | Tipos dos blocos de Sepse (adulto/pediátrico) ao lado dos de dor torácica. |
| `database/migrations/` | `add-protocolo-multi-tipo.sql` (seção 4). |

### Frontend
| Arquivo | Mudança |
|---|---|
| `src/types/index.ts` | Tipos de blocos de Sepse + `ProtocoloSepseMetrics`; `protocolType`, `pesoKg`, `variante` no `Protocolo`; generalizar acesso a blocos via `blocos[stageKey]`. |
| `src/pages/protocolos/protocolo-registry.ts` (novo) | Registro por tipo: label/icon/color, stages (STAGE_META/LABEL/STYLE), mapa de forms por stage, config de indicadores, campoLabels. Substitui os usos fixos de `constants.ts`. |
| `src/pages/protocolos/sepse/` (novo) | `bloco-abertura.tsx`, `bloco-pacote1h.tsx`, `bloco-reavaliacao.tsx`, `bloco-desfecho.tsx` — cada um ramifica por variante (adulto/pediátrico). Reaproveitam `form-ui.tsx`. |
| `src/pages/protocolos/index.tsx` | Vira **home com cards** dos protocolos (Dor Torácica, Sepse) quando sem `:protocolType`; com `:protocolType`, vira a lista daquele protocolo (atual). Título/labels da definição. |
| `src/pages/protocolos/form/index.tsx` | Stages e mapa de forms vêm da **definição** do `protocolo.protocolType` (em vez de `BLOCO_FORM`/`BLOCOS` fixos). |
| `src/pages/protocolos/novo-paciente-modal.tsx` | Recebe `protocolType`; para Sepse, captura **peso** e resolve **variante por idade** (com override) e horário zero. |
| `src/pages/protocolos/dashboard/index.tsx` | INDICADORES e distribuições vêm da config do tipo; seletor de protocolo no topo. |
| `src/pages/protocolos/concluidos/index.tsx` | Escopo por `protocolType` (query + título). |
| `src/pages/protocolos/usuarios/index.tsx` | Sem mudança funcional (papéis compartilhados); opcional rótulo. |
| `src/services/protocolo-service.ts` | `create` envia `protocolType`; `getAbertos/getAll/getMetrics` aceitam filtro `protocolType`; submit/rascunho/editar usam endpoint genérico `blocos/:stageKey`. |
| `src/routes.ts` | Novas rotas com `protocolType` (seção 8). |
| `src/App.tsx` | Registrar novas rotas mantendo as antigas como redirect. |
| `src/components/layout/header.tsx` | Seletor de protocolo (Dor Torácica/Sepse) ao lado das abas; abas continuam gateadas por papel. |

---

## 7. Indicadores do dashboard de Sepse (proposta — derivada do bundle ILAS/SSC)

Todos os tempos contados a partir do **horário zero**. (Revisar metas.)

| Indicador | Definição | Meta |
|---|---|---|
| `lactato30` | Lactato coletado ≤ 30 min do horário zero | ≥ 90% |
| `hemoculturasAntesAtm` | Hemoculturas coletadas **antes** do antimicrobiano | ≥ 90% |
| `antimicrobiano60` | 1ª dose de ATM ≤ 60 min (pediátrico: ≤ 60 min no choque) | ≥ 90% |
| `reposicaoVolemica` | Volume iniciado quando indicado, dentro da 1ª hora | ≥ 90% |
| `pacote1hCompleto` | Bundle 1h completo (lactato + hemocultura + ATM + volume) | ≥ 80% |
| `reavaliacaoLactato` | Recoleta de lactato 2–4h com clareamento ≥ 20% (quando elevado) | ≥ 80% |
| `transferenciaUTI` | Transferência p/ UTI/UTIP dentro da meta quando indicada | ≥ 90% |
| `completude` | Protocolo concluído com etapas-chave preenchidas | ≥ 90% |

**Distribuições:** `porClassificacao` (sepse/choque/infecção sem disfunção), `porFoco`
(pulmonar/urinário/abdominal/...), `porDesfecho` (alta/óbito/transferência/evento sentinela);
**pediátrico:** `porFaixaPhoenix`. **Volume:** total/abertos/concluídos + tendência mensal
(reaproveita o existente). PDF: nova função em `protocolo-report-service` ou parametrizar a atual.

---

## 8. Roteamento e UX

Rotas novas (mantendo as antigas como redirect para não quebrar links):
```
/:tenant/protocolos                          → Home (cards: Dor Torácica, Sepse)
/:tenant/protocolos/:protocolType            → Lista de abertos do protocolo
/:tenant/protocolos/:protocolType/:slug      → Formulário do protocolo
/:tenant/protocolos-dashboard/:protocolType  → Dashboard do protocolo
/:tenant/protocolos-concluidos/:protocolType → Concluídos do protocolo
```
- `:protocolType` na URL torna a seleção **persistente** (refresh/compartilhamento).
- **Seletor no topo** (header) troca o `protocolType` mantendo a aba atual.
- Login dos papéis `protocolo_*` continua indo para `ROUTES.protocolos(tenant)` → cai na home de cards.

---

## 9. Fases de implementação (checklist)

- [ ] **Fase 0 — Refator type-aware (sem mudança funcional):** Protocol Registry (back+front),
      `getMetrics` extraído para `DorToracicaMetrics`, `create` lê `protocolType` do DTO,
      armazenamento via `blocos`/`rascunhos` (migração + backfill), rotas com `:protocolType`
      e redirects. *Critério: Dor Torácica funciona idêntico.*
- [ ] **Fase 1 — Backend Sepse:** tipos dos blocos, `sepse.definition.ts`, validações,
      `SepseMetrics`. Testes do service (criação, fechamento de etapas, métricas).
- [ ] **Fase 2 — Frontend Sepse (forms):** `novo-paciente-modal` (peso + variante por idade +
      horário zero) e os 4 blocos (abertura/pacote1h/reavaliação/desfecho) com ramificação
      adulto/pediátrico (Phoenix, doses por peso, IO, choque frio/quente).
- [ ] **Fase 3 — Home de cards + seletor no topo** + escopo por tipo na lista/concluídos.
- [ ] **Fase 4 — Dashboard de Sepse** (indicadores da seção 7 + distribuições + PDF).
- [ ] **Fase 5 — Polimento:** rótulos do histórico (campoLabels de Sepse), labels "Concluídos —
      Sepse", remoção das colunas JSONB antigas (após release de transição), QA com dados reais.

---

## 10. Riscos e pontos de atenção

- **Não regredir Dor Torácica.** A Fase 0 deve sair com paridade total antes de Sepse entrar.
  Cobrir o backfill da migração com verificação (contagem de blocos antes/depois).
- **Variante por idade em lactentes:** idade em anos = 0 para < 1 ano; usar data de nascimento
  para meses. Form pediátrico cobre `> 1 mês e < 18 anos`; neonatos < 1 mês ficam fora de escopo
  (sinalizar ao operador). Sempre permitir override manual da variante.
- **Métricas só fazem sentido por tipo** — o seletor de protocolo no dashboard é obrigatório;
  não somar indicadores entre tipos.
- **Endpoints genéricos `blocos/:stageKey`** precisam validar que o `stageKey` pertence à
  definição do tipo e respeita a ordem (igual ao `NEXT_STAGE` atual).
- **Doses pediátricas** (Pip-tazo 100 mg/kg, bolus 20 mL/kg, etc.) podem ser calculadas a partir
  do peso como *auxílio de preenchimento* (não prescrição) — confirmar se deve auto-sugerir.

---

### Referências (formulários-fonte)
- `Documents/FORM SEP- Adulto  rev00 -.docx`
- `Documents/FORM SEP- Pediatria rev00.docx`
- Base de comparação: `Documents/PROTOLOCO DE DOR TORACICA .docx` (implementado hoje)
