export type HistoricoItem = {
  id: string;
  dataISO: string;

  // exibicao
  sistema: string;
  risco: "baixo" | "moderado" | "alto";

  // dados
  sintomas: string[];
  alergias: string[];
  idade: number | null;
  dias: number | null;
  gestante: boolean;

  // NOVO: segurança extra
  dorForte?: boolean;
  incapazHidratar?: boolean;

  // para compartilhar
  textoCompartilhavel: string;

  // NOVO: chave de rota (ex: respiratorio)
  sistemaKey?: string;

  // NOVO: perfil extra (se existir no futuro)
  criancaMenor12?: boolean;
  riscoGastriteRimAnticoagulante?: boolean;
};

const KEY = "triagem_historico_v1";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function carregarHistorico(): HistoricoItem[] {
  if (typeof window === "undefined") return [];
  const data = safeParse<HistoricoItem[]>(localStorage.getItem(KEY));
  if (!data || !Array.isArray(data)) return [];
  return data;
}

// alias (pra compatibilidade com imports antigos)
export const lerHistorico = carregarHistorico;

export function salvarNoHistorico(item: HistoricoItem) {
  if (typeof window === "undefined") return;
  const atual = carregarHistorico();

  // evita duplicar id
  const semDuplicado = atual.filter((x) => x.id !== item.id);
  const novo = [item, ...semDuplicado].slice(0, 200);

  localStorage.setItem(KEY, JSON.stringify(novo));
}

export function limparHistorico() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

// helper: tenta inferir sistemaKey a partir do nome do sistema (fallback)
export function inferirSistemaKeyPorNome(nome: string) {
  const n = (nome || "").toLowerCase();
  if (n.includes("resp")) return "respiratorio";
  if (n.includes("gastro")) return "gastrointestinal";
  if (n.includes("musculo")) return "musculoesqueletico";
  if (n.includes("urin")) return "urinario";
  if (n.includes("neuro")) return "neurologico";
  if (n.includes("gine")) return "ginecologico";
  if (n.includes("pedi")) return "pediatrico";
  return "";
}
