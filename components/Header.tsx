"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  return (
    <header style={{
      width: "100%",
      padding: "12px 16px",
      borderBottom: "1px solid #eee",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: "#fff",
      position: "sticky",
      top: 0,
      zIndex: 10
    }}>
      <Link href="/" style={{ fontWeight: "bold" }}>
        🏠 TRIAGEM
      </Link>

      <div style={{ display: "flex", gap: 12 }}>
        <Link href="/triagem">
          Triagem
        </Link>

        <Link href="/triagem/historico">
          Histórico
        </Link>
      </div>
    </header>
  );
}