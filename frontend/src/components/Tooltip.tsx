export default function Tooltip({
  text,
  children,
  block = false,
}: {
  text: string;
  children: React.ReactNode;
  block?: boolean;
}) {
  return (
    <span className={`relative group/tip ${block ? "block" : "inline-flex"}`}>
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-md border border-white/[.1] bg-zinc-900 px-2 py-1 text-xs text-zinc-300 opacity-0 transition-opacity duration-150 group-hover/tip:opacity-100 z-50 shadow-lg">
        {text}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
      </span>
    </span>
  );
}
