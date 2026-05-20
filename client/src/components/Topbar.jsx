export default function Topbar({ onMenu, dark, setDark }) {
  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-800/80 backdrop-blur border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between px-4 md:px-8 h-16">
        <button className="md:hidden btn-ghost" onClick={onMenu}>☰</button>
        <h1 className="text-lg font-semibold text-slate-800 dark:text-white">Milk Collection</h1>
        <button onClick={() => setDark(!dark)} className="btn-ghost" title="Toggle theme">
          {dark ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
}
