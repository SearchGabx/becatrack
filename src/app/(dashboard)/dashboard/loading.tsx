export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Cargando módulo">
      <div className="space-y-2 border-b border-[#CCCCCC] pb-4">
        <div className="h-3 w-36 rounded bg-[#A3161A]/20" />
        <div className="h-7 w-64 rounded-lg bg-[#CCCCCC]/60" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="h-24 rounded-xl border border-[#CCCCCC]/60 bg-white p-5" />
        <div className="h-24 rounded-xl border border-[#CCCCCC]/60 bg-white p-5" />
        <div className="h-24 rounded-xl border border-[#CCCCCC]/60 bg-white p-5" />
      </div>
      <div className="h-72 rounded-xl border border-[#CCCCCC]/60 bg-white p-6" />
    </div>
  );
}
