export type SistemaId =
  | "respiratorio"
  | "gastrointestinal"
  | "musculoesqueletico"
  | "urinario"
  | "neurologico"
  | "ginecologico"
  | "pediatrico";

export type TriagemItem = {
  id: string;
  sistema: SistemaId; // ✅ novo: integra com /triagem/[sistema] e busca

  titulo: string;
  termos: string[];
  tags: string[];
  resumo: string;
  orientacoes: string[];
  alertas: string[];
};

export const SISTEMAS_LABEL: Record<SistemaId, string> = {
  respiratorio: "Respiratório",
  gastrointestinal: "Gastrointestinal",
  musculoesqueletico: "Musculoesquelético",
  urinario: "Urinário",
  neurologico: "Neurológico",
  ginecologico: "Ginecológico",
  pediatrico: "Pediátrico",
};

export const TRIAGEM_ITENS: TriagemItem[] = [
  {
    id: "tosse-seca",
    sistema: "respiratorio",
    titulo: "Tosse seca (sem catarro)",
    termos: ["tosse", "tosse seca", "irritação na garganta", "garganta arranhando"],
    tags: ["otc"],
    resumo: "Geralmente viral/irritativa. Foque em hidratação e alívio sintomático.",
    orientacoes: [
      "Hidrate-se bem (água, sopas, chás).",
      "Mel pode ajudar (evite em menores de 1 ano).",
      "Soro fisiológico nasal se houver coriza/congestão.",
      "Evite fumaça, poeira, cheiros fortes.",
      "Se precisar: pastilhas/soluções para garganta podem aliviar."
    ],
    alertas: [
      "Falta de ar, chiado forte ou dor no peito.",
      "Febre alta persistente (≥ 39°C) por mais de 48–72h.",
      "Tosse por > 3 semanas, sangue no escarro, perda de peso.",
      "Piora importante em idosos, gestantes, cardiopatas ou pneumopatas."
    ]
  },
  {
    id: "dor-garganta",
    sistema: "respiratorio",
    titulo: "Dor de garganta",
    termos: ["garganta", "dor de garganta", "odinofagia", "arranhando", "amigdalite"],
    tags: ["otc"],
    resumo: "Na maioria das vezes é viral. Observe sinais de gravidade e hidratação.",
    orientacoes: [
      "Hidratação e descanso.",
      "Gargarejo com água morna e sal (se tolerado).",
      "Mel (evite < 1 ano).",
      "Analgésicos/antitérmicos usuais podem ajudar se você já usa com segurança."
    ],
    alertas: [
      "Dificuldade para respirar ou engolir saliva (baba).",
      "Trismo (dificuldade de abrir a boca), voz abafada, inchaço assimétrico no pescoço.",
      "Febre alta persistente e placas extensas com mal-estar importante.",
      "Desidratação (urina muito escura, tontura, fraqueza intensa)."
    ]
  },
  {
    id: "nausea-leve",
    sistema: "gastrointestinal",
    titulo: "Náusea leve / enjoo",
    termos: ["náusea", "enjoo", "ânsia", "vontade de vomitar"],
    tags: ["otc"],
    resumo: "Pode ser alimentação, virose, ansiedade. Priorize líquidos e alimentação leve.",
    orientacoes: [
      "Beba pequenos goles frequentes (água, soro de reidratação).",
      "Alimentação leve: arroz, banana, maçã, torradas.",
      "Evite gordura, álcool, frituras e leite (se piora).",
      "Gengibre pode ajudar algumas pessoas (chá/raspas)."
    ],
    alertas: [
      "Vômitos persistentes com incapacidade de ingerir líquidos.",
      "Sangue no vômito, fezes pretas, dor abdominal forte localizada.",
      "Sinais de desidratação importante (sonolência, confusão, pouca urina).",
      "Gestação com vômitos intensos ou perda de peso."
    ]
  }
];
