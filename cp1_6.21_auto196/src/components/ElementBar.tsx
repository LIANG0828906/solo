export default function ElementBar() {
  return (
    <div className="h-20 border-t border-slate-700 bg-slate-900">
      <div className="flex h-full items-center justify-center gap-6">
        <div className="w-10 h-10 rounded-lg bg-red-500" />
        <div className="w-10 h-10 rounded-lg bg-blue-500" />
        <div className="w-10 h-10 rounded-lg bg-emerald-500" />
        <div className="w-10 h-10 rounded-lg bg-amber-500" />
      </div>
    </div>
  );
}
