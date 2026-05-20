import { reportAPI } from '../services/api';
import useFetch from '../hooks/useFetch.js';
import DashboardCard from '../components/DashboardCard.jsx';
import Spinner from '../components/Spinner.jsx';
import { currency, liters } from '../utils/format.js';
import {
  LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

export default function Dashboard() {
  const { data, loading, error } = useFetch(() => reportAPI.dashboard(), []);

  if (loading) return <Spinner />;
  if (error) return (
    <div className="card p-6 text-red-500">
      Failed to load dashboard. Make sure the backend is running on port 5000 and MongoDB is connected.
    </div>
  );

  const cards = [
    { title: 'Total Customers', value: data.totalCustomers, icon: '👥', accent: 'bg-blue-50 text-blue-600' },
    { title: 'Today Morning', value: liters(data.todayMorningQty), icon: '🌅', accent: 'bg-amber-50 text-amber-600' },
    { title: 'Today Evening', value: liters(data.todayEveningQty), icon: '🌙', accent: 'bg-indigo-50 text-indigo-600' },
    { title: 'Today Total', value: liters(data.todayTotalQty), icon: '🥛', accent: 'bg-emerald-50 text-emerald-600' },
    { title: 'Today Revenue', value: currency(data.todayRevenue), icon: '💰', accent: 'bg-pink-50 text-pink-600' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Daily collection at a glance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((c, i) => <DashboardCard key={c.title} {...c} delay={i * 0.05} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold mb-3 text-slate-800 dark:text-white">Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="amount" fill="#2563eb" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold mb-3 text-slate-800 dark:text-white">FAT Trend (14 days)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.fatTrend}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="avgFat" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold mb-3 text-slate-800 dark:text-white">Daily Collection (14 days)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.fatTrend}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="quantity" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
