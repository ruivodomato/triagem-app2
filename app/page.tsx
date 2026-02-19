import Link from "next/link";
import ScreenContainer from "@/components/ScreenContainer";

export default function HomePage() {
  return (
    <ScreenContainer>
      <h1 className="text-3xl font-semibold">Triagem — Guia de Bolso</h1>
      <p className="mt-2 text-neutral-600">
        Aplicação funcionando corretamente.
      </p>

      <div className="mt-8 grid gap-3">
        <Link
          href="/triagem"
          className="rounded-xl border bg-white p-4 shadow-sm hover:bg-neutral-50"
        >
          <div className="font-medium">Iniciar triagem</div>
          <div className="text-sm text-neutral-600">Escolher sistema</div>
        </Link>

        <Link
          href="/historico"
          className="rounded-xl border bg-white p-4 shadow-sm hover:bg-neutral-50"
        >
          <div className="font-medium">Histórico</div>
          <div className="text-sm text-neutral-600">Ver registros salvos</div>
        </Link>
      </div>
    </ScreenContainer>
  );
}
