import type { Metadata } from "next";
import "./globals.css";
import PWARegister from "@/components/PWARegister";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "TRIAGEM - O SEU GUIA DE BOLSO",
  description: "Triagem rápida com orientações básicas, sinais de alerta e sugestões OTC.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* iOS icon (opcional, mas ajuda) */}
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>
        <PWARegister />
        <Header />
        {children}
      </body>
    </html>
  );
}