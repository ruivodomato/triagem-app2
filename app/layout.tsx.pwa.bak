import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "TRIAGEM - GUIA DE BOLSO",
  description: "Triagem rápida com orientações básicas e seguras.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="bg-neutral-50 text-neutral-900">
        <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-semibold">
              TRIAGEM - GUIA DE BOLSO
            </Link>

            <nav className="flex items-center gap-3">
              <Link
                href="/"
                className="rounded-lg px-3 py-2 text-sm hover:bg-neutral-100"
              >
                Início
              </Link>
              <Link
                href="/historico"
                className="rounded-lg px-3 py-2 text-sm hover:bg-neutral-100"
              >
                Histórico
              </Link>
              <Link
                href="/triagem"
                className="rounded-lg bg-black px-3 py-2 text-sm text-white hover:bg-neutral-800"
              >
                Iniciar
              </Link>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="mt-10 border-t bg-white">
          <div className="mx-auto max-w-3xl px-4 py-6 text-xs text-neutral-500">
            Este app não substitui avaliação médica. Em caso de emergência, procure atendimento imediatamente.
          </div>
        </footer>
      </body>
    </html>
  );
}
