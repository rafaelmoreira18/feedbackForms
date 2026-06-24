import type { ProtocoloEntity } from '../entities/protocolo.entity';
import type {
  AvcBlocoAbertura,
  AvcBlocoImagem,
  AvcBlocoTrombolise,
  AvcBlocoMonitorizacao,
  AvcBlocoDesfecho,
} from '../protocolo-types';
import { deltaMin } from '../utils/slug-time.util';
import { indicador } from '../utils/indicador.util';
import { blocoOf } from '../utils/bloco-access.util';
import type { AvcMetrics } from './metrics.types';

/** ≥1 motivo de abertura marcado (ignora a descrição livre). */
function temMotivo(ab: AvcBlocoAbertura | null): boolean {
  const m = ab?.motivoAbertura;
  return !!m && Object.entries(m).some(([k, v]) => k !== 'outroDesc' && v === true);
}

/**
 * Métricas do Protocolo de AVC — Linha de Cuidado do AVC (Rede Mediall).
 * Todos os tempos são contados a partir do FMC (primeiro contato = marco zero).
 */
export function computeAvcMetrics(protocolos: ProtocoloEntity[]): AvcMetrics {
  const porEtapa: Record<string, number> = {
    abertura: 0,
    avaliacao: 0,
    imagem: 0,
    trombolise: 0,
    monitorizacao: 0,
    desfecho: 0,
    concluido: 0,
  };
  const porDiagnostico: Record<string, number> = {};
  const porDestino: Record<string, number> = {};
  const porFluxo = { a: 0, b: 0, naoInformado: 0 };
  const porClassificacaoManchester = { vermelho: 0, laranja: 0, outro: 0, naoInformado: 0 };

  // contadores numerador/denominador
  let tcN = 0, tcD = 0; // porta-TC ≤ 25 min (fluxo A)
  let agN = 0, agD = 0; // porta-agulha ≤ 60 min
  let codN = 0, codD = 0; // ativação do código AVC ≤ 10 min
  let didoN = 0, didoD = 0; // DIDO ≤ 60 min (fluxo B transferido)
  let degN = 0, degD = 0; // deglutição avaliada ≤ 24h
  let fessN = 0, fessD = 0; // bundle FeSS completo
  let compN = 0, compD = 0; // completude

  const mesMap = new Map<string, number>();

  for (const p of protocolos) {
    porEtapa[p.currentStage] = (porEtapa[p.currentStage] ?? 0) + 1;

    const ab = blocoOf<AvcBlocoAbertura>(p, 'abertura');
    const img = blocoOf<AvcBlocoImagem>(p, 'imagem');
    const trb = blocoOf<AvcBlocoTrombolise>(p, 'trombolise');
    const mon = blocoOf<AvcBlocoMonitorizacao>(p, 'monitorizacao');
    const des = blocoOf<AvcBlocoDesfecho>(p, 'desfecho');

    const fmc = ab?.fmcHora;

    // ── Distribuições ────────────────────────────────────────────────────────
    const cls = ab?.classificacaoManchester;
    if (cls === 'vermelho') porClassificacaoManchester.vermelho++;
    else if (cls === 'laranja') porClassificacaoManchester.laranja++;
    else if (cls === 'outro') porClassificacaoManchester.outro++;
    else porClassificacaoManchester.naoInformado++;

    if (img?.fluxo === 'a') porFluxo.a++;
    else if (img?.fluxo === 'b') porFluxo.b++;
    else porFluxo.naoInformado++;

    if (des?.diagnosticoFinal) porDiagnostico[des.diagnosticoFinal] = (porDiagnostico[des.diagnosticoFinal] ?? 0) + 1;
    if (des?.destino) porDestino[des.destino] = (porDestino[des.destino] ?? 0) + 1;

    // tendência mensal
    const mes = (p.dataAtendimento || '').slice(0, 7);
    if (mes) mesMap.set(mes, (mesMap.get(mes) ?? 0) + 1);

    // ── Indicadores ──────────────────────────────────────────────────────────
    // 1. Porta-TC ≤ 25 min do FMC (fluxo A)
    if (img?.fluxo === 'a') {
      tcD++;
      const d = deltaMin(fmc, img.tcInicioHora);
      if (d !== null && d <= 25) tcN++;
    }

    // 2. Porta-agulha ≤ 60 min do FMC (quando houve bolus de alteplase)
    if (trb?.bolusHora) {
      agD++;
      const d = deltaMin(fmc, trb.bolusHora);
      if (d !== null && d <= 60) agN++;
    }

    // 3. Ativação do código AVC ≤ 10 min do FMC
    if (ab?.ativacaoCodigoAvcHora) {
      codD++;
      const d = deltaMin(fmc, ab.ativacaoCodigoAvcHora);
      if (d !== null && d <= 10) codN++;
    }

    // 4. DIDO ≤ 60 min (fluxo B, quando há saída/DIDO informado)
    if (img?.fluxo === 'b' && (img.saidaUnidadeHora || img.didoMin)) {
      didoD++;
      const dido = img.didoMin
        ? Number(String(img.didoMin).replace(',', '.'))
        : deltaMin(p.horaChegada, img.saidaUnidadeHora);
      if (dido !== null && !Number.isNaN(dido) && dido <= 60) didoN++;
    }

    // 5. Avaliação de deglutição ≤ 24h (FeSS) — entre os que chegaram à monitorização
    if (mon) {
      degD++;
      if (mon.fess?.degluticao24h) degN++;
    }

    // 6. Bundle FeSS completo (febre + glicemia + deglutição controladas)
    if (mon) {
      fessD++;
      const f = mon.fess;
      if (f?.fessFebre && f?.fessGlicemia && f?.fessDegluticao) fessN++;
    }

    // 7. Completude — sobre concluídos (abertura válida + fluxo + desfecho documentado)
    if (p.currentStage === 'concluido') {
      compD++;
      const c1 = !!ab?.fmcHora && temMotivo(ab);
      const c2 = !!img?.fluxo;
      const c3 = !!des?.diagnosticoFinal && !!des?.destino;
      if (c1 && c2 && c3) compN++;
    }
  }

  const tendenciaMensal = Array.from(mesMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, total]) => ({ mes, total }));

  return {
    protocolType: 'avc',
    total: protocolos.length,
    abertos: protocolos.length - porEtapa.concluido,
    concluidos: porEtapa.concluido,
    porEtapa,
    porDiagnostico,
    porDestino,
    porFluxo,
    porClassificacaoManchester,
    indicadores: {
      portaTc25: indicador(tcN, tcD, 80),
      portaAgulha60: indicador(agN, agD, 80),
      ativacaoCodigo10: indicador(codN, codD, 80),
      dido60: indicador(didoN, didoD, 80),
      degluticao24h: indicador(degN, degD, 90),
      fessCompleto: indicador(fessN, fessD, 80),
      completude: indicador(compN, compD, 90),
    },
    tendenciaMensal,
  };
}
