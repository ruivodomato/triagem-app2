export type NivelRisco = "LEVE" | "ATENCAO" | "URGENTE";

export type ResultadoRisco = {
  nivel: NivelRisco;
  titulo: string;
  mensagem: string;
  acoes: string[];
};

type RegrasRisco = {
  redFlags: string[];
  atencao: string[];
};

const REGRAS: Record<string, RegrasRisco> = {
  respiratorio: {
    redFlags: [
      "falta de ar intensa",
      "lábios arroxeados",
      "dor torácica forte",
      "confusão mental",
      "desmaio",
      "chiado no peito intenso",
      "tosse com sangue",
      "saturação baixa",
    ],
    atencao: [
      "falta de ar",
      "dor torácica",
      "febre alta",
      "piora progressiva",
      "chiado no peito",
    ],
  },

  gastrointestinal: {
    redFlags: [
      "sangue nas fezes",
      "vômito com sangue",
      "dor abdominal intensa",
      "desmaio",
      "confusão mental",
      "sinais de desidratação grave",
      "rigidez abdominal",
    ],
    atencao: [
      "vômitos persistentes",
      "diarreia persistente",
      "febre alta",
      "dor abdominal moderada",
      "não consegue ingerir líquidos",
    ],
  },

  musculoesqueletico: {
    redFlags: [
      "deformidade",
      "perda de força",
      "perda de sensibilidade",
      "dor incapacitante",
      "trauma importante",
      "febre com dor intensa",
    ],
    atencao: [
      "inchaço importante",
      "dor moderada",
      "limitação de movimento",
      "vermelhidão intensa",
    ],
  },

  urinario: {
    redFlags: [
      "dor lombar intensa",
      "febre alta com calafrios",
      "sangue na urina",
      "incapaz de urinar",
      "confusão mental",
      "desmaio",
    ],
    atencao: [
      "ardor ao urinar",
      "urgência urinária",
      "dor lombar moderada",
      "febre",
    ],
  },

  neurologico: {
    redFlags: [
      "fraqueza em um lado do corpo",
      "dificuldade para falar",
      "convulsão",
      "perda de consciência",
      "dor de cabeça súbita e intensa",
      "confusão mental",
      "rigidez de nuca",
    ],
    atencao: [
      "tontura persistente",
      "dor de cabeça moderada",
      "formigamento",
      "náusea com tontura",
    ],
  },

  ginecologico: {
    redFlags: [
      "sangramento intenso",
      "dor pélvica intensa",
      "desmaio",
      "febre alta",
      "corrimento com mau cheiro e febre",
      "suspeita de gravidez com dor/sangramento",
    ],
    atencao: [
      "cólicas fortes",
      "sangramento fora do habitual",
      "corrimento",
      "dor pélvica moderada",
    ],
  },

  pediatrico: {
    redFlags: [
      "dificuldade para respirar",
      "lábios arroxeados",
      "convulsão",
      "sonolência excessiva",
      "não consegue beber líquidos",
      "sinais de desidratação grave",
      "rigidez de nuca",
    ],
    atencao: [
      "febre",
      "vômitos",
      "diarreia",
      "tosse",
      "prostração",
    ],
  },
};

function normaliza(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

/**
 * Classificação simples e segura:
 * - URGENTE: qualquer "red flag"
 * - ATENÇÃO: 2+ itens de atenção OU 3+ sintomas totais
 * - LEVE: demais
 */
export function avaliarRisco(input: {
  sistema: string;
  sintomasSelecionados: string[];
}): ResultadoRisco {
  const sistema = normaliza(input.sistema);
  const sintomas = (input.sintomasSelecionados || []).map(normaliza);

  const regras = REGRAS[sistema];

  // Se sistema não conhecido, mantém orientação conservadora
  if (!regras) {
    return {
      nivel: "ATENCAO",
      titulo: "Atenção",
      mensagem:
        "Não foi possível identificar regras do sistema. Se houver piora ou sinais de alerta, procure atendimento.",
      acoes: [
        "Se piorar, procure uma unidade de saúde.",
        "Se houver falta de ar, desmaio, sangue, dor forte: emergência.",
      ],
    };
  }

  const bateRedFlag = sintomas.some((s) =>
    regras.redFlags.some((rf) => s === normaliza(rf))
  );

  if (bateRedFlag) {
    return {
      nivel: "URGENTE",
      titulo: "Sinais de alerta",
      mensagem:
        "Há sinais que podem indicar gravidade. Procure atendimento imediatamente (UPA/PS/SAMU 192).",
      acoes: [
        "Procure atendimento agora (UPA/PS).",
        "Se risco de vida ou piora rápida: SAMU 192.",
        "Não se automedique para “segurar” sintomas graves.",
      ],
    };
  }

  const atencaoCount = sintomas.filter((s) =>
    regras.atencao.some((a) => s === normaliza(a))
  ).length;

  if (atencaoCount >= 2 || sintomas.length >= 3) {
    return {
      nivel: "ATENCAO",
      titulo: "Atenção",
      mensagem:
        "Os sintomas sugerem acompanhamento mais cuidadoso. Se persistirem, piorarem ou houver febre alta, procure atendimento.",
      acoes: [
        "Reforce hidratação e repouso.",
        "Se não melhorar em 24–48h ou piorar: procure unidade de saúde.",
        "Se aparecer sangue, desmaio, falta de ar intensa: emergência.",
      ],
    };
  }

  return {
    nivel: "LEVE",
    titulo: "Caso leve (provável)",
    mensagem:
      "Quadro compatível com caso leve. Foque em medidas de conforto e observe evolução.",
    acoes: [
      "Hidratação, repouso e alimentação leve.",
      "Se piorar ou durar mais de 48h: procure avaliação.",
    ],
  };
}
