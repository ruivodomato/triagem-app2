import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-semibold">
          TRIAGEM — Guia de Bolso
        </Link>

        <nav className="flex gap-4 text-sm">
          <Link className="hover:underline" href="/triagem">Triagem</Link>
          <Link className="hover:underline" href="/sistemas">Sistemas</Link>
          <Link className="hover:underline" href="/historico">Histórico</Link>
        </nav>
      </div>
    </header>
  );
}
