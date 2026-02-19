"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { lerHistorico, limparHistorico, type HistoricoItem, inferirSistemaKeyPorNome } from "@/lib/historico";

function fmtData(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("pt-BR");
  } catch {
    return iso;
  }
}

function corRisco(r: HistoricoItem["risco"]) {
  if (r === "alto") return "text-red-600";
  if (r === "moderado") return "text-yellow-600";
  return "text-green-600";
}

function etiquetaRisco(r: HistoricoItem["risco"]) {
  if (r === "alto") return "ALTO";
  if (r === "moderado") return "MODERADO";
  return "BAIXO";
}

function buildReabrirUrl(item: HistoricoItem) {
  const sistemaKey = item.sistemaKey || inferirSistemaKeyPorNome(item.sistema) || "respiratorio";
  const base = `/triagem/${encodeURIComponent(sistemaKey)}`;

  const qs = new URLSearchParams();

  if (item.sintomas?.length) qs.set("sintomas", item.sintomas.join("|"));
  if (item.alergias?.length) qs.set("alergias", item.alergias.join("|"));
  if (item.idade !== null && item.idade !== undefined) qs.set("idade", String(item.idade));
  if (item.dias !== null && item.dias !== undefined) qs.set("dias", String(item.dias));
  if (item.gestante) qs.set("gestante", "1");
  if (item.dorForte) qs.set("dorForte", "1");
  if (item.incapazHidratar) qs.set("incapazHidratar", "1");

  const q = qs.toString();
  return q ? `${base}?${q}` : base;
}

export default function HistoricoPage() {
  const [atualizar, setAtualizar] = useState(0);

  const itens = useMemo(() => {
    void atualizar;
    return lerHistorico();
  }, [atualizar]);

  const tem = itens.length > 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Histórico</h1>
          <p className="mt-1 text-sm text-gray-600">Registros salvos ao copiar a orientação.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/triagem" className="rounded-xl border border-gray-300 px-4 py-2 text-sm hover:bg-neutral-50">
            Voltar para Triagem
          </Link>

          <button
            type="button"
            onClick={() => {
              if (!confirm("Tem certeza que deseja limpar todo o histórico?")) return;
              limparHistorico();
              setAtualizar((x) => x + 1);
            }}
            className="rounded-xl bg-black px-4 py-2 text-sm text-white hover:opacity-90"
          >
            Limpar histórico
          </button>
        </div>
      </div>

      {!tem ? (
        <div className="mt-10 rounded-xl border border-gray-300 p-6">
          <p className="text-gray-700">Nenhum item no histórico ainda.</p>
          <p className="mt-2 text-sm text-gray-500">
            Gere uma orientação e clique em <b>“Copiar orientação”</b> para salvar automaticamente.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {itens.map((item) => {
            const reabrir = buildReabrirUrl(item);

            return (
              <div key={item.id} className="rounded-2xl border border-gray-300 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-sm text-gray-500">{fmtData(item.dataISO)}</div>
                    <div className="mt-1 text-lg font-semibold">{item.sistema}</div>
                    <div className="mt-1 text-sm">
                      Risco: <span className={`${corRisco(item.risco)} font-semibold`}>{etiquetaRisco(item.risco)}</span>
                    </div>

                    <div className="mt-3 text-sm text-gray-700">
                      <div>
                        <span className="font-medium">Sintomas:</span> {item.sintomas?.length ? item.sintomas.join(", ") : "-"}
                      </div>
                      <div className="mt-1">
                        <span className="font-medium">Alergias:</span> {item.alergias?.length ? item.alergias.join(", ") : "Nenhuma"}
                      </div>
                      <div className="mt-1">
                        <span className="font-medium">Contexto:</span>{" "}
                        {item.idade !== null ? `${item.idade} anos` : "idade n/i"} •{" "}
                        {item.dias !== null ? `${item.dias} dias` : "dias n/i"} •{" "}
                        {item.gestante ? "gestante" : "não gestante"}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link href={reabrir} className="rounded-xl bg-black px-4 py-2 text-sm text-white hover:opacity-90">
                      Reabrir
                    </Link>

                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(item.textoCompartilhavel);
                          alert("Texto copiado ✅");
                        } catch {
                          alert("Não consegui copiar automaticamente.");
                        }
                      }}
                      className="rounded-xl border border-gray-300 px-4 py-2 text-sm hover:bg-neutral-50"
                    >
                      Copiar texto
                    </button>
                  </div>
                </div>

                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-700 hover:underline">Ver texto completo</summary>
                  <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-gray-200 bg-neutral-50 p-4 text-xs text-gray-700">
{item.textoCompartilhavel}
                  </pre>
                </details>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
