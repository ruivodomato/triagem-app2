"use client";

import React, { useMemo, useState } from "react";
import {
  carregarHistorico,
  limparHistorico,
  inferirSistemaKeyPorNome,
  type HistoricoItem,
} from "@/lib/historico";

function fmtData(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function badge(risco: HistoricoItem["risco"]) {
  if (risco === "alto") return "border-red-200 bg-red-50 text-red-800";
  if (risco === "moderado") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-green-200 bg-green-50 text-green-800";
}

function labelRisco(risco: HistoricoItem["risco"]) {
  if (risco === "alto") return "ALTO";
  if (risco === "moderado") return "MODERADO";
  return "BAIXO";
}

function montarQuery(item: HistoricoItem) {
  const sistemaKey = item.sistemaKey || inferirSistemaKeyPorNome(item.sistema) || "";

  // query pequena, mas suficiente para reabrir
  const q = new URLSearchParams();
  if (item.sintomas?.length) q.set("sintomas", item.sintomas.join("|"));
  if (item.alergias?.length) q.set("alergias", item.alergias.join("|"));
  if (item.idade !== null && item.idade !== undefined) q.set("idade", String(item.idade));
  if (item.dias !== null && item.dias !== undefined) q.set("dias", String(item.dias));
  if (item.gestante) q.set("gestante", "1");

  // opcionais (se você vier a salvar)
  if (item.criancaMenor12) q.set("criancaMenor12", "1");
  if (item.riscoGastriteRimAnticoagulante) q.set("evitarAINE", "1");

  return { sistemaKey, query: q.toString() };
}

export default function HistoricoPage() {
  const [tick, setTick] = useState(0); // força re-render após limpar
  const [q, setQ] = useState("");

  const itens = useMemo(() => {
    const all = carregarHistorico();
    const nq = q.trim().toLowerCase();
    if (!nq) return all;

    return all.filter((i) => {
      const hay = [
        i.sistema,
        i.risco,
        (i.sintomas || []).join(" "),
        (i.alergias || []).join(" "),
        i.textoCompartilhavel || "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(nq);
    });
  }, [tick, q]);

  function onLimpar() {
    if (!confirm("Tem certeza que deseja limpar todo o histórico?")) return;
    limparHistorico();
    setTick((x) => x + 1);
  }

  function onCopiar(texto: string) {
    navigator.clipboard?.writeText?.(texto).catch(() => {});
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Histórico</h1>
          <p className="mt-1 text-sm text-gray-600">
            Registros salvos quando você clica em “Copiar orientação”.
          </p>
        </div>

        <div className="flex gap-2">
          <a href="/triagem" className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-neutral-50">
            Voltar
          </a>
          <button onClick={onLimpar} className="rounded-xl bg-black px-4 py-2 text-sm text-white hover:opacity-90">
            Limpar
          </button>
        </div>
      </div>

      <div className="mt-6">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar no histórico (sistema, sintomas, risco, texto...)"
          className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:ring-2"
        />
      </div>

      <div className="mt-8 space-y-4">
        {itens.length === 0 ? (
          <div className="rounded-2xl border border-gray-300 p-5">
            <div className="font-semibold">Nada no histórico</div>
            <p className="mt-1 text-sm text-gray-600">
              Faça uma triagem e clique em “Copiar orientação” para salvar aqui.
            </p>
          </div>
        ) : (
          itens.map((item) => {
            const { sistemaKey, query } = montarQuery(item);
            const reabrirHref = sistemaKey ? `/triagem/${sistemaKey}?${query}` : "";

            return (
              <div key={item.id} className="rounded-2xl border border-gray-300 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-lg font-semibold">{item.sistema}</div>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badge(item.risco)}`}>
                        {labelRisco(item.risco)}
                      </span>
                      <span className="text-xs text-gray-500">{fmtData(item.dataISO)}</span>
                    </div>

                    <div className="mt-2 text-sm text-gray-700">
                      <b>Sintomas:</b> {item.sintomas?.length ? item.sintomas.join(", ") : "-"}
                    </div>

                    <div className="mt-1 text-sm text-gray-700">
                      <b>Alergias:</b> {item.alergias?.length ? item.alergias.join(", ") : "Nenhuma"}
                    </div>

                    <div className="mt-1 text-sm text-gray-700">
                      <b>Contexto:</b>{" "}
                      {item.idade !== null && item.idade !== undefined ? `${item.idade} anos` : "idade n/i"} •{" "}
                      {item.dias !== null && item.dias !== undefined ? `${item.dias} dias` : "dias n/i"} •{" "}
                      {item.gestante ? "gestante" : "não gestante"}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {reabrirHref ? (
                      <a
                        href={reabrirHref}
                        className="rounded-xl bg-black px-4 py-2 text-sm text-white hover:opacity-90"
                        title="Reabrir a triagem com os mesmos dados"
                      >
                        Reabrir
                      </a>
                    ) : (
                      <button
                        className="cursor-not-allowed rounded-xl bg-gray-200 px-4 py-2 text-sm text-gray-600"
                        title="Não consegui identificar a rota do sistema"
                        disabled
                      >
                        Reabrir
                      </button>
                    )}

                    <button
                      onClick={() => onCopiar(item.textoCompartilhavel)}
                      className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-neutral-50"
                    >
                      Copiar texto
                    </button>
                  </div>
                </div>

                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-700 hover:underline">Ver texto completo</summary>
                  <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-gray-200 bg-neutral-50 p-4 text-sm text-gray-800">
                    {item.textoCompartilhavel}
                  </pre>
                </details>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
