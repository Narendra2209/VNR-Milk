export default function Spinner({ label = 'Loading...' }) {
  return (
    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-300 py-6">
      <div className="w-5 h-5 rounded-full border-2 border-slate-300 border-t-brand-600 animate-spin" />
      <span>{label}</span>
    </div>
  );
}
