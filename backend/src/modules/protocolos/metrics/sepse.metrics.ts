import type { ProtocoloEntity } from '../entities/protocolo.entity';
import type {
  SepseBlocoAbertura,
  SepseBlocoPacote1h,
  SepseBlocoReavaliacao,
  SepseBlocoDesfecho,
  SepseColeta,
} from '../protocolo-types';
import { deltaMin } from '../utils/slug-time.util';
import { indicador } from '../utils/indicador.util';
import { blocoOf } from '../utils/bloco-access.util';
import type { SepseMetrics } from './metrics.types';

/** Lactato da variante (adulto = pacote1h.lactato · pediátrico = passo2Coletas.lactato). */
function lactatoDe(variante: string, pac: SepseBlocoPacote1h | null): SepseColeta | undefined {
  return variante === 'pediatrico' ? pac?.passo2Coletas?.lactato : pac?.lactato;
}
function hemoculturasDe(variante: string, pac: SepseBlocoPacote1h | null) {
  return variante === 'pediatrico' ? pac?.passo2Coletas?.hemoculturas : pac?.hemoculturas;
}
function atmHoraDe(variante: string, pac: SepseBlocoPacote1h | null): string | undefined {
  return variante === 'pediatrico' ? pac?.passo3Atm?.hora1aDose : pac?.antimicrobiano?.hora1aDose;
}
function volumeDe(variante: string, pac: SepseBlocoPacote1h | null): { indicada: boolean; hora?: string } {
  if (variante === 'pediatrico') {
    return { indicada: true, hora: pac?.passo4Volume?.bolus1?.hora };
  }
  return { indicada: !!pac?.reposicaoVolemica?.indicada, hora: pac?.reposicaoVolemica?.hora };
}

/** Métricas do Protocolo de Sepse — bundle de 1 hora (ILAS 2022 / SSC 2026). */
export function computeSepseMetrics(protocolos: ProtocoloEntity[]): SepseMetrics {
  const porEtapa: Record<string, number> = {
    abertura: 0,
    pacote1h: 0,
    reavaliacao: 0,
    desfecho: 0,
    concluido: 0,
  };
  const porClassificacao: Record<string, number> = {};
  const porFoco: Record<string, number> = {};
  const porDesfecho: Record<string, number> = {};
  const porFaixaPhoenix = { sepse: 0, choque_septico: 0, incompleto: 0, naoInformado: 0 };

  // contadores
  let lacN = 0, lacD = 0; // lactato ≤ 30 min
  let hemoN = 0, hemoD = 0; // hemoculturas antes do ATM
  let atmN = 0, atmD = 0; // ATM ≤ 60 min
  let volN = 0, volD = 0; // reposição volêmica na 1ª hora (quando indicada)
  let bunN = 0, bunD = 0; // pacote 1h completo
  let reavN = 0, reavD = 0; // recoleta de lactato 2–4h
  let trN = 0, trD = 0; // transferência UTI quando indicada
  let compN = 0, compD = 0; // completude

  const mesMap = new Map<string, number>();

  for (const p of protocolos) {
    porEtapa[p.currentStage] = (porEtapa[p.currentStage] ?? 0) + 1;

    const variante = p.variante || 'adulto';
    const ab = blocoOf<SepseBlocoAbertura>(p, 'abertura');
    const pac = blocoOf<SepseBlocoPacote1h>(p, 'pacote1h');
    const rev = blocoOf<SepseBlocoReavaliacao>(p, 'reavaliacao');
    const des = blocoOf<SepseBlocoDesfecho>(p, 'desfecho');

    const hz = ab?.horarioZeroHora;

    // distribuição por classificação
    if (ab?.classificacao) porClassificacao[ab.classificacao] = (porClassificacao[ab.classificacao] ?? 0) + 1;

    // distribuição por foco (conta cada foco marcado)
    const foco = ab?.focoPrincipal;
    if (foco) {
      const map: Record<string, boolean | undefined> = {
        pulmonar: foco.pulmonar, urinario: foco.urinario, abdominal: foco.abdominal,
        peleMoles: foco.peleMoles, snc: foco.snc, cateter: foco.cateter,
        endocardite: foco.endocardite, naoDefinido: foco.naoDefinido, outro: foco.outro,
      };
      for (const [k, v] of Object.entries(map)) if (v) porFoco[k] = (porFoco[k] ?? 0) + 1;
    }

    // distribuição por desfecho final
    if (des?.desfecho) porDesfecho[des.desfecho] = (porDesfecho[des.desfecho] ?? 0) + 1;

    // Phoenix (pediátrico)
    if (variante === 'pediatrico') {
      const cls = rev?.phoenix?.classificacao;
      if (cls === 'sepse') porFaixaPhoenix.sepse++;
      else if (cls === 'choque_septico') porFaixaPhoenix.choque_septico++;
      else if (cls === 'incompleto') porFaixaPhoenix.incompleto++;
      else porFaixaPhoenix.naoInformado++;
    }

    // tendência mensal
    const mes = (p.dataAtendimento || '').slice(0, 7);
    if (mes) mesMap.set(mes, (mesMap.get(mes) ?? 0) + 1);

    const lactato = lactatoDe(variante, pac);
    const hemo = hemoculturasDe(variante, pac);
    const atmHora = atmHoraDe(variante, pac);
    const volume = volumeDe(variante, pac);

    // 1. Lactato ≤ 30 min do horário zero
    if (pac) {
      lacD++;
      const d = deltaMin(hz, lactato?.hora);
      if (lactato?.feito && d !== null && d <= 30) lacN++;
    }

    // 2. Hemoculturas antes do ATM
    if (pac && atmHora) {
      hemoD++;
      const dHemo = deltaMin(hz, hemo?.hora);
      const dAtm = deltaMin(hz, atmHora);
      const antes = dHemo !== null && dAtm !== null ? dHemo <= dAtm : !!hemo?.feito;
      if (hemo?.feito && antes) hemoN++;
    }

    // 3. Antimicrobiano ≤ 60 min do horário zero
    if (pac) {
      atmD++;
      const d = deltaMin(hz, atmHora);
      if (d !== null && d <= 60) atmN++;
    }

    // 4. Reposição volêmica na 1ª hora (quando indicada)
    if (pac && volume.indicada) {
      volD++;
      const d = deltaMin(hz, volume.hora);
      if (d !== null && d <= 60) volN++;
    }

    // 5. Pacote de 1 hora completo (lactato + hemocultura + ATM + volume quando indicado)
    if (pac) {
      bunD++;
      const volOk = !volume.indicada || (deltaMin(hz, volume.hora) !== null);
      if (lactato?.feito && hemo?.feito && !!atmHora && volOk) bunN++;
    }

    // 6. Recoleta de lactato 2–4h (quando elevado) — adulto exige clareamento ≥ 20%
    const lactatoElevado = !!lactato?.valor && Number(String(lactato.valor).replace(',', '.')) > 2;
    if (rev && lactatoElevado) {
      reavD++;
      const recoleta = rev.recoletaLactato;
      const fez = !!recoleta?.valor || !!recoleta?.hora;
      const clareou =
        variante === 'pediatrico'
          ? fez
          : Number(String(recoleta?.clareamento ?? '').replace(',', '.')) >= 20;
      if (fez && clareou) reavN++;
    }

    // 7. Transferência para UTI/UTIP dentro da meta (quando indicada)
    const indicaTransfer =
      des?.desfecho === 'transferencia' ||
      (des?.criteriosTransferencia &&
        Object.values(des.criteriosTransferencia).some(Boolean));
    if (des && indicaTransfer) {
      trD++;
      if (des.utiAcionadaHora && des.vagaStatus === 'confirmada') trN++;
    }

    // 8. Completude — sobre concluídos (abertura + pacote 1h essencial + desfecho documentado)
    if (p.currentStage === 'concluido') {
      compD++;
      const c1 = !!ab?.classificacao;
      const c2 = !!lactato?.feito && !!atmHora;
      const c3 = !!des?.desfecho;
      if (c1 && c2 && c3) compN++;
    }
  }

  const tendenciaMensal = Array.from(mesMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, total]) => ({ mes, total }));

  return {
    protocolType: 'sepse',
    total: protocolos.length,
    abertos: protocolos.length - porEtapa.concluido,
    concluidos: porEtapa.concluido,
    porEtapa,
    porClassificacao,
    porFoco,
    porDesfecho,
    porFaixaPhoenix,
    indicadores: {
      lactato30: indicador(lacN, lacD, 90),
      hemoculturasAntesAtm: indicador(hemoN, hemoD, 90),
      antimicrobiano60: indicador(atmN, atmD, 90),
      reposicaoVolemica: indicador(volN, volD, 90),
      pacote1hCompleto: indicador(bunN, bunD, 80),
      reavaliacaoLactato: indicador(reavN, reavD, 80),
      transferenciaUTI: indicador(trN, trD, 90),
      completude: indicador(compN, compD, 90),
    },
    tendenciaMensal,
  };
}
