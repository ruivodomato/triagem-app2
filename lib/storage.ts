const KEY_FAV = "triagem:favoritos";
const KEY_REC = "triagem:recentes";

export function loadStringArray(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(x => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function saveStringArray(key: string, value: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadFavoritos(): string[] {
  return loadStringArray(KEY_FAV);
}
export function saveFavoritos(ids: string[]) {
  saveStringArray(KEY_FAV, ids);
}

export function loadRecentes(): string[] {
  return loadStringArray(KEY_REC);
}
export function pushRecente(id: string) {
  const atuais = loadRecentes().filter(x => x !== id);
  const novo = [id, ...atuais].slice(0, 20);
  saveStringArray(KEY_REC, novo);
}
