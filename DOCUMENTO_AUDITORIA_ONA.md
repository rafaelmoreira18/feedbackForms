# Documento de Auditoria — Sistema de Pesquisa de Satisfação de Pacientes
**Versão:** 1.0  
**Data de emissão:** 14 de abril de 2026  
**Finalidade:** Demonstrar conformidade do sistema digital com os requisitos de rastreabilidade, autenticidade e integridade de dados exigidos pela ONA (Organização Nacional de Acreditação)

---

## 1. Contexto e Justificativa

O sistema anterior de coleta de pesquisas de satisfação utilizava **Google Forms**, ferramenta de propósito geral sem mecanismos de identificação de pacientes, trilha de auditoria ou controle de acesso por unidade hospitalar. As respostas coletadas não possuíam vínculo com CPF nem nome do paciente, impossibilitando a verificação de autenticidade perante auditores.

Este documento descreve o **Sistema de Pesquisa de Satisfação de Pacientes**, desenvolvido especificamente para atender às exigências de rastreabilidade e acreditação hospitalar, substituindo o Google Forms a partir do momento de sua implantação em produção.

---

## 2. Arquitetura e Banco de Dados

O sistema é composto por:

- **Backend:** API REST desenvolvida em NestJS (Node.js), hospedada em servidor dedicado
- **Banco de dados:** PostgreSQL — banco exclusivo por tenant (`feedbackforms_<slug>`) com isolamento de dados entre unidades
- **Frontend:** Aplicação React acessível a partir da rede interna hospitalar
- **Autenticação:** JWT (JSON Web Token) com banco centralizado `Multi_UnidadesDB`, segregado do banco de dados de respostas

Cada unidade hospitalar (tenant) possui banco de dados próprio, impedindo que dados de uma unidade sejam acessados por outra.

---

## 3. Identificação do Paciente

### 3.1 Campos obrigatórios por resposta

Cada registro na tabela `form3_responses` contém, obrigatoriamente:

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único imutável gerado automaticamente |
| `patientName` | texto | Nome completo do paciente |
| `patientAge` | inteiro | Idade do paciente |
| `patientGender` | texto | Gênero do paciente |
| `admissionDate` | data | Data de internação/atendimento |
| `dischargeDate` | data | Data de alta |
| `evaluatedDepartment` | texto | Setor/departamento avaliado |
| `formType` | texto | Tipo de formulário (ex: internação, UTI, centro cirúrgico) |
| `createdAt` | timestamp | Data e hora exata de submissão (gerada pelo servidor) |
| `tenantId` | UUID | Identificador da unidade hospitalar |

### 3.2 CPF do Paciente

O CPF é coletado como campo principal de identificação. Quando o CPF não pode ser informado no momento da entrevista, o sistema **obriga** o preenchimento de uma justificativa estruturada, selecionada de lista controlada:

- Paciente não possui CPF
- Paciente não soube informar
- Responsável não soube informar
- Paciente estrangeiro
- Recusa em informar
- Documento não estava disponível

Não é possível submeter um formulário sem CPF **e** sem justificativa — o sistema retorna erro de validação (`400 Bad Request`).

### 3.3 Adição retroativa de CPF

Quando o CPF não foi coletado no momento da entrevista, um administrador com perfil `holding_admin` pode adicioná-lo retroativamente. O sistema registra automaticamente o campo `cpfAddedAt` (timestamp da inserção retroativa), mantendo rastreabilidade da origem do dado.

---

## 4. Trilha de Auditoria (Audit Log)

Toda operação relevante é registrada de forma **imutável** na tabela `audit_logs`. Nenhum registro desta tabela pode ser alterado ou excluído pelo sistema — trata-se de append-only por design.

### 4.1 Campos registrados em cada evento

| Campo | Descrição |
|---|---|
| `id` | UUID do evento de auditoria |
| `tenantId` | Unidade hospitalar onde ocorreu a ação |
| `userId` | ID do usuário autenticado que executou a ação (null para submissões públicas) |
| `userEmail` | E-mail do usuário no momento da ação |
| `action` | Tipo de ação realizada (ver tabela abaixo) |
| `entityType` | Tipo da entidade afetada (ex: `form3_response`) |
| `entityId` | ID do registro afetado |
| `ipAddress` | Endereço IP de origem da requisição |
| `details` | Dados adicionais em JSON (ex: tipo de formulário, campos alterados) |
| `createdAt` | Timestamp gerado automaticamente pelo servidor |

### 4.2 Tipos de eventos auditados

| Código do Evento | Descrição |
|---|---|
| `FORM_CREATED` | Submissão de nova pesquisa de satisfação |
| `FORM_DELETED` | Exclusão lógica (soft-delete) de uma resposta individual |
| `FORM_BULK_DELETED` | Exclusão em massa de respostas de uma unidade |
| `FORM_CPF_UPDATED` | Adição retroativa de CPF a uma resposta existente |
| `TRAINING_SESSION_CREATED` | Criação de sessão de treinamento |
| `TRAINING_SESSION_UPDATED` | Atualização de sessão de treinamento |
| `TRAINING_SESSION_DELETED` | Exclusão de sessão de treinamento |
| `TRAINING_RESPONSE_CREATED` | Registro de resposta de treinamento |
| `TRAINING_RESPONSE_DELETED` | Exclusão de resposta de treinamento |

### 4.3 Rastreabilidade de submissões públicas

As pesquisas de satisfação são submetidas pela equipe de enfermagem sem autenticação (formulário público, rate-limited a 30 requisições/minuto). Para estas submissões, o evento `FORM_CREATED` registra:
- `ipAddress`: IP do dispositivo que realizou a submissão
- `details.formType`: tipo de formulário
- `details.hasCpf`: se o CPF foi coletado no momento
- `details.recusouResponder`: se o paciente recusou responder

---

## 5. Controle de Acesso e Perfis de Usuário

O sistema implementa controle de acesso baseado em papéis (RBAC):

| Perfil | Permissões |
|---|---|
| `viewer` | Visualizar respostas e métricas da própria unidade |
| `hospital_admin` | Visualizar + excluir respostas da própria unidade |
| `holding_admin` | Todas as permissões, inclusive adição retroativa de CPF e acesso a todas as unidades do grupo |

A autenticação é validada via JWT em todas as rotas protegidas. O token carrega o `tenantId` do usuário, que é verificado a cada requisição — um usuário de uma unidade não consegue acessar dados de outra.

---

## 6. Integridade e Imutabilidade dos Dados

### 6.1 Soft-delete vs. hard-delete

- **Exclusão lógica (soft-delete):** O registro é marcado com `deletedAt` mas permanece fisicamente no banco, mantendo rastreabilidade. Toda exclusão individual utiliza este mecanismo.
- **Exclusão física (hard-delete):** Disponível apenas na operação de limpeza em massa, restrita a administradores, e registrada na audit log com quantidade de registros afetados.

### 6.2 Timestamps gerados pelo servidor

Os campos `createdAt` e `cpfAddedAt` são gerados exclusivamente pelo servidor PostgreSQL/NestJS, não aceitando valores enviados pelo cliente. Isso impede adulteração de datas.

### 6.3 Validação de CPF

O sistema valida o CPF contra o algoritmo oficial de dígitos verificadores antes de persistir, rejeitando CPFs inválidos ou sequências como `000.000.000-00`.

---

## 7. Comparativo com o Sistema Anterior (Google Forms)

| Critério | Google Forms (anterior) | Sistema atual |
|---|---|---|
| Identificação do paciente | Não havia | Nome, idade, gênero, CPF ou justificativa |
| Vinculação com internação | Não havia | Data de internação, alta e setor avaliado |
| Trilha de auditoria | Não havia | Tabela `audit_logs` imutável com IP, usuário, timestamp |
| Controle de acesso por unidade | Não havia | Isolamento por tenant com JWT |
| Validação de dados | Não havia | Validação de CPF, campos obrigatórios, justificativas controladas |
| Imutabilidade de timestamps | Google podia ser editado | `createdAt` gerado pelo servidor, não editável |
| Soft-delete com rastreabilidade | Não havia | `deletedAt` preserva registro fisicamente |
| Segregação por unidade hospitalar | Planilha única compartilhada | Banco de dados separado por unidade |

---

## 8. Conclusão

O sistema de pesquisa de satisfação descrito neste documento atende aos requisitos de rastreabilidade, identificação de pacientes e integridade de dados exigidos para acreditação ONA. Diferentemente do Google Forms, cada resposta está vinculada a um paciente identificado (por CPF ou justificativa documentada), a um período de internação, a um setor específico e a um registro imutável de auditoria que permite determinar **quem coletou a informação, quando, de qual IP e em qual unidade hospitalar**.

---

*Documento gerado em 14/04/2026.*  
*Sistema: Pesquisa de Satisfação de Pacientes — Mediall*
