import type { ProtocoloEntity } from '../entities/protocolo.entity';
import type {
  BlocoTriagem,
  BlocoEcg,
  BlocoInvestigacao,
  BlocoDesfecho,
} from '../protocolo-types';
import { deltaMin } from '../utils/slug-time.util';
import { indicador } from '../utils/indicador.util';
import { blocoOf } from '../utils/bloco-access.util';
import type { DorToracicaMetrics } from './metrics.types';

/** Indicadores do FORMMED026 — calculados a partir dos marcos de tempo registrados. */
export function computeDorToracicaMetrics(protocolos: ProtocoloEntity[]): DorToracicaMetrics {
  const porEtapa: Record<string, number> = {
    triagem: 0,
    ecg: 0,
    investigacao: 0,
    desfecho: 0,
    concluido: 0,
  };
  const porVia = { via_i: 0, via_ii: 0, via_iii: 0, naoInformado: 0 };
  const porRiscoHeart = { baixo: 0, intermediario: 0, alto: 0, naoInformado: 0 };

  // contadores dos indicadores
  let pt5n = 0, pt5d = 0;
  let te5n = 0, te5d = 0;
  let ei5n = 0, ei5d = 0;
  let pe10n = 0, pe10d = 0;
  let pa30n = 0, pa30d = 0;
  let efN = 0, efD = 0;
  let trN = 0, trD = 0;
  let compN = 0, compD = 0;

  const mesMap = new Map<string, number>();

  for (const p of protocolos) {
    porEtapa[p.currentStage] = (porEtapa[p.currentStage] ?? 0) + 1;

    const tri = blocoOf<BlocoTriagem>(p, 'triagem');
    const ecg = blocoOf<BlocoEcg>(p, 'ecg');
    const inv = blocoOf<BlocoInvestigacao>(p, 'investigacao');
    const des = blocoOf<BlocoDesfecho>(p, 'desfecho');

    // distribuição por VIA (ECG)
    const via = ecg?.resultadoEcg;
    if (via === 'via_i') porVia.via_i++;
    else if (via === 'via_ii') porVia.via_ii++;
    else if (via === 'via_iii') porVia.via_iii++;
    else porVia.naoInformado++;

    // distribuição por risco HEART
    const risco = inv?.heartFaixaRisco;
    if (risco === 'baixo') porRiscoHeart.baixo++;
    else if (risco === 'intermediario') porRiscoHeart.intermediario++;
    else if (risco === 'alto') porRiscoHeart.alto++;
    else porRiscoHeart.naoInformado++;

    // tendência mensal (por dataAtendimento)
    const mes = (p.dataAtendimento || '').slice(0, 7);
    if (mes) mesMap.set(mes, (mesMap.get(mes) ?? 0) + 1);

    // 1. Porta-Triagem ≤ 5 min (chegada → início triagem)
    const dPortaTriagem = deltaMin(p.horaChegada, tri?.inicioTriagem);
    if (dPortaTriagem !== null) {
      pt5d++;
      if (dPortaTriagem <= 5) pt5n++;
    }

    // 2. Triagem → ECG ≤ 5 min
    const dTriagemEcg = deltaMin(tri?.inicioTriagem, ecg?.primeiroEcgHora);
    if (dTriagemEcg !== null) {
      te5d++;
      if (dTriagemEcg <= 5) te5n++;
    }

    // 3. ECG → Interpretação ≤ 5 min
    const dEcgInterp = deltaMin(ecg?.primeiroEcgHora, ecg?.interpretacaoMedicaHora);
    if (dEcgInterp !== null) {
      ei5d++;
      if (dEcgInterp <= 5) ei5n++;
    }

    // 4. Porta-ECG total ≤ 10 min (chegada → interpretação)
    const dPortaEcg = deltaMin(p.horaChegada, ecg?.interpretacaoMedicaHora);
    const portaEcgOk = dPortaEcg !== null && dPortaEcg <= 10;
    if (dPortaEcg !== null) {
      pe10d++;
      if (portaEcgOk) pe10n++;
    }

    // 5. Porta-Agulha ≤ 30 min (início triagem → fibrinolítico) — só elegíveis trombolisados
    if (des?.trombolitiseElegivel && des?.inicioFibrinolitico) {
      const dAgulha = deltaMin(tri?.inicioTriagem, des.inicioFibrinolitico);
      if (dAgulha !== null) {
        pa30d++;
        if (dAgulha <= 30) pa30n++;
      }
    }

    // 6. Eficácia da trombólise (≥ 2 critérios de reperfusão) — sobre trombolisados
    if (des?.trombolitiseElegivel && des?.inicioFibrinolitico) {
      efD++;
      const cr = des.criteriosReperfusao;
      const nCrit =
        (cr?.resolucaoSt50 ? 1 : 0) + (cr?.eva3 ? 1 : 0) + (cr?.arritmiaReperfusao ? 1 : 0);
      if (nCrit >= 2) efN++;
    }

    // 7. Transferência dentro da meta (proxy ≤ 6h do início do atendimento)
    const ehTransferencia =
      des?.destino === 'transferencia_icp' || des?.destino === 'transferencia_uti_referencia';
    if (ehTransferencia && des?.saidaEfetivaHora) {
      const dTransf = deltaMin(tri?.inicioTriagem || p.horaChegada, des.saidaEfetivaHora);
      if (dTransf !== null) {
        trD++;
        if (dTransf <= 360) trN++;
      }
    }

    // 8. Completude do protocolo (6 critérios) — sobre concluídos
    if (p.currentStage === 'concluido') {
      compD++;
      const c1 = portaEcgOk; // ECG ≤ 10 min
      const c2 = !!inv; // avaliação médica + Dx diferenciais (bloco investigação preenchido)
      const c3 = (inv?.heartTotal ?? 0) > 0 || !!inv?.heartFaixaRisco; // HEART aplicado
      const c4 = !!inv?.coleta0h?.resultado; // troponina com algoritmo (coleta 0h)
      const c5 = !!inv?.heartFaixaRisco; // classificação de risco final
      const c6 = !!des?.destino; // desfecho documentado
      if (c1 && c2 && c3 && c4 && c5 && c6) compN++;
    }
  }

  const tendenciaMensal = Array.from(mesMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, total]) => ({ mes, total }));

  return {
    protocolType: 'dor_toracica',
    total: protocolos.length,
    abertos: protocolos.length - porEtapa.concluido,
    concluidos: porEtapa.concluido,
    porEtapa,
    porVia,
    porRiscoHeart,
    indicadores: {
      portaTriagem5: indicador(pt5n, pt5d, 90),
      triagemEcg5: indicador(te5n, te5d, 90),
      ecgInterpretacao5: indicador(ei5n, ei5d, 90),
      portaEcg10: indicador(pe10n, pe10d, 90),
      portaAgulha30: indicador(pa30n, pa30d, 90),
      eficaciaTrombolise: indicador(efN, efD, 70),
      transferenciaMeta: indicador(trN, trD, 90),
      completude: indicador(compN, compD, 90),
    },
    tendenciaMensal,
  };
}
