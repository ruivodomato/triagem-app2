"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ScreenContainer from "@/components/ScreenContainer";

const STORAGE_KEY = "triagem_aviso_aceito_v1";

export default function AvisoPage() {
  const router = useRouter();
  const [aceito, setAceito] = useState(false);

  useEffect(() => {
    const ok = localStorage.getItem(STORAGE_KEY) === "true";
    if (ok) router.replace("/triagem");
  }, [router]);

  function aceitar() {
    localStorage.setItem(STORAGE_KEY, "true");
    router.push("/triagem");
  }

  return (
    <ScreenContainer>
      <h1 className="text-3xl font-semibold">Aviso importante</h1>
      <p className="mt-3 text-neutral-700">
        Este app é um <b>guia de bolso</b> com orientações gerais para sintomas comuns e casos leves.
        Ele <b>não substitui</b> consulta médica, diagnóstico, exames ou atendimento de urgência.
      </p>

      <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
        <div className="font-medium">Antes de usar, confirme que você entendeu:</div>

        <ul className="mt-3 list-disc pl-5 text-sm text-neutral-700 space-y-2">
          <li>As sugestões são gerais e podem não servir para todas as pessoas.</li>
          <li>Em caso de <b>sinais de alerta</b>, procure atendimento imediatamente.</li>
          <li>Evite automedicação excessiva; peça orientação ao farmacêutico e leia a bula.</li>
          <li>
            Se estiver grávida, for criança, tiver doenças crônicas ou usar medicamentos contínuos,
            a cautela deve ser maior.
          </li>
        </ul>
      </div>

      <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
        <div className="font-medium text-red-700">Procure atendimento URGENTE se:</div>
        <ul className="mt-3 list-disc pl-5 text-sm text-red-700 space-y-2">
          <li>Falta de ar importante, chiado intenso, lábios arroxeados</li>
          <li>Dor forte no peito, desmaio, confusão mental</li>
          <li>Sangramento importante, vômitos persistentes</li>
          <li>Febre alta persistente, rigidez de nuca, convulsão</li>
          <li>Piora rápida ou sinais de gravidade</li>
        </ul>
      </div>

      <label className="mt-6 flex items-center gap-2 rounded-xl border bg-white p-4 shadow-sm">
        <input type="checkbox" checked={aceito} onChange={(e) => setAceito(e.target.checked)} />
        <span className="text-sm">
          Li e entendi. Quero continuar para a triagem.
        </span>
      </label>

      <button
        onClick={aceitar}
        disabled={!aceito}
        className="mt-6 w-full rounded-xl bg-black py-3 text-white disabled:opacity-40 hover:bg-neutral-800"
      >
        Aceitar e continuar
      </button>

      <p className="mt-3 text-xs text-neutral-500">
        (Você pode limpar o aceite apagando os dados do site no navegador.)
      </p>
    </ScreenContainer>
  );
}
