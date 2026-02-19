"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { TriagemItem } from "@/lib/triagemData";
import { SISTEMAS_LABEL } from "@/lib/triagemData";
import { loadFavoritos, saveFavoritos, loadRecentes, pushRecente } from "@/lib/storage";

type Props = { itens: TriagemItem[] };

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export default function TriagemList({ itens }: Props) {
  const [q, setQ] = useState("");
  const [modo, setModo] = useState<"todos" | "favoritos" | "recentes">("todos");
  const [sistema, setSistema] = useState<string>("todos");

  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [recentes, setRecentes] = useState<string[]>([]);

  useEffect(() => {
    setFavoritos(loadFavoritos());
    setRecentes(loadRecentes());
  }, []);

  const sistemasDisponiveis = useMemo(() => {
    const set = new Set<string>();
    itens.forEach((i) => set.add(i.sistema));
    return ["todos", ...Array.from(set).sort()];
  }, [itens]);

  const filtrados = useMemo(() => {
    const nq = normalize(q);

    let base = itens;

    // modo
    if (modo === "favoritos") {
      base = base.filter((i) => favoritos.includes(i.id));
    } else if (modo === "recentes") {
      base = recentes.map((id) => base.find((i) => i.id === id)).filter(Boolean) as TriagemItem[];
    }

    // sistema
    if (sistema !== "todos") {
      base = base.filter((i) => i.sistema === sistema);
    }

    // busca
    if (!nq) return base;

    return base.filter((i) => {
      const hay = [i.titulo, i.resumo, ...i.termos, ...i.tags, i.sistema].map(normalize);
      return hay.some((x) => x.includes(nq));
    });
  }, [itens, q, modo, sistema, favoritos, recentes]);

  function toggleFav(id: string) {
    const novo = favoritos.includes(id)
      ? favoritos.filter((x) => x !== id)
      : [id, ...favoritos];
    setFavoritos(novo);
    saveFavoritos(novo);
  }

  function abrirItem(id: string) {
    pushRecente(id);
    setRecentes(loadRecentes());
    window.location.href = `/triagem/detalhe/${id}`;
  }

  return (
    <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      {/* Header fixo */}
      <div style={{ position: "sticky", top: 0, background: "white", paddingTop: 8, paddingBottom: 12, zIndex: 10 }}>
        {/* Busca */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar sintoma, termo, tag…"
            style={{
              flex: 1,
              padding: "12px 14px",
              borderRadius: 14,
              border: "1px solid #e5e7eb",
              outline: "none",
              fontSize: 16
            }}
          />
          <button
            onClick={() => setQ("")}
            style={{ padding: "12px 14px", borderRadius: 14, border: "1px solid #e5e7eb", background: "white", cursor: "pointer" }}
            aria-label="Limpar busca"
            title="Limpar"
          >
            ✕
          </button>
        </div>

        {/* Modos */}
        <div style={{ display: "flex", gap: 8, marginTop: 10, overflowX: "auto", paddingBottom: 4 }}>
          {(["todos", "favoritos", "recentes"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setModo(m)}
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                border: "1px solid #e5e7eb",
                background: modo === m ? "#111827" : "white",
                color: modo === m ? "white" : "#111827",
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              {m === "todos" ? "Todos" : m === "favoritos" ? "⭐ Favoritos" : "🕘 Recentes"}
            </button>
          ))}
        </div>

        {/* Sistemas */}
        <div style={{ display: "flex", gap: 8, marginTop: 8, overflowX: "auto", paddingBottom: 4 }}>
          {sistemasDisponiveis.map((s) => (
            <button
              key={s}
              onClick={() => setSistema(s)}
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                border: "1px solid #e5e7eb",
                background: sistema === s ? "#111827" : "white",
                color: sistema === s ? "white" : "#111827",
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              {s === "todos" ? "Todos os sistemas" : (SISTEMAS_LABEL as any)[s] ?? s}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtrados.length === 0 ? (
          <div style={{ padding: 16, border: "1px solid #e5e7eb", borderRadius: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Nada encontrado</div>
            <div style={{ color: "#374151" }}>
              Tente termos mais simples (ex: “tosse”, “dor”, “enjoo”) ou troque os filtros.
            </div>
          </div>
        ) : (
          filtrados.map((item) => {
            const isFav = favoritos.includes(item.id);

            return (
              <div key={item.id} style={{ border: "1px solid #e5e7eb", borderRadius: 18, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                      <div style={{ fontSize: 16, fontWeight: 800 }}>{item.titulo}</div>

                      {/* Badge do sistema */}
                      <span style={{ fontSize: 12, padding: "3px 8px", borderRadius: 999, border: "1px solid #e5e7eb" }}>
                        {SISTEMAS_LABEL[item.sistema]}
                      </span>

                      {/* Tags (ex: otc) */}
                      {item.tags.slice(0, 2).map((t) => (
                        <span key={t} style={{ fontSize: 12, padding: "3px 8px", borderRadius: 999, border: "1px solid #e5e7eb" }}>
                          {t}
                        </span>
                      ))}
                    </div>

                    <div style={{ marginTop: 6, color: "#374151" }}>{item.resumo}</div>

                    <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                      <button
                        onClick={() => abrirItem(item.id)}
                        style={{ padding: "10px 12px", borderRadius: 14, border: "1px solid #e5e7eb", background: "#111827", color: "white", cursor: "pointer" }}
                      >
                        Abrir
                      </button>

                      <button
                        onClick={() => toggleFav(item.id)}
                        style={{ padding: "10px 12px", borderRadius: 14, border: "1px solid #e5e7eb", background: "white", cursor: "pointer" }}
                        title={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                        aria-label="Favoritar"
                      >
                        {isFav ? "⭐ Favorito" : "☆ Favoritar"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
