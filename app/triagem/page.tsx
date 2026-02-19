import Link from "next/link";
import ScreenContainer from "@/components/ScreenContainer";

const SISTEMAS = [
  { id: "respiratorio", nome: "Respiratório", desc: "Tosse, falta de ar, febre, coriza..." },
  { id: "gastrointestinal", nome: "Gastrointestinal", desc: "Náusea, vômito, diarreia, dor abdominal..." },
  { id: "musculoesqueletico", nome: "Musculoesquelético", desc: "Dor muscular, dor articular, inchaço..." },
  { id: "urinario", nome: "Urinário", desc: "Ardor ao urinar, urgência, dor lombar..." },
  { id: "neurologico", nome: "Neurológico", desc: "Dor de cabeça, tontura, fraqueza..." },
  { id: "ginecologico", nome: "Ginecológico", desc: "Cólica, corrimento, coceira, dor pélvica..." },
  { id: "pediatrico", nome: "Pediátrico", desc: "Febre, tosse, diarreia, vômito (orientação geral)..." },
];

export default function TriagemPage() {
  return (
    <ScreenContainer>
      <h1 className="text-3xl font-semibold">Triagem</h1>
      <p className="mt-2 text-neutral-600">
        Selecione um sistema do corpo ou use a busca global.
      </p>

      {/* NOVO BOTÃO BUSCA GLOBAL */}
      <div className="mt-6">
        <Link
          href="/triagem/busca"
          className="inline-flex w-full justify-center rounded-xl bg-black px-4 py-3 text-white shadow-sm hover:bg-neutral-800"
        >
          🔎 Busca Global de Sintomas
        </Link>
      </div>

      {/* AVISO */}
      <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        <div className="font-medium">Importante</div>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Este app não substitui consulta médica.</li>
          <li>Siga a bula e peça orientação ao farmacêutico.</li>
          <li>Em sinais de alerta (falta de ar, dor forte, sangue, desmaio), procure atendimento.</li>
        </ul>
      </div>

      {/* SISTEMAS */}
      <div className="mt-8 grid gap-3">
        {SISTEMAS.map((s) => (
          <Link
            key={s.id}
            href={`/triagem/${s.id}`}
            className="rounded-xl border bg-white p-4 shadow-sm hover:bg-neutral-50"
          >
            <div className="font-medium">{s.nome}</div>
            <div className="text-sm text-neutral-600">{s.desc}</div>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <Link
          href="/historico"
          className="inline-flex rounded-xl border bg-white px-4 py-3 text-sm shadow-sm hover:bg-neutral-50"
        >
          Ver histórico
        </Link>
      </div>
    </ScreenContainer>
  );
}
