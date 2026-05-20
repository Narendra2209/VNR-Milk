export default function Settings({ dark, setDark }) {
  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Settings</h2>

      <div className="card p-5">
        <h3 className="font-semibold mb-3 text-slate-800 dark:text-white">Appearance</h3>
        <label className="flex items-center justify-between">
          <span className="text-slate-700 dark:text-slate-200">Dark Mode</span>
          <button
            onClick={() => setDark(!dark)}
            className={`w-12 h-6 rounded-full transition relative ${dark ? 'bg-brand-600' : 'bg-slate-300'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition ${dark ? 'translate-x-6' : ''}`}
            />
          </button>
        </label>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold mb-3 text-slate-800 dark:text-white">Rate Formula</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
          Each customer has their own <strong>Price per FAT</strong> (set on the Customers page).
          The amount is calculated as:
        </p>
        <div className="rounded-xl bg-slate-50 dark:bg-slate-700 p-4 font-mono text-sm space-y-1">
          <div>Rate per Litre = (FAT × Customer Price) / 10</div>
          <div>Total Amount = Quantity × Rate per Litre</div>
          <div className="text-slate-400">= Quantity × FAT × Customer Price / 10</div>
        </div>
        <div className="mt-4 text-sm text-slate-600 dark:text-slate-300">
          <div className="font-semibold mb-1">Example</div>
          Quantity 107.2 L · FAT 6.2 · Customer Price ₹85 →
          <span className="font-mono ml-2">107.2 × 6.2 × 85 / 10 = ₹5,649.44</span>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold mb-3 text-slate-800 dark:text-white">About</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          VNR Milk Collection Management System · v1.0.0
        </p>
      </div>
    </div>
  );
}
