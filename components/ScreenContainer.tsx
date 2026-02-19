import React from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
};

export default function ScreenContainer({ children, className = "", narrow = true }: Props) {
  return (
    <main className="min-h-[calc(100vh-64px)] w-full">
      <div
        className={[
          "mx-auto w-full px-4 py-6",
          narrow ? "max-w-3xl" : "max-w-6xl",
          className,
        ].join(" ")}
      >
        {children}
      </div>
    </main>
  );
}
