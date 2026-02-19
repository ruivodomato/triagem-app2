import ScreenContainer from "@/components/ScreenContainer";

export default function SistemasPage() {
  return (
    <ScreenContainer>
      <h1 className="text-2xl font-semibold">Sistemas</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Página para organizar sistemas do corpo e conteúdos da triagem.
      </p>

      <div className="mt-6 rounded-xl border bg-white p-4 shadow-sm">
        <div className="font-medium">Em breve</div>
        <div className="mt-1 text-sm text-neutral-600">
          Aqui vamos listar sintomas, sinais de alarme e orientações.
        </div>
      </div>
    </ScreenContainer>
  );
}
