import { motion } from 'framer-motion';

export default function DashboardCard({ title, value, icon, accent = 'bg-brand-50 text-brand-600', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="card p-5 flex items-center gap-4"
    >
      <div className={`w-12 h-12 rounded-xl grid place-items-center text-xl ${accent}`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</div>
        <div className="text-2xl font-bold text-slate-800 dark:text-white truncate">{value}</div>
      </div>
    </motion.div>
  );
}
