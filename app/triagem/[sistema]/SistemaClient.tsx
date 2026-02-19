'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { salvarNoHistorico } from '@/lib/historico';

type SistemaConfig = {
  id: string;
  titulo: string;
  descricao: string;
  sintomas: string[];
};

type MedSugestao = {
  principioAtivo: string;
  categoria: string;
  observacao: string;
};

type OrientacaoPorSintoma = {
  medicamentosOTC: MedSugestao[];
  dicasNaturais: string[];
  sinaisAlerta: string[];
};

type RiscoNivel = 'baixo' | 'moderado' | 'alto';

type ContextoTriagem = {
  idade: number | null;
  dias: number | null;
  gestante: boolean;
  dorForte: boolean;
  incapazHidratar: boolean;
};

type TabKey = 'resumo' | 'alerta' | 'otc' | 'dicas';

function normaliza(txt: string) {
  return (txt || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();
}

function parseAlergias(input: string) {
  return input
    .split(/[,;\n]/g)
    .map((s) => normaliza(s))
    .filter(Boolean);
}

function parseNumeroSeguro(v: string) {
  const n = Number(String(v || '').replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  if (n < 0) return null;
  return n;
}

function corRisco(risco: RiscoNivel) {
  if (risco === 'alto') return 'text-red-600';
  if (risco === 'moderado') return 'text-yellow-600';
  return 'text-green-600';
}

function etiquetaRisco(risco: RiscoNivel) {
  if (risco === 'alto') return 'ALTO (Procure atendimento)';
  if (risco === 'moderado') return 'MODERADO (Atenção)';
  return 'BAIXO (Leve)';
}

function labelTab(tab: TabKey) {
  if (tab === 'resumo') return 'Resumo';
  if (tab === 'alerta') return 'Quando procurar atendimento';
  if (tab === 'otc') return 'OTC';
  return 'Dicas naturais';
}

function botaoTabClasses(ativo: boolean) {
  return [
    'rounded-xl border px-3 py-2 text-sm transition',
    ativo ? 'bg-black text-white border-black' : 'bg-white text-gray-700 hover:bg-neutral-50 border-gray-300',
  ].join(' ');
}

async function copiarTexto(texto: string) {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {}
  try {
    const ta = document.createElement('textarea');
    ta.value = texto;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function gerarId() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c: any = globalThis.crypto;
    if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  } catch {}
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** =========================
 *  CONFIG DE SISTEMAS
 ========================= */
const SISTEMAS: SistemaConfig[] = [
  {
    id: 'respiratorio',
    titulo: 'Respiratório',
    descricao: 'Sintomas comuns do sistema respiratório.',
    sintomas: ['Tosse', 'Falta de ar', 'Chiado no peito', 'Dor torácica', 'Febre', 'Coriza'],
  },
  {
    id: 'gastrointestinal',
    titulo: 'Gastrointestinal',
    descricao: 'Sintomas comuns do sistema gastrointestinal.',
    sintomas: ['Náusea', 'Vômito', 'Diarreia', 'Dor abdominal', 'Azia/Refluxo', 'Constipação', 'Febre'],
  },
  {
    id: 'musculoesqueletico',
    titulo: 'Musculoesquelético',
    descricao: 'Sintomas comuns do sistema musculoesquelético.',
    sintomas: ['Dor muscular', 'Dor articular', 'Entorse/Trauma leve', 'Inchaço', 'Febre', 'Rigidez'],
  },
  {
    id: 'urinario',
    titulo: 'Urinário',
    descricao: 'Sintomas comuns do sistema urinário.',
    sintomas: [
      'Dor/ardor ao urinar',
      'Urgência urinária',
      'Aumento da frequência',
      'Dor lombar',
      'Febre',
      'Urina com odor forte',
    ],
  },
  {
    id: 'neurologico',
    titulo: 'Neurológico',
    descricao: 'Sintomas comuns do sistema neurológico.',
    sintomas: ['Dor de cabeça', 'Tontura', 'Náusea', 'Fraqueza', 'Febre', 'Formigamento'],
  },
  {
    id: 'ginecologico',
    titulo: 'Ginecológico',
    descricao: 'Sintomas comuns do sistema ginecológico.',
    sintomas: ['Cólicas', 'Corrimento', 'Coceira', 'Dor pélvica', 'Atraso menstrual', 'Febre'],
  },
  {
    id: 'pediatrico',
    titulo: 'Pediátrico',
    descricao: 'Sintomas comuns em pediatria (orientação geral).',
    sintomas: ['Febre', 'Tosse', 'Coriza', 'Diarreia', 'Vômito', 'Dor', 'Manchas na pele'],
  },
];

/** =========================
 *  ORIENTAÇÕES (TODOS OS SISTEMAS)
 ========================= */
const ORIENTACOES: Record<string, Record<string, OrientacaoPorSintoma>> = {
  respiratorio: {
    Tosse: {
      medicamentosOTC: [
        { principioAtivo: 'guaifenesina', categoria: 'Expectorante', observacao: 'seguir a bula; manter hidratação' },
        {
          principioAtivo: 'dextrometorfano',
          categoria: 'Antitussígeno',
          observacao: 'seguir bula; evitar uso prolongado; atenção a interação medicamentosa',
        },
        {
          principioAtivo: 'loratadina',
          categoria: 'Antialérgico',
          observacao: 'se componente alérgico (espirros/coceira)',
        },
      ],
      dicasNaturais: [
        'Hidratação frequente (água, sopas).',
        'Mel com limão (evitar em menores de 1 ano).',
        'Inalação com vapor/umidificação do ambiente.',
      ],
      sinaisAlerta: ['Tosse com sangue.', 'Febre alta persistente ou piora progressiva.'],
    },
    'Falta de ar': {
      medicamentosOTC: [],
      dicasNaturais: [
        'Sentar-se e manter postura confortável; respiração lenta.',
        'Ambiente arejado; evitar fumaça/cigarro.',
      ],
      sinaisAlerta: ['Falta de ar em repouso.', 'Lábios arroxeados, confusão, desmaio.'],
    },
    'Chiado no peito': {
      medicamentosOTC: [],
      dicasNaturais: ['Evitar gatilhos (poeira, mofo, fumaça).', 'Ambiente ventilado e hidratação.'],
      sinaisAlerta: ['Chiado com falta de ar em repouso.', 'Uso de musculatura acessória para respirar.'],
    },
    'Dor torácica': {
      medicamentosOTC: [
        { principioAtivo: 'paracetamol', categoria: 'Analgésico', observacao: 'seguir bula; atenção a doença hepática' },
        { principioAtivo: 'dipirona', categoria: 'Analgésico', observacao: 'seguir bula; evitar se alergia prévia' },
      ],
      dicasNaturais: ['Repouso e evitar esforço.', 'Compressa morna se dor muscular superficial.'],
      sinaisAlerta: ['Dor opressiva forte.', 'Dor com falta de ar, suor frio, desmaio.'],
    },
    Febre: {
      medicamentosOTC: [
        {
          principioAtivo: 'paracetamol',
          categoria: 'Antitérmico',
          observacao: 'seguir bula; atenção a dose máxima diária',
        },
        { principioAtivo: 'dipirona', categoria: 'Antitérmico', observacao: 'seguir bula; evitar se alergia' },
      ],
      dicasNaturais: [
        'Hidratação e repouso.',
        'Banho morno (não gelado) se desconforto.',
        'Roupas leves e ambiente ventilado.',
      ],
      sinaisAlerta: [
        'Febre alta persistente (>48–72h).',
        'Rigidez de nuca, confusão, manchas roxas.',
        'Sinais de desidratação importante.',
      ],
    },
    Coriza: {
      medicamentosOTC: [
        { principioAtivo: 'loratadina', categoria: 'Antialérgico', observacao: 'se componente alérgico' },
        { principioAtivo: 'cetirizina', categoria: 'Antialérgico', observacao: 'pode dar sonolência; seguir bula' },
        { principioAtivo: 'solução salina', categoria: 'Higiene nasal', observacao: 'lavagem nasal ajuda muito' },
      ],
      dicasNaturais: ['Lavagem nasal com soro fisiológico.', 'Inalação de vapor/umidificador.', 'Hidratação.'],
      sinaisAlerta: ['Febre alta ou piora após melhora.', 'Dor facial forte com secreção purulenta.'],
    },
  },

  gastrointestinal: {
    Náusea: {
      medicamentosOTC: [
        {
          principioAtivo: 'dimenidrinato',
          categoria: 'Antiemético',
          observacao: 'pode dar sonolência; seguir bula',
        },
      ],
      dicasNaturais: [
        'Gengibre (chá/raspas) se tolerado.',
        'Refeições leves e fracionadas.',
        'Hidratação em pequenos goles.',
      ],
      sinaisAlerta: ['Vômitos persistentes, sinais de desidratação.', 'Dor abdominal forte, sangue.'],
    },
    Vômito: {
      medicamentosOTC: [
        { principioAtivo: 'dimenidrinato', categoria: 'Antiemético', observacao: 'seguir bula; atenção à sonolência' },
        {
          principioAtivo: 'sais de reidratação oral',
          categoria: 'Hidratação',
          observacao: 'prioridade: reidratar (SRO)',
        },
      ],
      dicasNaturais: ['SRO em pequenos volumes.', 'Dieta leve (arroz, banana, maçã) quando melhorar.'],
      sinaisAlerta: ['Vômito com sangue, fezes pretas.', 'Incapaz de manter líquidos por muitas horas.'],
    },
    Diarreia: {
      medicamentosOTC: [
        {
          principioAtivo: 'sais de reidratação oral',
          categoria: 'Hidratação',
          observacao: 'prioridade: evitar desidratação',
        },
      ],
      dicasNaturais: ['Hidratar (SRO, água, água de coco).', 'Evitar gorduras, álcool, cafeína.'],
      sinaisAlerta: ['Sangue nas fezes, febre alta, dor intensa.', 'Sinais de desidratação, muita fraqueza.'],
    },
    'Dor abdominal': {
      medicamentosOTC: [
        {
          principioAtivo: 'butilbrometo de escopolamina',
          categoria: 'Antiespasmódico',
          observacao: 'cólicas leves; seguir bula',
        },
        {
          principioAtivo: 'paracetamol',
          categoria: 'Analgésico',
          observacao: 'evitar anti-inflamatórios sem orientação em dor abdominal',
        },
      ],
      dicasNaturais: ['Compressa morna no abdome (se aliviar).', 'Alimentação leve; observar gatilhos.'],
      sinaisAlerta: ['Dor forte contínua, rigidez abdominal.', 'Dor no lado direito inferior com febre/vômito.'],
    },
    'Azia/Refluxo': {
      medicamentosOTC: [
        {
          principioAtivo: 'antiácido (hidróxido de alumínio + magnésio)',
          categoria: 'Antiácido',
          observacao: 'alívio rápido; seguir bula',
        },
        { principioAtivo: 'omeprazol', categoria: 'Protetor gástrico', observacao: 'uso curto seguindo bula; avaliar necessidade' },
      ],
      dicasNaturais: [
        'Evitar deitar logo após comer.',
        'Reduzir frituras, café, chocolate, álcool.',
        'Elevar a cabeceira da cama.',
      ],
      sinaisAlerta: ['Dor no peito intensa, falta de ar.', 'Vômitos com sangue ou fezes escuras.'],
    },
    Constipação: {
      medicamentosOTC: [
        { principioAtivo: 'psyllium', categoria: 'Fibra', observacao: 'tomar com bastante água' },
        { principioAtivo: 'lactulose', categoria: 'Laxativo osmótico', observacao: 'seguir bula; pode causar gases' },
      ],
      dicasNaturais: ['Aumentar água e fibras (frutas, verduras).', 'Caminhada leve.'],
      sinaisAlerta: ['Dor abdominal forte, distensão importante.', 'Vômitos, ausência total de gases/fezes.'],
    },
    Febre: {
      medicamentosOTC: [
        { principioAtivo: 'paracetamol', categoria: 'Antitérmico', observacao: 'seguir bula; atenção dose máxima' },
        { principioAtivo: 'dipirona', categoria: 'Antitérmico', observacao: 'seguir bula; evitar se alergia' },
      ],
      dicasNaturais: ['Hidratação e repouso.', 'Banho morno se desconforto.'],
      sinaisAlerta: ['Febre alta persistente, prostração importante.'],
    },
  },

  musculoesqueletico: {
    'Dor muscular': {
      medicamentosOTC: [
        { principioAtivo: 'paracetamol', categoria: 'Analgésico', observacao: 'seguir bula; evitar dose excessiva' },
        { principioAtivo: 'dipirona', categoria: 'Analgésico', observacao: 'seguir bula; evitar se alergia' },
        { principioAtivo: 'ibuprofeno', categoria: 'Anti-inflamatório', observacao: 'seguir bula; evitar se gastrite/rim/anticoagulante/gestante' },
      ],
      dicasNaturais: ['Repouso relativo.', 'Compressa morna 15–20 min.', 'Alongamento leve (se tolerado).', 'Hidratação.'],
      sinaisAlerta: ['Dor muito forte após trauma.', 'Fraqueza importante ou perda de movimento.', 'Febre alta associada.'],
    },
    'Dor articular': {
      medicamentosOTC: [
        { principioAtivo: 'paracetamol', categoria: 'Analgésico', observacao: 'seguir bula' },
        { principioAtivo: 'dipirona', categoria: 'Analgésico', observacao: 'seguir bula; evitar se alergia' },
        { principioAtivo: 'ibuprofeno', categoria: 'Anti-inflamatório', observacao: 'seguir bula; evitar se gastrite/rim/anticoagulante/gestante' },
      ],
      dicasNaturais: ['Gelo se inchaço recente.', 'Elevar o membro.', 'Repouso relativo.', 'Compressa morna se rigidez.'],
      sinaisAlerta: ['Articulação muito quente/vermelha.', 'Inchaço importante.', 'Incapacidade de apoiar/andar.'],
    },
    'Entorse/Trauma leve': {
      medicamentosOTC: [
        { principioAtivo: 'paracetamol', categoria: 'Analgésico', observacao: 'seguir bula' },
        { principioAtivo: 'dipirona', categoria: 'Analgésico', observacao: 'seguir bula; evitar se alergia' },
      ],
      dicasNaturais: ['Gelo 15–20 min 3–4x/dia nas primeiras 48h.', 'Elevar e comprimir levemente (se tolerado).', 'Repouso.'],
      sinaisAlerta: ['Deformidade.', 'Dor incapacitante.', 'Dormência/formigamento persistente.'],
    },
    Inchaço: {
      medicamentosOTC: [
        { principioAtivo: 'paracetamol', categoria: 'Analgésico', observacao: 'se dor associada; seguir bula' },
      ],
      dicasNaturais: ['Elevar o membro.', 'Gelo se recente.', 'Evitar sobrecarga.'],
      sinaisAlerta: ['Inchaço súbito com dor intensa.', 'Vermelhidão quente e febre.', 'Falta de ar associada.'],
    },
    Febre: {
      medicamentosOTC: [
        { principioAtivo: 'paracetamol', categoria: 'Antitérmico', observacao: 'seguir bula; atenção dose máxima' },
        { principioAtivo: 'dipirona', categoria: 'Antitérmico', observacao: 'seguir bula; evitar se alergia' },
      ],
      dicasNaturais: ['Hidratação e repouso.', 'Banho morno se desconforto.'],
      sinaisAlerta: ['Febre alta persistente e dor forte em articulação/músculo.'],
    },
    Rigidez: {
      medicamentosOTC: [{ principioAtivo: 'paracetamol', categoria: 'Analgésico', observacao: 'seguir bula' }],
      dicasNaturais: ['Compressa morna.', 'Alongamento leve e progressivo.', 'Movimentação suave.'],
      sinaisAlerta: ['Rigidez com febre alta.', 'Fraqueza importante.', 'Dor progressiva.'],
    },
  },

  urinario: {
    'Dor/ardor ao urinar': {
      medicamentosOTC: [
        { principioAtivo: 'fenazopiridina', categoria: 'Analgésico urinário', observacao: 'alívio temporário; pode mudar cor da urina; seguir bula' },
        { principioAtivo: 'paracetamol', categoria: 'Analgésico', observacao: 'seguir bula' },
      ],
      dicasNaturais: ['Hidratação (água ao longo do dia).', 'Evitar café, álcool e irritantes.', 'Urinar com frequência.'],
      sinaisAlerta: ['Febre.', 'Dor lombar forte.', 'Sangue na urina.'],
    },
    'Urgência urinária': {
      medicamentosOTC: [
        { principioAtivo: 'fenazopiridina', categoria: 'Analgésico urinário', observacao: 'alívio temporário; seguir bula' },
      ],
      dicasNaturais: ['Hidratação.', 'Evitar irritantes.', 'Não segurar urina.'],
      sinaisAlerta: ['Febre.', 'Dor lombar.', 'Piora progressiva.'],
    },
    'Aumento da frequência': {
      medicamentosOTC: [
        { principioAtivo: 'fenazopiridina', categoria: 'Analgésico urinário', observacao: 'alívio temporário; seguir bula' },
      ],
      dicasNaturais: ['Hidratação.', 'Evitar cafeína.', 'Observar urina.'],
      sinaisAlerta: ['Febre.', 'Dor lombar.', 'Sangue na urina.'],
    },
    'Dor lombar': {
      medicamentosOTC: [
        { principioAtivo: 'paracetamol', categoria: 'Analgésico', observacao: 'seguir bula' },
        { principioAtivo: 'dipirona', categoria: 'Analgésico', observacao: 'seguir bula; evitar se alergia' },
      ],
      dicasNaturais: ['Hidratação.', 'Compressa morna se muscular.', 'Repouso relativo.'],
      sinaisAlerta: ['Febre.', 'Dor lombar forte e persistente.', 'Náuseas/vômitos intensos.'],
    },
    Febre: {
      medicamentosOTC: [
        { principioAtivo: 'paracetamol', categoria: 'Antitérmico', observacao: 'seguir bula' },
        { principioAtivo: 'dipirona', categoria: 'Antitérmico', observacao: 'seguir bula; evitar se alergia' },
      ],
      dicasNaturais: ['Hidratação e repouso.'],
      sinaisAlerta: ['Febre com dor lombar.', 'Calafrios intensos.', 'Prostração importante.'],
    },
    'Urina com odor forte': {
      medicamentosOTC: [],
      dicasNaturais: ['Aumentar ingestão de água.', 'Observar sintomas associados.'],
      sinaisAlerta: ['Dor/ardor + febre.', 'Sangue na urina.', 'Dor lombar.'],
    },
  },

  neurologico: {
    'Dor de cabeça': {
      medicamentosOTC: [
        { principioAtivo: 'paracetamol', categoria: 'Analgésico', observacao: 'seguir bula; evitar excesso' },
        { principioAtivo: 'dipirona', categoria: 'Analgésico', observacao: 'seguir bula; evitar se alergia' },
      ],
      dicasNaturais: ['Hidratação.', 'Repouso em ambiente escuro/silencioso.', 'Compressa fria na testa.'],
      sinaisAlerta: ['Dor súbita muito forte ("pior da vida").', 'Rigidez de nuca e febre alta.', 'Desmaio/confusão.'],
    },
    Tontura: {
      medicamentosOTC: [
        { principioAtivo: 'dimenidrinato', categoria: 'Antiemético', observacao: 'pode dar sonolência; seguir bula' },
      ],
      dicasNaturais: ['Levantar devagar.', 'Hidratação.', 'Evitar dirigir se sintomático.'],
      sinaisAlerta: ['Desmaio.', 'Fraqueza em um lado.', 'Alteração na fala/visão.'],
    },
    Náusea: {
      medicamentosOTC: [
        { principioAtivo: 'dimenidrinato', categoria: 'Antiemético', observacao: 'pode dar sonolência; seguir bula' },
      ],
      dicasNaturais: ['Refeições leves.', 'Gengibre se tolerado.', 'Hidratação em pequenos goles.'],
      sinaisAlerta: ['Vômitos persistentes.', 'Desidratação.', 'Dor de cabeça intensa associada.'],
    },
    Fraqueza: {
      medicamentosOTC: [],
      dicasNaturais: ['Repouso.', 'Hidratação.', 'Alimentação leve.'],
      sinaisAlerta: ['Fraqueza em um lado do corpo.', 'Assimetria facial.', 'Alteração na fala.'],
    },
    Febre: {
      medicamentosOTC: [
        { principioAtivo: 'paracetamol', categoria: 'Antitérmico', observacao: 'seguir bula' },
        { principioAtivo: 'dipirona', categoria: 'Antitérmico', observacao: 'seguir bula; evitar se alergia' },
      ],
      dicasNaturais: ['Hidratação e repouso.'],
      sinaisAlerta: ['Febre + rigidez de nuca.', 'Confusão.', 'Manchas roxas.'],
    },
    Formigamento: {
      medicamentosOTC: [],
      dicasNaturais: ['Observar duração e gatilhos.', 'Evitar posições prolongadas.'],
      sinaisAlerta: ['Formigamento com fraqueza.', 'Alteração na fala/visão.', 'Dor no peito associada.'],
    },
  },

  ginecologico: {
    Cólicas: {
      medicamentosOTC: [
        { principioAtivo: 'paracetamol', categoria: 'Analgésico', observacao: 'seguir bula' },
        { principioAtivo: 'dipirona', categoria: 'Analgésico', observacao: 'seguir bula; evitar se alergia' },
        { principioAtivo: 'ibuprofeno', categoria: 'Anti-inflamatório', observacao: 'seguir bula; evitar se gestante/gastrite/rim/anticoagulante' },
      ],
      dicasNaturais: ['Compressa morna no baixo ventre.', 'Hidratação.', 'Repouso.'],
      sinaisAlerta: ['Dor muito forte/progressiva.', 'Desmaio.', 'Febre.'],
    },
    Corrimento: {
      medicamentosOTC: [],
      dicasNaturais: ['Evitar duchas íntimas.', 'Roupas íntimas de algodão.', 'Higiene adequada.'],
      sinaisAlerta: ['Corrimento com odor forte e dor.', 'Febre.', 'Dor pélvica importante.'],
    },
    Coceira: {
      medicamentosOTC: [],
      dicasNaturais: ['Evitar sabonetes perfumados.', 'Manter região seca.', 'Roupas leves.'],
      sinaisAlerta: ['Feridas/bolhas.', 'Febre.', 'Dor intensa.'],
    },
    'Dor pélvica': {
      medicamentosOTC: [
        { principioAtivo: 'paracetamol', categoria: 'Analgésico', observacao: 'seguir bula' },
        { principioAtivo: 'dipirona', categoria: 'Analgésico', observacao: 'seguir bula; evitar se alergia' },
      ],
      dicasNaturais: ['Repouso.', 'Compressa morna (se aliviar).'],
      sinaisAlerta: ['Dor pélvica forte súbita.', 'Sangramento intenso.', 'Febre alta.'],
    },
    'Atraso menstrual': {
      medicamentosOTC: [],
      dicasNaturais: ['Se houver chance de gestação, fazer teste.', 'Observar sinais associados.'],
      sinaisAlerta: ['Dor intensa com atraso.', 'Sangramento forte.', 'Desmaio/tontura intensa.'],
    },
    Febre: {
      medicamentosOTC: [
        { principioAtivo: 'paracetamol', categoria: 'Antitérmico', observacao: 'seguir bula' },
        { principioAtivo: 'dipirona', categoria: 'Antitérmico', observacao: 'seguir bula; evitar se alergia' },
      ],
      dicasNaturais: ['Hidratação e repouso.'],
      sinaisAlerta: ['Febre + dor pélvica.', 'Prostração importante.'],
    },
  },

  pediatrico: {
    Febre: {
      medicamentosOTC: [
        { principioAtivo: 'paracetamol', categoria: 'Antitérmico', observacao: 'pediatria: dose por peso/idade; seguir bula e orientação' },
        { principioAtivo: 'dipirona', categoria: 'Antitérmico', observacao: 'pediatria: dose por peso/idade; seguir bula e orientação' },
      ],
      dicasNaturais: ['Oferecer líquidos.', 'Roupas leves.', 'Banho morno se desconforto.'],
      sinaisAlerta: ['Prostração importante.', 'Convulsão.', 'Manchas roxas.'],
    },
    Tosse: {
      medicamentosOTC: [],
      dicasNaturais: ['Lavagem nasal com soro.', 'Hidratação.', 'Umidificar ambiente.'],
      sinaisAlerta: ['Dificuldade para respirar.', 'Chiado intenso.', 'Lábios arroxeados.'],
    },
    Coriza: {
      medicamentosOTC: [{ principioAtivo: 'solução salina', categoria: 'Higiene nasal', observacao: 'lavagem nasal (técnica correta)' }],
      dicasNaturais: ['Lavagem nasal frequente.', 'Hidratação.', 'Ambiente ventilado.'],
      sinaisAlerta: ['Febre alta persistente.', 'Recusa líquidos.'],
    },
    Diarreia: {
      medicamentosOTC: [{ principioAtivo: 'sais de reidratação oral', categoria: 'Hidratação', observacao: 'prioridade: evitar desidratação (SRO)' }],
      dicasNaturais: ['Hidratação fracionada.', 'Dieta leve.', 'Observar urina.'],
      sinaisAlerta: ['Sinais de desidratação.', 'Sangue nas fezes.', 'Prostração.'],
    },
    Vômito: {
      medicamentosOTC: [{ principioAtivo: 'sais de reidratação oral', categoria: 'Hidratação', observacao: 'pequenos goles frequentes' }],
      dicasNaturais: ['SRO em pequenos volumes.', 'Evitar grandes volumes de uma vez.'],
      sinaisAlerta: ['Não consegue manter líquidos.', 'Sonolência extrema.', 'Sangue no vômito.'],
    },
    Dor: {
      medicamentosOTC: [
        { principioAtivo: 'paracetamol', categoria: 'Analgésico', observacao: 'pediatria: dose por peso/idade' },
      ],
      dicasNaturais: ['Repouso.', 'Conforto e hidratação.'],
      sinaisAlerta: ['Dor intensa persistente.', 'Choro inconsolável.', 'Rigidez de nuca.'],
    },
    'Manchas na pele': {
      medicamentosOTC: [],
      dicasNaturais: ['Observar evolução.', 'Manter hidratação.', 'Evitar coçar.'],
      sinaisAlerta: ['Manchas roxas que não somem à pressão.', 'Febre alta.', 'Prostração.'],
    },
  },
};

function montarOrientacao(sistemaId: string, sintomas: string[], alergias: string[]) {
  const porSistema = ORIENTACOES[sistemaId] || {};

  const sinaisAlertaSet = new Set<string>();
  const dicasNaturaisSet = new Set<string>();
  const meds: MedSugestao[] = [];

  for (const sintoma of sintomas) {
    const item = porSistema[sintoma];
    if (!item) continue;

    item.sinaisAlerta.forEach((s) => sinaisAlertaSet.add(s));
    item.dicasNaturais.forEach((d) => dicasNaturaisSet.add(d));
    item.medicamentosOTC.forEach((m) => meds.push(m));
  }

  const medsFiltradas = meds.filter((m) => {
    const pa = normaliza(m.principioAtivo);
    return !alergias.some((a) => a && (pa.includes(a) || a.includes(pa)));
  });

  const seen = new Set<string>();
  const medsUnicas = medsFiltradas.filter((m) => {
    const key = `${normaliza(m.principioAtivo)}|${normaliza(m.categoria)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    medicamentos: medsUnicas,
    dicasNaturais: Array.from(dicasNaturaisSet),
    sinaisAlerta: Array.from(sinaisAlertaSet),
  };
}

/** ✅ NOVO: agrupa OTC por sintoma selecionado (didático) */
function montarOTCAgrupadoPorSintoma(args: {
  sistemaId: string;
  sintomasSelecionados: string[];
  alergias: string[];
}) {
  const { sistemaId, sintomasSelecionados, alergias } = args;
  const porSistema = ORIENTACOES[sistemaId] || {};

  const grupos: Array<{
    sintoma: string;
    medicamentos: MedSugestao[];
  }> = [];

  for (const sintoma of sintomasSelecionados) {
    const item = porSistema[sintoma];
    if (!item) continue;

    const medsFiltradas = (item.medicamentosOTC || []).filter((m) => {
      const pa = normaliza(m.principioAtivo);
      return !alergias.some((a) => a && (pa.includes(a) || a.includes(pa)));
    });

    const seen = new Set<string>();
    const medsUnicas = medsFiltradas.filter((m) => {
      const key = `${normaliza(m.principioAtivo)}|${normaliza(m.categoria)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    grupos.push({ sintoma, medicamentos: medsUnicas });
  }

  return grupos.filter((g) => g.medicamentos.length > 0);
}

function classificarRisco(sistemaId: string, sintomas: string[], ctx: ContextoTriagem) {
  const s = new Set(sintomas.map(normaliza));
  const motivos: string[] = [];

  const has = (label: string) => s.has(normaliza(label));
  const any = (labels: string[]) => labels.some((x) => has(x));

  // 1) Regras gerais de segurança (independente do sistema)
  if (ctx.incapazHidratar) {
    motivos.push('Incapacidade de manter líquidos pode levar à desidratação importante.');
    return { risco: 'alto' as RiscoNivel, motivos };
  }

  if (ctx.dorForte) {
    motivos.push('Dor forte merece avaliação, especialmente se persistente ou com piora.');
    return { risco: 'alto' as RiscoNivel, motivos };
  }

  // 2) Gatilhos de ALTO risco por sistema (sem inventar sintomas fora da lista do app)
  const sid = normaliza(sistemaId);

  if (sid === normaliza('respiratorio')) {
    if (any(['Falta de ar', 'Dor torácica', 'Chiado no peito'])) {
      if (has('Falta de ar')) motivos.push('Falta de ar pode indicar urgência respiratória.');
      if (has('Dor torácica')) motivos.push('Dor no peito pode indicar condição grave.');
      if (has('Chiado no peito')) motivos.push('Chiado com desconforto pode evoluir rapidamente.');
      return { risco: 'alto' as RiscoNivel, motivos };
    }
  }

  if (sid === normaliza('urinario')) {
    // febre + dor lombar = suspeita de infecção mais importante / pielonefrite
    if (has('Febre') && has('Dor lombar')) {
      motivos.push('Febre com dor lombar pode indicar infecção urinária mais significativa.');
      return { risco: 'alto' as RiscoNivel, motivos };
    }
  }

  if (sid === normaliza('gastrointestinal')) {
    // febre + dor abdominal sugere maior atenção
    if (has('Febre') && has('Dor abdominal')) {
      motivos.push('Febre com dor abdominal pode exigir avaliação presencial.');
      return { risco: 'alto' as RiscoNivel, motivos };
    }
  }

  if (sid === normaliza('neurologico')) {
    // como o seu sistema neurológico tem "Fraqueza", tratamos com mais cautela
    if (has('Fraqueza')) {
      motivos.push('Fraqueza pode indicar condição neurológica que exige avaliação.');
      return { risco: 'alto' as RiscoNivel, motivos };
    }
  }

  if (sid === normaliza('ginecologico')) {
    // febre + dor pélvica = maior cautela
    if (has('Febre') && has('Dor pélvica')) {
      motivos.push('Febre com dor pélvica pode indicar infecção e merece avaliação.');
      return { risco: 'alto' as RiscoNivel, motivos };
    }
  }

  // 3) Regras de MODERADO (contexto e combinações comuns)
  const temFebre = has('Febre');
  if (temFebre) {
    motivos.push('Febre pode exigir acompanhamento, principalmente se persistente.');

    if (ctx.dias !== null && ctx.dias >= 3) {
      motivos.push('Sintomas por 3 dias ou mais aumentam necessidade de avaliação.');
      return { risco: 'moderado' as RiscoNivel, motivos };
    }

    if (ctx.idade !== null && (ctx.idade < 2 || ctx.idade >= 65)) {
      motivos.push('Extremos de idade merecem atenção maior em quadros febris.');
      return { risco: 'moderado' as RiscoNivel, motivos };
    }

    if (sid === normaliza('gastrointestinal') && (has('Vômito') || has('Diarreia'))) {
      motivos.push('Vômito/diarreia com febre aumenta risco de desidratação.');
      return { risco: 'moderado' as RiscoNivel, motivos };
    }

    if (sid === normaliza('urinario') && (has('Dor lombar') || has('Dor/ardor ao urinar') || has('Urgência urinária'))) {
      motivos.push('Febre com sintomas urinários pode indicar infecção mais importante.');
      return { risco: 'moderado' as RiscoNivel, motivos };
    }
  }

  if (sintomas.length >= 4) {
    motivos.push('Vários sintomas ao mesmo tempo podem indicar quadro mais intenso.');
    return { risco: 'moderado' as RiscoNivel, motivos };
  }

  if (ctx.gestante) {
    motivos.push('Gestação exige orientação mais cautelosa e avaliação individual.');
    return { risco: 'moderado' as RiscoNivel, motivos };
  }

  // 4) BAIXO (padrão)
  return { risco: 'baixo' as RiscoNivel, motivos: ['Quadro aparenta ser leve pelos dados informados.'] };
}


function montarTextoCompartilhar(args: {
  tituloSistema: string;
  sintomas: string[];
  alergias: string[];
  ctx: ContextoTriagem;
  risco: { risco: RiscoNivel; motivos: string[] };
  orientacao: { sinaisAlerta: string[]; medicamentos: MedSugestao[]; dicasNaturais: string[] };
  mostrarOTC: boolean;
}) {
  const { tituloSistema, sintomas, alergias, ctx, risco, orientacao, mostrarOTC } = args;

  const linhas: string[] = [];
  linhas.push(`TRIAGEM — GUIA DE BOLSO`);
  linhas.push(`Sistema: ${tituloSistema}`);
  linhas.push(`Risco: ${etiquetaRisco(risco.risco)}`);
  linhas.push('');

  linhas.push(`Sintomas: ${sintomas.length ? sintomas.join(', ') : '-'}`);
  linhas.push(`Alergias: ${alergias.length ? alergias.join(', ') : 'Nenhuma'}`);
  linhas.push(
    `Contexto: ${ctx.idade !== null ? `${ctx.idade} anos` : 'idade n/i'} • ${ctx.dias !== null ? `${ctx.dias} dias` : 'dias n/i'} • ${
      ctx.gestante ? 'gestante' : 'não gestante'
    }`
  );
  linhas.push('');

  linhas.push('Motivos do risco:');
  risco.motivos.forEach((m) => linhas.push(`- ${m}`));
  linhas.push('');

  linhas.push('Quando procurar atendimento (alertas):');
  const alertas = orientacao.sinaisAlerta.length ? orientacao.sinaisAlerta : ['Se piora importante, procure atendimento.'];
  alertas.slice(0, 8).forEach((a) => linhas.push(`- ${a}`));
  linhas.push(`- Se houver piora rápida, prostração importante, confusão, desmaio.`);
  linhas.push('');

  if (mostrarOTC) {
    linhas.push('Sugestão OTC (sem receita) — siga a bula e peça orientação ao farmacêutico:');
    if (!orientacao.medicamentos.length) {
      linhas.push('- Sem sugestão OTC cadastrada (ou filtrada por alergia).');
    } else {
      orientacao.medicamentos.slice(0, 10).forEach((m) => linhas.push(`- ${m.principioAtivo} (${m.categoria}) — ${m.observacao}`));
    }
    linhas.push('');
  } else {
    linhas.push('OTC: não exibido (por segurança neste caso).');
    linhas.push('');
  }

  linhas.push('Dicas naturais:');
  const dicas = orientacao.dicasNaturais.length ? orientacao.dicasNaturais : ['Hidratação, repouso e alimentação leve.'];
  dicas.slice(0, 10).forEach((d) => linhas.push(`- ${d}`));
  linhas.push('');

  linhas.push('Importante: Este app não substitui consulta médica.');
  return linhas.join('\n');
}

function parsePipeList(raw: string | null) {
  if (!raw) return [];
  return raw
    .split('|')
    .map((s) => String(s || '').trim())
    .filter(Boolean);
}

function parseBool(raw: string | null) {
  if (!raw) return false;
  const v = String(raw).toLowerCase().trim();
  return v === '1' || v === 'true' || v === 'sim' || v === 'yes' || v === 'on';
}

export default function SistemaClient({ sistema }: { sistema: string }) {
  const searchParams = useSearchParams();

  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [alergiaTexto, setAlergiaTexto] = useState('');
  const [busca, setBusca] = useState('');
  const [mostrarResultado, setMostrarResultado] = useState(false);

  const [idadeTexto, setIdadeTexto] = useState('');
  const [diasTexto, setDiasTexto] = useState('');
  const [gestante, setGestante] = useState(false);
  const [dorForte, setDorForte] = useState(false);
  const [incapazHidratar, setIncapazHidratar] = useState(false);

  const [tab, setTab] = useState<TabKey>('resumo');
  const [copiado, setCopiado] = useState(false);

  const sistemaId = useMemo(() => normaliza(sistema), [sistema]);

  const config = useMemo(() => {
    return SISTEMAS.find((s) => s.id === sistemaId) || null;
  }, [sistemaId]);

  useEffect(() => {
    if (!config) return;

    const sintomasQS = parsePipeList(searchParams.get('sintomas'));
    if (sintomasQS.length) {
      const mapPorNorm = new Map(config.sintomas.map((s) => [normaliza(s), s] as const));
      const selecionadosOk = sintomasQS
        .map((x) => mapPorNorm.get(normaliza(x)) || null)
        .filter(Boolean) as string[];
      if (selecionadosOk.length) setSelecionados(selecionadosOk);
    }

    const alergiasQS = parsePipeList(searchParams.get('alergias'));
    if (alergiasQS.length) setAlergiaTexto(alergiasQS.join(', '));

    const idadeQS = searchParams.get('idade');
    const diasQS = searchParams.get('dias');
    if (idadeQS && String(idadeQS).trim()) setIdadeTexto(String(idadeQS));
    if (diasQS && String(diasQS).trim()) setDiasTexto(String(diasQS));

    setGestante(parseBool(searchParams.get('gestante')));
    setDorForte(parseBool(searchParams.get('dorForte')));
    setIncapazHidratar(parseBool(searchParams.get('incapazHidratar')));

    setMostrarResultado(false);
    setCopiado(false);
    setTab('resumo');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  const sintomasFiltrados = useMemo(() => {
    if (!config) return [];
    const q = normaliza(busca);
    if (!q) return config.sintomas;
    return config.sintomas.filter((s) => normaliza(s).includes(q));
  }, [config, busca]);

  const alergias = useMemo(() => parseAlergias(alergiaTexto), [alergiaTexto]);

  const ctx: ContextoTriagem = useMemo(() => {
    const idade = idadeTexto.trim() ? parseNumeroSeguro(idadeTexto) : null;
    const dias = diasTexto.trim() ? parseNumeroSeguro(diasTexto) : null;

    return {
      idade: idade === null ? null : Math.floor(idade),
      dias: dias === null ? null : Math.floor(dias),
      gestante,
      dorForte,
      incapazHidratar,
    };
  }, [idadeTexto, diasTexto, gestante, dorForte, incapazHidratar]);

  const orientacao = useMemo(() => {
    if (!config) return null;
    return montarOrientacao(config.id, selecionados, alergias);
  }, [config, selecionados, alergias]);

  const riscoInfo = useMemo(() => {
    if (!config) return null;
    return classificarRisco(config.id, selecionados, ctx);
  }, [config, selecionados, ctx]);

  const mostrarOTC = useMemo(() => {
    if (!riscoInfo) return false;
    if (riscoInfo.risco === 'alto') return false;
    if (ctx.gestante) return false;
    return true;
  }, [riscoInfo, ctx.gestante]);

  const otcAgrupado = useMemo(() => {
    if (!config) return [];
    return montarOTCAgrupadoPorSintoma({
      sistemaId: config.id,
      sintomasSelecionados: selecionados,
      alergias,
    });
  }, [config, selecionados, alergias]);

  function toggleSintoma(sintoma: string) {
    setMostrarResultado(false);
    setCopiado(false);
    setSelecionados((prev) => {
      const has = prev.includes(sintoma);
      if (has) return prev.filter((x) => x !== sintoma);
      return [...prev, sintoma];
    });
  }

  function gerarOrientacao() {
    setMostrarResultado(true);
    setCopiado(false);
    setTab('resumo');
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  async function onCopiar() {
    if (!config || !orientacao || !riscoInfo) return;

    const texto = montarTextoCompartilhar({
      tituloSistema: config.titulo,
      sintomas: selecionados,
      alergias,
      ctx,
      risco: riscoInfo,
      orientacao,
      mostrarOTC,
    });

    const ok = await copiarTexto(texto);
    setCopiado(ok);

    salvarNoHistorico({
      id: gerarId(),
      dataISO: new Date().toISOString(),
      sistema: config.titulo,
      risco: riscoInfo.risco,
      sintomas: selecionados,
      alergias,
      idade: ctx.idade,
      dias: ctx.dias,
      gestante: ctx.gestante,
      textoCompartilhavel: texto,
      sistemaKey: config.id,
      // campos extras opcionais para reabrir (se seu tipo aceitar):
      dorForte: ctx.dorForte,
      incapazHidratar: ctx.incapazHidratar,
    } as any);

    if (!ok) {
      alert('Não consegui copiar automaticamente. Selecione e copie manualmente.');
    }
  }

  function onWhatsApp() {
    if (!config || !orientacao || !riscoInfo) return;

    const texto = montarTextoCompartilhar({
      tituloSistema: config.titulo,
      sintomas: selecionados,
      alergias,
      ctx,
      risco: riscoInfo,
      orientacao,
      mostrarOTC,
    });

    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  }

  if (!config) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-semibold">Sistema não encontrado</h1>
        <p className="mt-2 text-gray-600">Volte e selecione um sistema na página de triagem.</p>
        <div className="mt-6">
          <a href="/triagem" className="inline-flex rounded-md bg-black px-4 py-2 text-white">
            Voltar para triagem
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold">{config.titulo}</h1>
      <p className="mt-2 text-gray-600">Selecione os sintomas apresentados:</p>

      <div className="mt-6">
        <label className="text-sm font-medium text-gray-700">Buscar sintoma</label>
        <input
          className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2"
          placeholder="Ex: febre, tosse, dor..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="mt-6 space-y-3">
        {sintomasFiltrados.map((sintoma) => {
          const checked = selecionados.includes(sintoma);
          return (
            <label
              key={sintoma}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-300 px-4 py-4"
            >
              <input type="checkbox" checked={checked} onChange={() => toggleSintoma(sintoma)} className="h-4 w-4" />
              <span className="text-base">{sintoma}</span>
            </label>
          );
        })}
      </div>

      {/* Perguntas rápidas */}
      <div className="mt-10 rounded-xl border border-gray-300 p-5">
        <h2 className="text-lg font-semibold">Perguntas rápidas (segurança)</h2>
        <p className="mt-1 text-sm text-gray-600">Essas respostas ajudam o app a classificar o risco com mais precisão.</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-gray-700">Idade (anos)</label>
            <input
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2"
              placeholder="Ex: 33"
              value={idadeTexto}
              onChange={(e) => setIdadeTexto(e.target.value)}
              inputMode="numeric"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Há quantos dias?</label>
            <input
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2"
              placeholder="Ex: 2"
              value={diasTexto}
              onChange={(e) => setDiasTexto(e.target.value)}
              inputMode="numeric"
            />
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={gestante} onChange={(e) => setGestante(e.target.checked)} />
            Gestante?
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={dorForte} onChange={(e) => setDorForte(e.target.checked)} />
            Dor forte (8/10 ou pior)?
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={incapazHidratar} onChange={(e) => setIncapazHidratar(e.target.checked)} />
            Não consegue manter líquidos (vomita tudo / desidratação)?
          </label>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          Se tiver sinais de alerta importantes, o app recomenda atendimento mesmo em quadros aparentemente simples.
        </div>
      </div>

      <div className="mt-10">
        <label className="text-sm font-medium text-gray-700">Possui alergia a algum medicamento?</label>
        <input
          className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2"
          placeholder="Ex: dipirona, paracetamol..."
          value={alergiaTexto}
          onChange={(e) => setAlergiaTexto(e.target.value)}
        />
        <p className="mt-2 text-xs text-gray-500">Dica: separe por vírgulas. Ex: dipirona, ibuprofeno</p>
      </div>

      <button
        onClick={gerarOrientacao}
        disabled={selecionados.length === 0}
        className="mt-8 w-full rounded-xl bg-black px-6 py-4 text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        Gerar orientação
      </button>

      {mostrarResultado && orientacao && riscoInfo && (
        <div className="mt-10 space-y-6">
          {/* RISCO */}
          <div className="rounded-xl border border-gray-300 p-5">
            <h2 className="text-lg font-semibold">
              Classificação de risco:{' '}
              <span className={corRisco(riscoInfo.risco)}>{etiquetaRisco(riscoInfo.risco)}</span>
            </h2>

            <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 space-y-1">
              {riscoInfo.motivos.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>

            {(riscoInfo.risco === 'alto' || ctx.gestante) && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <b>Orientação segura:</b> para este caso, recomendamos <b>procurar atendimento</b>. O app não exibirá sugestões de medicação.
              </div>
            )}
          </div>

          {/* CONTROLES */}
          <div className="rounded-xl border border-gray-300 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {(['resumo', 'alerta', 'otc', 'dicas'] as TabKey[]).map((k) => (
                  <button key={k} type="button" className={botaoTabClasses(tab === k)} onClick={() => setTab(k)}>
                    {labelTab(k)}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={onCopiar} className="rounded-xl bg-black px-4 py-2 text-sm text-white hover:opacity-90">
                  {copiado ? 'Copiado ✅ (salvo no histórico)' : 'Copiar orientação'}
                </button>

                <button
                  type="button"
                  onClick={onWhatsApp}
                  className="rounded-xl bg-green-600 px-4 py-2 text-sm text-white hover:opacity-90"
                >
                  Abrir no WhatsApp
                </button>
              </div>
            </div>

            <p className="mt-3 text-xs text-gray-500">“Copiar orientação” também salva automaticamente no Histórico.</p>
          </div>

          {tab === 'resumo' && (
            <div className="rounded-xl border border-gray-300 p-5">
              <h2 className="text-lg font-semibold">Resumo</h2>
              <p className="mt-2 text-sm text-gray-700">
                Sintomas selecionados: <span className="font-medium">{selecionados.join(', ') || '-'}</span>
              </p>
              <p className="mt-1 text-sm text-gray-700">
                Alergias informadas: <span className="font-medium">{alergias.join(', ') || 'Nenhuma'}</span>
              </p>
              <p className="mt-1 text-sm text-gray-700">
                Contexto:{' '}
                <span className="font-medium">
                  {ctx.idade !== null ? `${ctx.idade} anos` : 'idade n/i'} • {ctx.dias !== null ? `${ctx.dias} dias` : 'dias n/i'} •{' '}
                  {ctx.gestante ? 'gestante' : 'não gestante'}
                </span>
              </p>
            </div>
          )}

          {tab === 'alerta' && (
            <div className="rounded-xl border border-gray-300 p-5">
              <h2 className="text-lg font-semibold">Quando procurar atendimento</h2>
              <p className="mt-2 text-sm text-gray-700">
                Se ocorrer qualquer item abaixo, procure atendimento. Em caso de piora rápida, vá para atendimento imediatamente.
              </p>

              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-700">
                {(orientacao.sinaisAlerta.length ? orientacao.sinaisAlerta : ['Se piora importante, procure atendimento.']).map((s) => (
                  <li key={s}>{s}</li>
                ))}
                <li>Desmaio, confusão, sonolência extrema.</li>
                <li>Prostração importante, incapacidade de beber líquidos.</li>
                <li>Piora progressiva apesar das medidas básicas.</li>
              </ul>
            </div>
          )}

          {tab === 'otc' && (
            <div className="rounded-xl border border-gray-300 p-5">
              <h2 className="text-lg font-semibold">Sugestão de medicação OTC (sem receita)</h2>

              {!mostrarOTC ? (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  Por segurança, este app <b>não exibirá OTC</b> (risco alto ou gestante). Procure atendimento/ orientação profissional.
                </div>
              ) : otcAgrupado.length === 0 ? (
                <p className="mt-3 text-sm text-gray-700">
                  Para os sintomas selecionados, não há sugestão OTC cadastrada (ou foi filtrada por alergia). Considere medidas naturais e procure
                  orientação do farmacêutico.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {otcAgrupado.map((grupo) => (
                    <div key={grupo.sintoma} className="rounded-xl border border-gray-200 p-4">
                      <div className="text-sm font-semibold text-gray-900">
                        Sintoma: <span className="font-bold">{grupo.sintoma}</span>
                      </div>

                      <ul className="mt-3 space-y-3 text-sm text-gray-700">
                        {grupo.medicamentos.map((m) => (
                          <li key={`${grupo.sintoma}-${m.principioAtivo}-${m.categoria}`} className="rounded-lg border border-gray-100 p-3">
                            <div className="font-medium">
                              {m.principioAtivo} <span className="text-gray-500">({m.categoria})</span>
                            </div>
                            <div className="mt-1 text-gray-600">{m.observacao}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              <p className="mt-4 text-xs text-gray-500">
                Importante: siga a bula e peça orientação ao farmacêutico. Este app não substitui consulta médica.
              </p>
            </div>
          )}

          {tab === 'dicas' && (
            <div className="rounded-xl border border-gray-300 p-5">
              <h2 className="text-lg font-semibold">Dicas naturais e cuidados</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-700">
                {(orientacao.dicasNaturais.length ? orientacao.dicasNaturais : ['Hidratação, repouso e alimentação leve.']).map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
