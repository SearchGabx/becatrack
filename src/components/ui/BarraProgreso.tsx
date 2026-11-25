export function BarraProgreso({ porcentaje }: { porcentaje: number }) {
  const safePct = Math.max(0, Math.min(100, porcentaje));
  const barColor =
    safePct >= 100
      ? 'bg-[#078930]'
      : safePct >= 50
        ? 'bg-[#C9A227]'
        : 'bg-[#A3161A]';

  return (
    <div className="h-3 w-full rounded-full bg-[#CCCCCC]/60 overflow-hidden">
      <div
        className={`h-3 rounded-full transition-all duration-300 ${barColor}`}
        style={{ width: `${safePct}%` }}
      />
    </div>
  );
}
