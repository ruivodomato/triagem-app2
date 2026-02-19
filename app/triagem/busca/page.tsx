"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import ScreenContainer from "@/components/ScreenContainer";
import { SISTEMAS } from "@/lib/sistemas";
import { loadFavoritos, saveFavoritos, loadRecentes, pushRecente } from "@/lib/storage";

function normalize(s: string) {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

type Hit = {
  key: string;        // "sistema::sintoma"
  sistemaKey: string; // ex: "respiratorio"
  sistemaNome: string;
  sintoma: string;
};

export default function BuscaTriagemPage() {
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
    return ["todos", ...Object.keys(SISTEMAS)];
  }, []);

  const baseHits: Hit[] = useMemo(() => {
    const hits: Hit[] = [];

    for (const [sistemaKey, cfg] of Object.entries(SISTEMAS)) {
      for (const sintoma of cfg.sintomas) {
        hits.push({
          key: `${sistemaKey}::${sintoma}`,
          sistemaKey,
          sistemaNome: cfg.nome,
          sintoma,
        });
      }
    }

    return hits;
  }, []);

  const filtrados = useMemo(() => {
    const nq = normalize(q);

    let base = baseHits;

    // modo
    if (modo === "favoritos") {
      base = base.filter((h) => favoritos.includes(h.key));
    } else if (modo === "recentes") {
      base = recentes
        .map((k) => baseHits.find((h) => h.key === k))
        .filter(Boolean) as Hit[];
    }

    // filtro de sistema
    if (sistema !== "todos") {
      base = base.filter((h) => h.sistemaKey === sistema);
    }

    if (!nq) return base;

    return base.filter((h) => {
      const hay = [h.sintoma, h.sistemaNome, h.sistemaKey].map(normalize);
      return hay.some((x) => x.includes(nq));
    });
  }, [baseHits, recentes, favoritos, modo, sistema, q]);

  function toggleFav(hitKey: string) {
    const novo = favoritos.includes(hitKey)
      ? favoritos.filter((x) => x !== hitKey)
      : [hitKey, ...favoritos];
    setFavoritos(novo);
    saveFavoritos(novo);
  }

  function abrir(hit: Hit) {
    pushRecente(hit.key);
    setRecentes(loadRecentes());

    // manda para o sistema com sintoma preselecionado via querystring
    const url = `/triagem/${hit.sistemaKey}?sintoma=${encodeURIComponent(hit.sintoma)}`;
    window.location.href = url;
  }

  return (
    <ScreenContainer>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Busca Global</h1>
          <p className="mt-2 text-neutral-600">
            Pesquise sintomas em todos os sistemas. Ao abrir, o sintoma já vem selecionado.
          </p>
        </div>

        <Link
          href="/triagem"
          className="inline-flex rounded-xl border bg-white px-4 py-3 text-sm shadow-sm hover:bg-neutral-50"
        >
          Voltar
        </Link>
      </div>

      {/* Busca */}
      <div className="mt-6 space-y-3">
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar sintoma (ex: tosse, febre, dor...)"
            className="w-full rounded-xl border bg-white px-4 py-3 text-base outline-none focus:ring-2"
          />
          <button
            onClick={() => setQ("")}
            className="rounded-xl border bg-white px-4 py-3 text-sm shadow-sm hover:bg-neutral-50"
            title="Limpar"
          >
            ✕
          </button>
        </div>

        {/* modos */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(["todos", "favoritos", "recentes"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setModo(m)}
              className={
                "whitespace-nowrap rounded-full border px-3 py-2 text-sm " +
                (modo === m ? "bg-black text-white" : "bg-white hover:bg-neutral-50")
              }
            >
              {m === "todos" ? "Todos" : m === "favoritos" ? "⭐ Favoritos" : "🕘 Recentes"}
            </button>
          ))}
        </div>

        {/* sistemas */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sistemasDisponiveis.map((s) => (
            <button
              key={s}
              onClick={() => setSistema(s)}
              className={
                "whitespace-nowrap rounded-full border px-3 py-2 text-sm " +
                (sistema === s ? "bg-black text-white" : "bg-white hover:bg-neutral-50")
              }
            >
              {s === "todos" ? "Todos os sistemas" : SISTEMAS[s]?.nome ?? s}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="mt-6 grid gap-3">
        {filtrados.length === 0 ? (
          <div className="rounded-xl border bg-white p-4 text-sm text-neutral-700 shadow-sm">
            <div className="font-medium">Nada encontrado</div>
            <div className="mt-1 text-neutral-600">
              Tente termos mais simples ou remova filtros.
            </div>
          </div>
        ) : (
          filtrados.map((h) => {
            const isFav = favoritos.includes(h.key);

            return (
              <div key={h.key} className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{h.sintoma}</div>
                    <div className="mt-1 text-sm text-neutral-600">{h.sistemaNome}</div>
                  </div>

                  <button
                    onClick={() => toggleFav(h.key)}
                    className="rounded-xl border bg-white px-3 py-2 text-sm shadow-sm hover:bg-neutral-50"
                    title={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                  >
                    {isFav ? "⭐" : "☆"}
                  </button>
                </div>

                <div className="mt-3">
                  <button
                    onClick={() => abrir(h)}
                    className="rounded-xl bg-black px-4 py-3 text-sm text-white shadow-sm hover:bg-neutral-800"
                  >
                    Abrir triagem neste sistema
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </ScreenContainer>
  );
}
