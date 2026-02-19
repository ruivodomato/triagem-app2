import { Suspense } from "react";
import SistemaClient from "./SistemaClient";

export const dynamicParams = false;

const SISTEMAS = [
  "respiratorio",
  "gastrointestinal",
  "musculoesqueletico",
  "urinario",
  "neurologico",
  "ginecologico",
  "pediatrico",
];

export function generateStaticParams() {
  return SISTEMAS.map((sistema) => ({ sistema }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ sistema: string }>;
}) {
  const { sistema } = await params;

  return (
    <Suspense fallback={<div className="px-4 py-10">Carregando…</div>}>
      <SistemaClient sistema={sistema} />
    </Suspense>
  );
}
