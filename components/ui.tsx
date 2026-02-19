export function Title({ text }: { text: string }) {
  return <h1 className="text-[22px] font-black my-3">{text}</h1>;
}

export function Card({
  title,
  subtitle,
  onClick,
}: {
  title: string;
  subtitle?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={[
        "bg-white border border-slate-200 rounded-2xl p-4 mt-3",
        onClick ? "cursor-pointer active:scale-[0.99] transition" : "",
      ].join(" ")}
    >
      <div className="font-extrabold">{title}</div>
      {subtitle ? <div className="opacity-70 mt-1">{subtitle}</div> : null}
    </div>
  );
}
