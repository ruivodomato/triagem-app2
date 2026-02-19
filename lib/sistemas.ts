export type Risco = "baixo" | "moderado" | "alto";

export type MedicacaoOTC = {
  id: string;
  nome: string;
  principioAtivo: string;
  categoria:
    | "analgesico_antitermico"
    | "antiinflamatorio"
    | "antialergico"
    | "descongestionante_nasal"
    | "expectorante"
    | "antiacido"
    | "antidiarreico"
    | "antiflatulencia"
    | "antiemetico"
    | "urinario_analgesico"
    | "hidratacao";
  observacao?: string;
};

export type PerfilSeguranca = {
  gestante: boolean;
  criancaMenor12: boolean;
  riscoGastriteRimAnticoagulante: boolean;
};

export type SistemaConfig = {
  nome: string;
  sintomas: string[];
  sinaisAlerta: string[];
  medicacoes: MedicacaoOTC[];
  medicacoesPorSintoma: Record<string, string[]>;
  medidasNaturais: string[];

  avaliar: (sintomasSelecionados: string[]) => {
    risco: Risco;
    mensagem: string;
    motivos?: string[];
  };

  temAlerta: (sintomasSelecionados: string[]) => boolean;
  alertasAtivados: (sintomasSelecionados: string[]) => string[];
};

function normalizaTexto(s: string) {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/** sinônimos para filtro de alergia (básico e útil) */
const ALERGIA_SINONIMOS: Record<string, string[]> = {
  dipirona: ["dipirona", "novalgina", "metamizol"],
  paracetamol: ["paracetamol", "tylenol", "acetaminofeno", "acetaminophen"],
  ibuprofeno: ["ibuprofeno", "advil", "motrin"],
  naproxeno: ["naproxeno", "flanax"],
  diclofenaco: ["diclofenaco", "voltaren"],
  loratadina: ["loratadina", "claritin"],
  cetirizina: ["cetirizina", "zyrtec"],
  simeticona: ["simeticona", "luftal"],
  loperamida: ["loperamida", "imosec"],
  bismuto: ["subsalicilato de bismuto", "bismuto", "pepto", "pepto-bismol"],
  omeprazol: ["omeprazol", "losec"],
  famotidina: ["famotidina", "pepcid"],
  brometo_butilescopolamina: [
    "butilbrometo de escopolamina",
    "buscopan",
    "brometo de butilescopolamina",
  ],
  dimenidrinato: ["dimenidrinato", "dramin"],
  meclizina: ["meclizina"],
  fenazopiridina: ["fenazopiridina", "pyridium"],
  salicilato: ["aas", "acido acetilsalicilico", "aspirina", "salicilato"],
  guaifenesina: ["guaifenesina"],
};

function alergiaBateNoPrincipioAtivo(alergiaDigitada: string, principioAtivo: string) {
  const a = normalizaTexto(alergiaDigitada);
  const p = normalizaTexto(principioAtivo);

  if (!a) return false;
  if (a.includes(p)) return true;

  for (const [chave, sinonimos] of Object.entries(ALERGIA_SINONIMOS)) {
    const chaveNorm = normalizaTexto(chave);
    const sinNorm = sinonimos.map(normalizaTexto);

    const alergiaRefereChave = sinNorm.some((sx) => a.includes(sx));
    if (!alergiaRefereChave) continue;

    if (p.includes(chaveNorm)) return true;
    if (sinNorm.some((sx) => p.includes(sx))) return true;
  }

  return false;
}

function filtrarPorAlergia(meds: MedicacaoOTC[], alergiaDigitada: string) {
  if (!alergiaDigitada?.trim()) return meds;
  return meds.filter((m) => !alergiaBateNoPrincipioAtivo(alergiaDigitada, m.principioAtivo));
}

/**
 * Regras simples e seguras:
 * - Se gestante OU criança <12 OU risco gastrite/rim/anticoagulante => remover anti-inflamatórios (AINEs)
 */
function filtrarPorPerfilSeguranca(meds: MedicacaoOTC[], perfil: PerfilSeguranca) {
  const bloquearAINE =
    perfil.gestante || perfil.criancaMenor12 || perfil.riscoGastriteRimAnticoagulante;

  if (!bloquearAINE) return meds;

  return meds.filter((m) => m.categoria !== "antiinflamatorio");
}

function medicacoesPorSintomas(cfg: SistemaConfig, sintomasSelecionados: string[]): MedicacaoOTC[] {
  const ids = new Set<string>();

  for (const s of sintomasSelecionados) {
    const lista = cfg.medicacoesPorSintoma[s];
    if (lista && lista.length > 0) {
      for (const id of lista) ids.add(id);
    }
  }

  if (ids.size === 0) return cfg.medicacoes;
  return cfg.medicacoes.filter((m) => ids.has(m.id));
}

/* =========================================================
   RESPIRATÓRIO
========================================================= */

function respiratorioConfig(): SistemaConfig {
  const sintomas = [
    "Tosse seca",
    "Tosse com catarro",
    "Falta de ar",
    "Chiado no peito",
    "Dor torácica",
    "Febre",
    "Coriza/espirros",
    "Dor de garganta",
    "Rouquidão",
    "Sangue no escarro",
  ];

  const sinaisAlerta = [
    "Falta de ar",
    "Dor torácica",
    "Chiado no peito",
    "Sangue no escarro",
  ];

  const medicacoes: MedicacaoOTC[] = [
    {
      id: "paracetamol",
      nome: "Analgésico/antitérmico (ex: paracetamol)",
      principioAtivo: "paracetamol",
      categoria: "analgesico_antitermico",
      observacao: "Pode ajudar em febre e dores leves. Leia a bula.",
    },
    {
      id: "dipirona",
      nome: "Analgésico/antitérmico (ex: dipirona)",
      principioAtivo: "dipirona",
      categoria: "analgesico_antitermico",
      observacao: "Pode ajudar em febre e dores leves. Leia a bula.",
    },
    {
      id: "loratadina",
      nome: "Antialérgico (ex: loratadina)",
      principioAtivo: "loratadina",
      categoria: "antialergico",
      observacao: "Pode ajudar em coriza/espirros alérgicos. Leia a bula.",
    },
    {
      id: "cetirizina",
      nome: "Antialérgico (ex: cetirizina)",
      principioAtivo: "cetirizina",
      categoria: "antialergico",
      observacao: "Pode dar sonolência em algumas pessoas. Leia a bula.",
    },
    {
      id: "salina_nasal",
      nome: "Soro fisiológico nasal (lavagem)",
      principioAtivo: "solucao salina (cloreto de sodio)",
      categoria: "descongestionante_nasal",
      observacao: "Ajuda em coriza/congestão. Técnica correta faz diferença.",
    },
    {
      id: "guaifenesina",
      nome: "Expectorante (ex: guaifenesina) — quando aplicável",
      principioAtivo: "guaifenesina",
      categoria: "expectorante",
      observacao: "Pode ajudar quando há catarro. Peça orientação ao farmacêutico.",
    },
  ];

  const medicacoesPorSintoma: Record<string, string[]> = {
    Febre: ["paracetamol", "dipirona"],
    "Dor torácica": ["paracetamol", "dipirona"],
    "Tosse com catarro": ["guaifenesina"],
    "Tosse seca": [],
    "Coriza/espirros": ["loratadina", "cetirizina", "salina_nasal"],
    "Dor de garganta": ["paracetamol", "dipirona"],
    Rouquidão: [],
    "Falta de ar": [],
    "Chiado no peito": [],
    "Sangue no escarro": [],
  };

  const medidasNaturais = [
    "Hidratar-se bem (água, sopas, chás).",
    "Repouso e evitar esforço excessivo.",
    "Lavagem nasal com soro fisiológico.",
    "Evitar fumaça/cigarro, poeira e cheiros fortes.",
    "Ambiente ventilado; umidificação pode ajudar (com cuidado).",
    "Mel pode aliviar irritação da garganta (evitar em menores de 1 ano).",
  ];

  function temAlerta(sel: string[]) {
    const set = new Set(sel.map(normalizaTexto));
    return sinaisAlerta.some((a) => set.has(normalizaTexto(a)));
  }

  function alertasAtivados(sel: string[]) {
    const set = new Set(sel.map(normalizaTexto));
    return sinaisAlerta.filter((a) => set.has(normalizaTexto(a)));
  }

function avaliar(sel: string[]): { risco: Risco; mensagem: string; motivos?: string[] } {
    const set = new Set(sel.map(normalizaTexto));

    const faltaAr = set.has(normalizaTexto("Falta de ar"));
    const dorToracica = set.has(normalizaTexto("Dor torácica"));
    const chiado = set.has(normalizaTexto("Chiado no peito"));
    const sangue = set.has(normalizaTexto("Sangue no escarro"));

    const febre = set.has(normalizaTexto("Febre"));
    const tosse = set.has(normalizaTexto("Tosse seca")) || set.has(normalizaTexto("Tosse com catarro"));

    if (faltaAr || dorToracica || chiado || sangue) {
      return {
        risco: "alto",
        mensagem:
          "Há sinais de alerta respiratórios. Procure atendimento (UPA/PS). Se piora rápida, lábios arroxeados, confusão, desmaio ou grande dificuldade para respirar, procure ajuda imediatamente.",
        motivos: alertasAtivados(sel),
      };
    }

    if (febre && tosse) {
      return {
        risco: "moderado",
        mensagem:
          "Sem sinais de alerta no momento. Faça medidas de suporte (hidratação, repouso). Procure avaliação se não melhorar em 48–72h, se a febre persistir, ou se houver piora.",
        motivos: ["Febre + tosse"],
      };
    }

    if (tosse || set.has(normalizaTexto("Coriza/espirros")) || set.has(normalizaTexto("Dor de garganta"))) {
      return {
        risco: "baixo",
        mensagem:
          "Quadro leve na maioria dos casos. Faça medidas de suporte. Procure atendimento se surgir falta de ar, dor torácica, chiado importante, sangue no escarro ou febre alta persistente.",
        motivos: [],
      };
    }

    return { risco: "baixo", mensagem: "Selecione ao menos um sintoma.", motivos: [] };
  }

  return {
    nome: "Respiratório",
    sintomas,
    sinaisAlerta,
    medicacoes,
    medicacoesPorSintoma,
    medidasNaturais,
    avaliar,
    temAlerta,
    alertasAtivados,
  };
}

/* =========================================================
   GASTROINTESTINAL
========================================================= */

function gastrointestinalConfig(): SistemaConfig {
  const sintomas = [
    "Náusea",
    "Vômito",
    "Diarreia",
    "Dor abdominal",
    "Azia/queimação",
    "Gases/inchaço abdominal",
    "Constipação",
    "Sinais de desidratação",
    "Sangue nas fezes",
    "Fezes pretas (melena)",
  ];

  const sinaisAlerta = [
    "Sangue nas fezes",
    "Fezes pretas (melena)",
    "Sinais de desidratação",
    "Dor abdominal",
    "Vômito",
  ];

  const medicacoes: MedicacaoOTC[] = [
    {
      id: "sro",
      nome: "Sais de reidratação oral (SRO)",
      principioAtivo: "sais de reidratacao oral",
      categoria: "hidratacao",
      observacao: "Prioridade em diarreia/vômitos: repor líquidos e sais.",
    },
    {
      id: "simeticona",
      nome: "Antiflatulência (ex: simeticona)",
      principioAtivo: "simeticona",
      categoria: "antiflatulencia",
      observacao: "Pode ajudar em gases e desconforto abdominal leve.",
    },
    {
      id: "buscopan",
      nome: "Antiespasmódico (ex: butilbrometo de escopolamina) — quando aplicável",
      principioAtivo: "butilbrometo de escopolamina",
      categoria: "antiemetico",
      observacao: "Pode ajudar em cólicas leves. Leia a bula e peça orientação ao farmacêutico.",
    },
    {
      id: "antiacido",
      nome: "Antiácido (ex: hidróxido de alumínio/magnésio)",
      principioAtivo: "hidroxido de aluminio/magnesio",
      categoria: "antiacido",
      observacao: "Pode aliviar azia/queimação leve.",
    },
    {
      id: "famotidina",
      nome: "Bloqueador H2 (ex: famotidina) — quando aplicável",
      principioAtivo: "famotidina",
      categoria: "antiacido",
      observacao: "Pode ajudar em azia. Leia a bula.",
    },
    {
      id: "omeprazol",
      nome: "Inibidor de acidez (ex: omeprazol) — quando aplicável",
      principioAtivo: "omeprazol",
      categoria: "antiacido",
      observacao: "Pode ajudar em refluxo/azia recorrente. Leia a bula.",
    },
    {
      id: "loperamida",
      nome: "Antidiarreico (ex: loperamida) — quando aplicável",
      principioAtivo: "loperamida",
      categoria: "antidiarreico",
      observacao: "Evitar se houver sangue nas fezes, febre alta ou suspeita de infecção importante. Leia a bula.",
    },
    {
      id: "bismuto",
      nome: "Subsalicilato de bismuto — quando aplicável",
      principioAtivo: "subsalicilato de bismuto",
      categoria: "antidiarreico",
      observacao: "Evitar em alergia a salicilatos. Leia a bula.",
    },
  ];

  const medicacoesPorSintoma: Record<string, string[]> = {
    "Sinais de desidratação": ["sro"],
    Diarreia: ["sro", "loperamida", "bismuto"],
    Vômito: ["sro"],
    Náusea: ["sro"],
    "Azia/queimação": ["antiacido", "famotidina", "omeprazol"],
    "Gases/inchaço abdominal": ["simeticona"],
    "Dor abdominal": ["buscopan", "simeticona"],
    Constipação: [],
    "Sangue nas fezes": [],
    "Fezes pretas (melena)": [],
  };

  const medidasNaturais = [
    "Hidratação fracionada: pequenos goles frequentes (água, SRO, água de coco).",
    "Dieta leve: arroz, banana, maçã, torradas; evitar gorduras, leite (se piora) e álcool.",
    "Repouso.",
    "Higiene das mãos e cuidado com alimentos.",
    "Evitar automedicação excessiva; prioridade é hidratar.",
  ];

  function temAlerta(sel: string[]) {
    const set = new Set(sel.map(normalizaTexto));
    return sinaisAlerta.some((a) => set.has(normalizaTexto(a)));
  }

  function alertasAtivados(sel: string[]) {
    const set = new Set(sel.map(normalizaTexto));
    return sinaisAlerta.filter((a) => set.has(normalizaTexto(a)));
  }

function avaliar(sel: string[]): { risco: Risco; mensagem: string; motivos?: string[] } {
    const set = new Set(sel.map(normalizaTexto));

    const vomito = set.has(normalizaTexto("Vômito"));
    const diarreia = set.has(normalizaTexto("Diarreia"));
    const dor = set.has(normalizaTexto("Dor abdominal"));
    const sangue = set.has(normalizaTexto("Sangue nas fezes")) || set.has(normalizaTexto("Fezes pretas (melena)"));
    const desidratacao = set.has(normalizaTexto("Sinais de desidratação"));

    const azia = set.has(normalizaTexto("Azia/queimação"));
    const nausea = set.has(normalizaTexto("Náusea"));

    if (sangue || desidratacao) {
      return {
        risco: "alto",
        mensagem:
          "Há sinais de alerta gastrointestinais (sangramento ou desidratação). Procure atendimento (UPA/PS), principalmente se houver fraqueza intensa, tontura, confusão, pouca urina ou piora.",
        motivos: alertasAtivados(sel),
      };
    }

    if (dor && vomito) {
      return {
        risco: "alto",
        mensagem:
          "Dor abdominal associada a vômitos pode precisar de avaliação presencial. Procure atendimento, principalmente se a dor for forte, localizada, persistente, ou houver piora.",
        motivos: ["Dor abdominal + vômito"],
      };
    }

    if (vomito || diarreia) {
      return {
        risco: "moderado",
        mensagem:
          "Sem sinais de alerta graves no momento. Priorize hidratação (SRO) e dieta leve. Procure avaliação se não melhorar em 24–48h, se piorar, ou se surgir sangue/desidratação.",
        motivos: [],
      };
    }

    if (azia || nausea) {
      return {
        risco: "baixo",
        mensagem:
          "Quadro leve na maioria dos casos. Faça medidas de suporte. Procure atendimento se houver piora, vômitos persistentes, dor forte, fezes pretas/sangue ou sinais de desidratação.",
        motivos: [],
      };
    }

    return { risco: "baixo", mensagem: "Selecione ao menos um sintoma.", motivos: [] };
  }

  return {
    nome: "Gastrointestinal",
    sintomas,
    sinaisAlerta,
    medicacoes,
    medicacoesPorSintoma,
    medidasNaturais,
    avaliar,
    temAlerta,
    alertasAtivados,
  };
}

/* =========================================================
   MUSCULOESQUELÉTICO
========================================================= */

function musculoesqueleticoConfig(): SistemaConfig {
  const sintomas = [
    "Dor muscular",
    "Dor articular",
    "Inchaço",
    "Vermelhidão/local quente",
    "Limitação importante de movimento",
    "Trauma/quedas recentes",
    "Deformidade visível",
    "Dormência/formigamento",
    "Fraqueza no membro",
    "Febre associada",
  ];

  const sinaisAlerta = [
    "Trauma/quedas recentes",
    "Deformidade visível",
    "Vermelhidão/local quente",
    "Limitação importante de movimento",
    "Fraqueza no membro",
    "Dormência/formigamento",
    "Febre associada",
  ];

  const medicacoes: MedicacaoOTC[] = [
    {
      id: "paracetamol",
      nome: "Analgésico (ex: paracetamol)",
      principioAtivo: "paracetamol",
      categoria: "analgesico_antitermico",
      observacao: "Pode ajudar em dores leves. Leia a bula.",
    },
    {
      id: "dipirona",
      nome: "Analgésico (ex: dipirona)",
      principioAtivo: "dipirona",
      categoria: "analgesico_antitermico",
      observacao: "Pode ajudar em dores leves. Leia a bula.",
    },
    {
      id: "ibuprofeno",
      nome: "Anti-inflamatório (ex: ibuprofeno) — quando aplicável",
      principioAtivo: "ibuprofeno",
      categoria: "antiinflamatorio",
      observacao:
        "Evitar se gastrite/úlcera, doença renal, anticoagulantes, gestação. Leia a bula.",
    },
    {
      id: "naproxeno",
      nome: "Anti-inflamatório (ex: naproxeno) — quando aplicável",
      principioAtivo: "naproxeno",
      categoria: "antiinflamatorio",
      observacao: "Mesmas cautelas: estômago, rim, anticoagulantes, gestação. Leia a bula.",
    },
    {
      id: "diclofenaco_gel",
      nome: "Gel tópico anti-inflamatório (ex: diclofenaco gel) — quando aplicável",
      principioAtivo: "diclofenaco",
      categoria: "antiinflamatorio",
      observacao: "Pode ajudar em dor localizada. Evitar pele ferida. Leia a bula.",
    },
  ];

  const medicacoesPorSintoma: Record<string, string[]> = {
    "Dor muscular": ["paracetamol", "dipirona", "ibuprofeno", "naproxeno", "diclofenaco_gel"],
    "Dor articular": ["paracetamol", "dipirona", "ibuprofeno", "naproxeno", "diclofenaco_gel"],
    Inchaço: ["diclofenaco_gel", "ibuprofeno", "naproxeno"],
    "Vermelhidão/local quente": [],
    "Limitação importante de movimento": [],
    "Trauma/quedas recentes": [],
    "Deformidade visível": [],
    "Dormência/formigamento": [],
    "Fraqueza no membro": [],
    "Febre associada": ["paracetamol", "dipirona"],
  };

  const medidasNaturais = [
    "Repouso relativo (evitar sobrecarga).",
    "Gelo nas primeiras 24–48h em caso de trauma/inchaço (15–20 min, 3–4x/dia).",
    "Compressa morna para tensão muscular (15–20 min).",
    "Elevar o membro e compressão leve se houver inchaço (se tolerado).",
    "Alongamentos leves após melhora da dor.",
    "Se trauma: evitar “forçar” o movimento e observar deformidade/dor intensa.",
  ];

  function temAlerta(sel: string[]) {
    const set = new Set(sel.map(normalizaTexto));
    return sinaisAlerta.some((a) => set.has(normalizaTexto(a)));
  }

  function alertasAtivados(sel: string[]) {
    const set = new Set(sel.map(normalizaTexto));
    return sinaisAlerta.filter((a) => set.has(normalizaTexto(a)));
  }

function avaliar(sel: string[]): { risco: Risco; mensagem: string; motivos?: string[] } {
    const set = new Set(sel.map(normalizaTexto));
    const trauma = set.has(normalizaTexto("Trauma/quedas recentes"));
    const deform = set.has(normalizaTexto("Deformidade visível"));
    const quente = set.has(normalizaTexto("Vermelhidão/local quente"));
    const limit = set.has(normalizaTexto("Limitação importante de movimento"));
    const fraq = set.has(normalizaTexto("Fraqueza no membro"));
    const dorm = set.has(normalizaTexto("Dormência/formigamento"));
    const febre = set.has(normalizaTexto("Febre associada"));

    if (trauma || deform || quente || limit || fraq || dorm) {
      return {
        risco: "alto",
        mensagem:
          "Há sinais de alerta musculoesqueléticos. Procure atendimento para avaliação (risco de fratura/lesão importante/infecção/compressão nervosa).",
        motivos: alertasAtivados(sel),
      };
    }

    if (febre) {
      return {
        risco: "moderado",
        mensagem:
          "Febre associada à dor/inchaço pode indicar processo inflamatório ou infeccioso. Procure avaliação se persistir, piorar, ou houver vermelhidão/local quente.",
        motivos: ["Febre associada"],
      };
    }

    return {
      risco: "baixo",
      mensagem:
        "Quadro geralmente leve. Use medidas de suporte e monitorize. Procure atendimento se houver piora, dor intensa, deformidade, febre, vermelhidão/local quente ou fraqueza/dormência.",
      motivos: [],
    };
  }

  return {
    nome: "Musculoesquelético",
    sintomas,
    sinaisAlerta,
    medicacoes,
    medicacoesPorSintoma,
    medidasNaturais,
    avaliar,
    temAlerta,
    alertasAtivados,
  };
}

/* =========================================================
   URINÁRIO
========================================================= */

function urinarioConfig(): SistemaConfig {
  const sintomas = [
    "Ardência ao urinar",
    "Urgência urinária",
    "Aumento da frequência urinária",
    "Dor suprapúbica (baixo ventre)",
    "Urina com odor forte",
    "Febre/calafrios",
    "Dor lombar/flanco",
    "Sangue na urina",
    "Náuseas/vômitos",
    "Dificuldade para urinar/retenção",
  ];

  const sinaisAlerta = [
    "Febre/calafrios",
    "Dor lombar/flanco",
    "Sangue na urina",
    "Náuseas/vômitos",
    "Dificuldade para urinar/retenção",
  ];

  const medicacoes: MedicacaoOTC[] = [
    {
      id: "paracetamol",
      nome: "Analgésico/antitérmico (ex: paracetamol)",
      principioAtivo: "paracetamol",
      categoria: "analgesico_antitermico",
      observacao: "Pode ajudar em dor e febre. Leia a bula.",
    },
    {
      id: "dipirona",
      nome: "Analgésico/antitérmico (ex: dipirona)",
      principioAtivo: "dipirona",
      categoria: "analgesico_antitermico",
      observacao: "Pode ajudar em dor e febre. Leia a bula.",
    },
    {
      id: "fenazopiridina",
      nome: "Analgésico urinário (ex: fenazopiridina) — quando aplicável",
      principioAtivo: "fenazopiridina",
      categoria: "urinario_analgesico",
      observacao:
        "Alivia ardência temporariamente, mas não trata infecção. Pode alterar cor da urina. Leia a bula e peça orientação ao farmacêutico.",
    },
  ];

  const medicacoesPorSintoma: Record<string, string[]> = {
    "Ardência ao urinar": ["fenazopiridina", "paracetamol", "dipirona"],
    "Urgência urinária": ["fenazopiridina", "paracetamol", "dipirona"],
    "Aumento da frequência urinária": ["fenazopiridina", "paracetamol", "dipirona"],
    "Dor suprapúbica (baixo ventre)": ["paracetamol", "dipirona"],
    "Urina com odor forte": [],
    "Febre/calafrios": ["paracetamol", "dipirona"],
    "Dor lombar/flanco": [],
    "Sangue na urina": [],
    "Náuseas/vômitos": [],
    "Dificuldade para urinar/retenção": [],
  };

  const medidasNaturais = [
    "Hidratação ao longo do dia (sem exageros).",
    "Evitar segurar urina por longos períodos.",
    "Evitar irritantes vesicais: álcool, cafeína, pimenta.",
    "Higiene íntima adequada.",
    "Se suspeita de cistite: procurar avaliação se não melhorar em 24–48h.",
  ];

  function temAlerta(sel: string[]) {
    const set = new Set(sel.map(normalizaTexto));
    return sinaisAlerta.some((a) => set.has(normalizaTexto(a)));
  }

  function alertasAtivados(sel: string[]) {
    const set = new Set(sel.map(normalizaTexto));
    return sinaisAlerta.filter((a) => set.has(normalizaTexto(a)));
  }

function avaliar(sel: string[]): { risco: Risco; mensagem: string; motivos?: string[] } {
    const set = new Set(sel.map(normalizaTexto));

    const febre = set.has(normalizaTexto("Febre/calafrios"));
    const dorFlanco = set.has(normalizaTexto("Dor lombar/flanco"));
    const sangue = set.has(normalizaTexto("Sangue na urina"));
    const vomito = set.has(normalizaTexto("Náuseas/vômitos"));
    const retencao = set.has(normalizaTexto("Dificuldade para urinar/retenção"));

    const ardor = set.has(normalizaTexto("Ardência ao urinar"));
    const urg = set.has(normalizaTexto("Urgência urinária"));
    const freq = set.has(normalizaTexto("Aumento da frequência urinária"));
    const suprap = set.has(normalizaTexto("Dor suprapúbica (baixo ventre)"));

    if (febre || dorFlanco || sangue || vomito || retencao) {
      return {
        risco: "alto",
        mensagem:
          "Há sinais de alerta urinários (pode sugerir infecção complicada, pielonefrite ou cálculo). Procure atendimento para avaliação e possível antibiótico/exames.",
        motivos: alertasAtivados(sel),
      };
    }

    if (ardor || urg || freq || suprap) {
      return {
        risco: "moderado",
        mensagem:
          "Pode ser cistite/irritação urinária. Hidrate-se e procure avaliação médica se persistir por 24–48h, se piorar, ou se aparecer febre, dor no flanco, vômitos ou sangue na urina.",
        motivos: [],
      };
    }

    return { risco: "baixo", mensagem: "Selecione ao menos um sintoma.", motivos: [] };
  }

  return {
    nome: "Urinário",
    sintomas,
    sinaisAlerta,
    medicacoes,
    medicacoesPorSintoma,
    medidasNaturais,
    avaliar,
    temAlerta,
    alertasAtivados,
  };
}

/* =========================================================
   NEUROLÓGICO
========================================================= */

function neurologicoConfig(): SistemaConfig {
  const sintomas = [
    "Dor de cabeça",
    "Dor de cabeça súbita e muito forte",
    "Tontura/vertigem",
    "Náusea",
    "Vômito persistente",
    "Desmaio",
    "Convulsão",
    "Fraqueza em um lado do corpo",
    "Alteração na fala",
    "Alteração visual súbita",
    "Rigidez na nuca",
    "Confusão/somnolência intensa",
  ];

  const sinaisAlerta = [
    "Dor de cabeça súbita e muito forte",
    "Fraqueza em um lado do corpo",
    "Alteração na fala",
    "Alteração visual súbita",
    "Convulsão",
    "Desmaio",
    "Rigidez na nuca",
    "Confusão/somnolência intensa",
  ];

  const medicacoes: MedicacaoOTC[] = [
    {
      id: "paracetamol",
      nome: "Analgésico (ex: paracetamol)",
      principioAtivo: "paracetamol",
      categoria: "analgesico_antitermico",
      observacao: "Pode ajudar em cefaleia leve. Leia a bula.",
    },
    {
      id: "dipirona",
      nome: "Analgésico (ex: dipirona)",
      principioAtivo: "dipirona",
      categoria: "analgesico_antitermico",
      observacao: "Pode ajudar em cefaleia leve. Leia a bula.",
    },
    {
      id: "dimenidrinato",
      nome: "Antiemético para enjoo/vertigem (ex: dimenidrinato) — quando aplicável",
      principioAtivo: "dimenidrinato",
      categoria: "antiemetico",
      observacao: "Pode causar sonolência. Leia a bula.",
    },
    {
      id: "meclizina",
      nome: "Antiemético para enjoo/vertigem (ex: meclizina) — quando aplicável",
      principioAtivo: "meclizina",
      categoria: "antiemetico",
      observacao: "Pode causar sonolência. Leia a bula.",
    },
  ];

  const medicacoesPorSintoma: Record<string, string[]> = {
    "Dor de cabeça": ["paracetamol", "dipirona"],
    "Tontura/vertigem": ["dimenidrinato", "meclizina"],
    Náusea: ["dimenidrinato", "meclizina"],
    "Dor de cabeça súbita e muito forte": [],
    "Vômito persistente": [],
    Desmaio: [],
    Convulsão: [],
    "Fraqueza em um lado do corpo": [],
    "Alteração na fala": [],
    "Alteração visual súbita": [],
    "Rigidez na nuca": [],
    "Confusão/somnolência intensa": [],
  };

  const medidasNaturais = [
    "Hidratação.",
    "Repouso em ambiente silencioso e escuro (em dor de cabeça).",
    "Evitar telas/luz forte durante crise.",
    "Levantar devagar (se tontura).",
    "Alimentação leve se houver náusea.",
  ];

  function temAlerta(sel: string[]) {
    const set = new Set(sel.map(normalizaTexto));
    return sinaisAlerta.some((a) => set.has(normalizaTexto(a)));
  }

  function alertasAtivados(sel: string[]) {
    const set = new Set(sel.map(normalizaTexto));
    return sinaisAlerta.filter((a) => set.has(normalizaTexto(a)));
  }

function avaliar(sel: string[]): { risco: Risco; mensagem: string; motivos?: string[] } {
    const set = new Set(sel.map(normalizaTexto));

    const alerta = temAlerta(sel);
    if (alerta) {
      return {
        risco: "alto",
        mensagem:
          "Há sinais neurológicos de alerta. Procure atendimento imediatamente (SAMU/UPA/PS).",
        motivos: alertasAtivados(sel),
      };
    }

    const tontura = set.has(normalizaTexto("Tontura/vertigem"));
    const nausea = set.has(normalizaTexto("Náusea"));
    const dorCabeca = set.has(normalizaTexto("Dor de cabeça"));

    if (tontura || nausea) {
      return {
        risco: "moderado",
        mensagem:
          "Sem sinais graves no momento. Hidrate-se e repouse. Procure atendimento se persistir, piorar, houver vômitos persistentes ou surgirem sintomas neurológicos.",
        motivos: [],
      };
    }

    if (dorCabeca) {
      return {
        risco: "baixo",
        mensagem:
          "Cefaleia leve geralmente melhora com hidratação, repouso e analgesia simples. Procure atendimento se surgir dor súbita muito forte, rigidez de nuca, desmaio, confusão ou piora.",
        motivos: [],
      };
    }

    return { risco: "baixo", mensagem: "Selecione ao menos um sintoma.", motivos: [] };
  }

  return {
    nome: "Neurológico",
    sintomas,
    sinaisAlerta,
    medicacoes,
    medicacoesPorSintoma,
    medidasNaturais,
    avaliar,
    temAlerta,
    alertasAtivados,
  };
}

/* =========================================================
   GINECOLÓGICO
========================================================= */

function ginecologicoConfig(): SistemaConfig {
  const sintomas = [
    "Cólicas menstruais",
    "Dor pélvica forte",
    "Sangramento vaginal intenso",
    "Atraso menstrual/possível gestação",
    "Corrimento com odor forte",
    "Coceira/ardor vaginal",
    "Febre",
    "Dor ao urinar",
    "Dor durante relação",
    "Tontura/desmaio",
  ];

  const sinaisAlerta = [
    "Dor pélvica forte",
    "Sangramento vaginal intenso",
    "Tontura/desmaio",
    "Febre",
    "Atraso menstrual/possível gestação",
  ];

  const medicacoes: MedicacaoOTC[] = [
    {
      id: "paracetamol",
      nome: "Analgésico (ex: paracetamol)",
      principioAtivo: "paracetamol",
      categoria: "analgesico_antitermico",
      observacao: "Pode ajudar em cólicas/dor leve. Leia a bula.",
    },
    {
      id: "dipirona",
      nome: "Analgésico (ex: dipirona)",
      principioAtivo: "dipirona",
      categoria: "analgesico_antitermico",
      observacao: "Pode ajudar em cólicas/dor leve. Leia a bula.",
    },
    {
      id: "ibuprofeno",
      nome: "Anti-inflamatório (ex: ibuprofeno) — quando aplicável",
      principioAtivo: "ibuprofeno",
      categoria: "antiinflamatorio",
      observacao:
        "Pode ajudar em cólica menstrual. Evitar se gastrite/úlcera, rim, anticoagulantes, gestação. Leia a bula.",
    },
  ];

  const medicacoesPorSintoma: Record<string, string[]> = {
    "Cólicas menstruais": ["paracetamol", "dipirona", "ibuprofeno"],
    "Dor ao urinar": ["paracetamol", "dipirona"],
    "Coceira/ardor vaginal": [],
    "Corrimento com odor forte": [],
    "Dor durante relação": [],
    "Dor pélvica forte": [],
    "Sangramento vaginal intenso": [],
    "Atraso menstrual/possível gestação": [],
    Febre: ["paracetamol", "dipirona"],
    "Tontura/desmaio": [],
  };

  const medidasNaturais = [
    "Compressa morna no baixo ventre (se aliviar).",
    "Hidratação e repouso.",
    "Evitar duchas vaginais e automedicação local sem orientação.",
    "Usar roupa íntima de algodão e manter região seca (se coceira).",
    "Procurar avaliação para corrimento com odor, dor pélvica forte, febre ou sangramento.",
  ];

  function temAlerta(sel: string[]) {
    const set = new Set(sel.map(normalizaTexto));
    return sinaisAlerta.some((a) => set.has(normalizaTexto(a)));
  }

  function alertasAtivados(sel: string[]) {
    const set = new Set(sel.map(normalizaTexto));
    return sinaisAlerta.filter((a) => set.has(normalizaTexto(a)));
  }

function avaliar(sel: string[]): { risco: Risco; mensagem: string; motivos?: string[] } {
    const set = new Set(sel.map(normalizaTexto));

    const dorForte = set.has(normalizaTexto("Dor pélvica forte"));
    const sang = set.has(normalizaTexto("Sangramento vaginal intenso"));
    const tont = set.has(normalizaTexto("Tontura/desmaio"));
    const febre = set.has(normalizaTexto("Febre"));
    const atraso = set.has(normalizaTexto("Atraso menstrual/possível gestação"));
    const corr = set.has(normalizaTexto("Corrimento com odor forte"));

    if (dorForte || sang || tont) {
      return {
        risco: "alto",
        mensagem:
          "Há sinais de alerta ginecológicos. Procure atendimento para avaliação (principalmente se houver fraqueza, piora, desmaio, palidez ou dor intensa).",
        motivos: alertasAtivados(sel),
      };
    }

    if (febre && (dorForte || corr)) {
      return {
        risco: "alto",
        mensagem:
          "Febre associada a dor pélvica/corrimento pode indicar infecção que precisa de avaliação. Procure atendimento.",
        motivos: ["Febre + dor pélvica/corrimento"],
      };
    }

    if (atraso) {
      return {
        risco: "moderado",
        mensagem:
          "Possível gestação exige orientação cautelosa. Faça teste e procure UBS/atendimento, especialmente se houver dor pélvica, sangramento, tontura ou febre.",
        motivos: ["Possível gestação"],
      };
    }

    if (corr) {
      return {
        risco: "moderado",
        mensagem:
          "Corrimento com odor forte costuma precisar de avaliação e tratamento específico. Procure UBS/atendimento nas próximas 24–72h.",
        motivos: ["Corrimento com odor forte"],
      };
    }

    if (set.has(normalizaTexto("Cólicas menstruais"))) {
      return {
        risco: "baixo",
        mensagem:
          "Cólicas leves geralmente melhoram com compressa morna, hidratação e analgesia simples. Procure atendimento se dor forte, febre, sangramento intenso ou piora.",
        motivos: [],
      };
    }

    return { risco: "baixo", mensagem: "Selecione ao menos um sintoma.", motivos: [] };
  }

  return {
    nome: "Ginecológico",
    sintomas,
    sinaisAlerta,
    medicacoes,
    medicacoesPorSintoma,
    medidasNaturais,
    avaliar,
    temAlerta,
    alertasAtivados,
  };
}

/* =========================================================
   PEDIÁTRICO (geral e conservador)
========================================================= */

function pediatricoConfig(): SistemaConfig {
  const sintomas = [
    "Febre",
    "Tosse",
    "Coriza/congestão",
    "Dificuldade para respirar",
    "Prostração (muito molinho)",
    "Recusa líquidos",
    "Vômito",
    "Diarreia",
    "Manchas/roxos na pele",
    "Convulsão",
    "Choro inconsolável",
    "Dor de ouvido",
  ];

  const sinaisAlerta = [
    "Dificuldade para respirar",
    "Prostração (muito molinho)",
    "Recusa líquidos",
    "Manchas/roxos na pele",
    "Convulsão",
    "Choro inconsolável",
  ];

  const medicacoes: MedicacaoOTC[] = [
    {
      id: "paracetamol",
      nome: "Antitérmico infantil (ex: paracetamol) — conforme idade/peso",
      principioAtivo: "paracetamol",
      categoria: "analgesico_antitermico",
      observacao:
        "Em pediatria, dose é por peso/idade. Use somente com orientação e bula. Se dúvida, procure atendimento.",
    },
    {
      id: "dipirona",
      nome: "Antitérmico infantil (ex: dipirona) — conforme idade/peso",
      principioAtivo: "dipirona",
      categoria: "analgesico_antitermico",
      observacao:
        "Em pediatria, dose é por peso/idade. Use somente com orientação e bula. Se dúvida, procure atendimento.",
    },
    {
      id: "sro",
      nome: "Sais de reidratação oral (SRO)",
      principioAtivo: "sais de reidratacao oral",
      categoria: "hidratacao",
      observacao: "Prioridade em diarreia/vômitos: hidratação fracionada.",
    },
    {
      id: "salina_nasal",
      nome: "Soro fisiológico nasal (lavagem)",
      principioAtivo: "solucao salina (cloreto de sodio)",
      categoria: "descongestionante_nasal",
      observacao: "Ajuda em congestão/coriza. Técnica correta é importante.",
    },
  ];

  const medicacoesPorSintoma: Record<string, string[]> = {
    Febre: ["paracetamol", "dipirona"],
    Tosse: ["salina_nasal"],
    "Coriza/congestão": ["salina_nasal"],
    Vômito: ["sro"],
    Diarreia: ["sro"],
    "Dor de ouvido": ["paracetamol", "dipirona"],
    "Dificuldade para respirar": [],
    "Prostração (muito molinho)": [],
    "Recusa líquidos": [],
    "Manchas/roxos na pele": [],
    Convulsão: [],
    "Choro inconsolável": [],
  };

  const medidasNaturais = [
    "Hidratação fracionada (pequenos volumes com frequência).",
    "Ambiente ventilado, repouso.",
    "Lavagem nasal com soro.",
    "Observar sinais de desidratação (pouca urina, boca seca, sonolência).",
    "Se febre persistente, prostração ou piora: procurar avaliação.",
  ];

  function temAlerta(sel: string[]) {
    const set = new Set(sel.map(normalizaTexto));
    return sinaisAlerta.some((a) => set.has(normalizaTexto(a)));
  }

  function alertasAtivados(sel: string[]) {
    const set = new Set(sel.map(normalizaTexto));
    return sinaisAlerta.filter((a) => set.has(normalizaTexto(a)));
  }

function avaliar(sel: string[]): { risco: Risco; mensagem: string; motivos?: string[] } {
    const set = new Set(sel.map(normalizaTexto));

    const alerta = temAlerta(sel);
    if (alerta) {
      return {
        risco: "alto",
        mensagem:
          "Há sinais de alerta em criança. Procure atendimento imediatamente (UPA/PS), especialmente se houver piora, sonolência excessiva, respiração difícil ou sinais de desidratação.",
        motivos: alertasAtivados(sel),
      };
    }

    const febre = set.has(normalizaTexto("Febre"));
    const vomito = set.has(normalizaTexto("Vômito"));
    const diarreia = set.has(normalizaTexto("Diarreia"));

    if (vomito || diarreia || febre) {
      return {
        risco: "moderado",
        mensagem:
          "Priorize hidratação e monitore. Procure avaliação se não melhorar em 24–48h, se houver piora ou sinais de desidratação.",
        motivos: [],
      };
    }

    if (set.has(normalizaTexto("Tosse")) || set.has(normalizaTexto("Coriza/congestão"))) {
      return {
        risco: "baixo",
        mensagem:
          "Em geral, quadro leve. Faça lavagem nasal, hidratação e repouso. Procure atendimento se surgir dificuldade para respirar, prostração, recusa de líquidos ou febre persistente.",
        motivos: [],
      };
    }

    return { risco: "baixo", mensagem: "Selecione ao menos um sintoma.", motivos: [] };
  }

  return {
    nome: "Pediátrico",
    sintomas,
    sinaisAlerta,
    medicacoes,
    medicacoesPorSintoma,
    medidasNaturais,
    avaliar,
    temAlerta,
    alertasAtivados,
  };
}

/* =========================================================
   EXPORTS
========================================================= */

export const SISTEMAS: Record<string, SistemaConfig> = {
  respiratorio: respiratorioConfig(),
  gastrointestinal: gastrointestinalConfig(),
  musculoesqueletico: musculoesqueleticoConfig(),
  urinario: urinarioConfig(),
  neurologico: neurologicoConfig(),
  ginecologico: ginecologicoConfig(),
  pediatrico: pediatricoConfig(),
};

export function obterMedicacoesParaSintomas(
  sistemaKey: string,
  sintomasSelecionados: string[],
  alergiaDigitada: string,
  perfil: PerfilSeguranca
): MedicacaoOTC[] {
  const cfg = SISTEMAS[sistemaKey];
  if (!cfg) return [];

  const medsPorSintoma = medicacoesPorSintomas(cfg, sintomasSelecionados);
  const medsSemAlergia = filtrarPorAlergia(medsPorSintoma, alergiaDigitada);
  const medsSeguros = filtrarPorPerfilSeguranca(medsSemAlergia, perfil);

  return medsSeguros;
}
