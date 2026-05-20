import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { milkAPI, dairyAPI, dairyConfigAPI } from '../services/api';
import useFetch from '../hooks/useFetch.js';
import Spinner from '../components/Spinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { currency, liters, formatDate, toCSV, downloadFile, exportExcel } from '../utils/format.js';

const TABS = [
  { key: 'range', label: 'Range Report' },
  { key: 'dairy', label: 'Dairy Report' }
];

const round = (n) => Number(Number(n || 0).toFixed(2));

export default function Reports() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const monthAgoStr = monthAgo.toISOString().slice(0, 10);

  const [tab, setTab] = useState('range');
  const [from, setFrom] = useState(monthAgoStr);
  const [to, setTo] = useState(today);
  const [serial, setSerial] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const entries = await milkAPI.list({
        from,
        to,
        serialNumber: serial.trim() || undefined
      });
      const totals = entries.reduce(
        (a, e) => {
          a.qty += e.quantity;
          a.amt += e.totalAmount;
          a.fat += e.fat;
          return a;
        },
        { qty: 0, amt: 0, fat: 0 }
      );
      setReport({
        kind: 'range',
        data: {
          from,
          to,
          serial: serial.trim(),
          count: entries.length,
          totalQuantity: round(totals.qty),
          totalAmount: round(totals.amt),
          averageFat: entries.length ? round(totals.fat / entries.length) : 0,
          entries
        }
      });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const buildExport = () => {
    if (!report || report.kind !== 'range') return null;
    const rows = report.data.entries;
    const columns = [
      { label: 'Date', value: (r) => formatDate(r.date) },
      { label: 'Serial', key: 'serialNumber' },
      { label: 'Customer', key: 'customerName' },
      { label: 'Session', key: 'session' },
      { label: 'Quantity (L)', key: 'quantity' },
      { label: 'FAT', key: 'fat' },
      { label: 'Rate', key: 'rate' },
      { label: 'Amount', key: 'totalAmount' },
      { label: 'Edited By', key: 'editedBy' }
    ];
    const filename = `report-${from}_to_${to}${report.data.serial ? '-' + report.data.serial : ''}`;
    return { rows, columns, filename, sheetName: 'Range' };
  };

  const exportCSV = () => {
    const ex = buildExport();
    if (!ex) return;
    downloadFile(`${ex.filename}.csv`, toCSV(ex.rows, ex.columns));
  };

  const exportXLSX = async () => {
    const ex = buildExport();
    if (!ex) return;
    try {
      await exportExcel(`${ex.filename}.xlsx`, [
        { name: ex.sheetName, rows: ex.rows, columns: ex.columns }
      ]);
      toast.success('Excel file downloaded');
    } catch (err) {
      toast.error('Excel export failed. Run npm install in client/');
    }
  };

  const canExport = report && report.kind === 'range';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Reports</h2>
        <div className="flex gap-2 no-print">
          <button className="btn-ghost" onClick={() => window.print()}>🖨️ Print</button>
          <button className="btn-ghost" onClick={exportCSV} disabled={!canExport}>⬇️ CSV</button>
          <button className="btn-primary" onClick={exportXLSX} disabled={!canExport}>📊 Excel</button>
        </div>
      </div>

      <div className="card p-3 flex gap-1 flex-wrap no-print">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setReport(null); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === t.key
              ? 'bg-brand-600 text-white'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'range' && (
        <div className="card p-5 flex flex-wrap gap-3 items-end no-print">
          <div>
            <label className="label">From</label>
            <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">To</label>
            <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div>
            <label className="label">Serial Number (optional)</label>
            <input
              type="text"
              className="input"
              placeholder="All customers"
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
            />
          </div>
          <button onClick={run} className="btn-primary">Generate</button>
        </div>
      )}

      {loading && <Spinner />}

      {tab === 'dairy' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
          <DairyEntryView />
        </motion.div>
      )}

      {tab === 'range' && report && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
          <RangeView data={report.data} />
        </motion.div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className="text-xl font-bold text-slate-800 dark:text-white">{value}</div>
    </div>
  );
}

function RangeView({ data }) {
  return (
    <div>
      <div className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        {formatDate(data.from)} — {formatDate(data.to)}
        {data.serial && <span> · Serial #{data.serial}</span>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Stat label="Entries" value={data.count} />
        <Stat label="Total Qty" value={liters(data.totalQuantity)} />
        <Stat label="Avg FAT" value={data.averageFat} />
        <Stat label="Total Amount" value={currency(data.totalAmount)} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-700">
              <th className="th">Date</th>
              <th className="th">Serial</th>
              <th className="th">Customer</th>
              <th className="th">Session</th>
              <th className="th">Qty (L)</th>
              <th className="th">FAT</th>
              <th className="th">Rate</th>
              <th className="th text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.entries.map((e) => (
              <tr key={e._id}>
                <td className="td">{formatDate(e.date)}</td>
                <td className="td font-semibold">{e.serialNumber}</td>
                <td className="td">{e.customerName}</td>
                <td className="td">
                  <span className={`text-xs px-2 py-1 rounded-full ${e.session === 'Morning' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                    {e.session}
                  </span>
                </td>
                <td className="td">{e.quantity.toFixed(2)}</td>
                <td className="td">{e.fat.toFixed(1)}</td>
                <td className="td">{currency(e.rate)}</td>
                <td className="td text-right font-semibold">
                  {currency(e.totalAmount)}
                  {e.editedBy && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Edited by {e.editedBy}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {data.entries.length === 0 && (
              <tr><td colSpan="8" className="td text-center text-slate-400">No entries in this period</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DairyEntryView() {
  const { isAdmin, isOwner, user } = useAuth();
  const ownerDairies = user?.dairies || [];
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [filterDairy, setFilterDairy] = useState('');
  const { data: dairies } = useFetch(() => dairyConfigAPI.list(), []);
  const activeDairies = (dairies || []).filter((d) => d.active);
  const formDairyOptions = isAdmin ? activeDairies.map((d) => d.name) : ownerDairies;
  const getInitialForm = () => ({
    dairy: !isAdmin && ownerDairies.length === 1 ? ownerDairies[0] : '',
    session: 'Morning',
    quantity: '',
    fat: '',
    pricePerFat: ''
  });
  const [form, setForm] = useState(getInitialForm());
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data: entries, loading, refetch } = useFetch(
    () => dairyAPI.list({ date, dairy: filterDairy || undefined }),
    [date, filterDairy]
  );

  const submit = async (e) => {
    e.preventDefault();
    if (!form.quantity || !form.fat || !form.pricePerFat) return toast.error('Enter quantity, FAT and price');
    const dairyToSend = form.dairy;
    if (!dairyToSend) return toast.error('Select a dairy');
    setSaving(true);
    try {
      if (editingId) {
        await dairyAPI.update(editingId, {
          date,
          dairy: dairyToSend,
          session: form.session,
          quantity: Number(form.quantity),
          fat: Number(form.fat),
          pricePerFat: Number(form.pricePerFat)
        });
        toast.success('Dairy entry updated');
      } else {
        await dairyAPI.create({
          date,
          dairy: dairyToSend,
          session: form.session,
          quantity: Number(form.quantity),
          fat: Number(form.fat),
          pricePerFat: Number(form.pricePerFat)
        });
        toast.success('Dairy entry saved');
      }
      setEditingId(null);
      setDate(today);
      setForm(getInitialForm());
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDate(today);
    setForm(getInitialForm());
  };

  const editEntry = (entry) => {
    const entryDate = new Date(entry.date).toISOString().slice(0, 10);
    setEditingId(entry._id);
    setDate(entryDate);
    setForm({
      dairy: entry.dairy,
      session: entry.session,
      quantity: String(entry.quantity),
      fat: String(entry.fat),
      pricePerFat: String(entry.pricePerFat)
    });
  };

  const remove = async (id) => {
    if (!confirm('Delete this dairy entry?')) return;
    try {
      await dairyAPI.remove(id);
      toast.success('Deleted');
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    }
  };

  const rows = entries || [];
  const totals = rows.reduce(
    (a, e) => ({ qty: a.qty + e.quantity, amt: a.amt + e.totalAmount }),
    { qty: 0, amt: 0 }
  );

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold text-slate-800 dark:text-white mb-1">Add Dairy Entry</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Dairy-side supply log. Price (₹/FAT) entered manually. Rate = FAT × Price / 10, Amount = Quantity × Rate.
        </p>
      </div>

      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-6 gap-3 no-print">
        <div>
          <label className="label">Dairy</label>
          {!isAdmin && ownerDairies.length === 1 ? (
            <input className="input" value={ownerDairies[0]} disabled />
          ) : (
            <select
              className="input"
              value={form.dairy}
              onChange={(e) => setForm({ ...form, dairy: e.target.value })}
            >
              <option value="">Select dairy...</option>
              {formDairyOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="label">Date</label>
          <input
            type="date"
            className="input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Session</label>
          <select
            className="input"
            value={form.session}
            onChange={(e) => setForm({ ...form, session: e.target.value })}
          >
            <option>Morning</option>
            <option>Evening</option>
          </select>
        </div>
        <div>
          <label className="label">Quantity (L)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="input"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">FAT</label>
          <input
            type="number"
            step="0.1"
            min="0"
            className="input"
            value={form.fat}
            onChange={(e) => setForm({ ...form, fat: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">Price (₹/FAT)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="input"
            value={form.pricePerFat}
            onChange={(e) => setForm({ ...form, pricePerFat: e.target.value })}
            required
          />
        </div>
        <div className="md:col-span-6 flex flex-wrap gap-2">
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? 'Saving...' : editingId ? 'Update Dairy Entry' : 'Add Dairy Entry'}
          </button>
          {editingId && (
            <button type="button" className="btn-ghost" onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="border-t border-slate-200 dark:border-slate-700 pt-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-4 no-print">
          <h3 className="font-semibold text-slate-800 dark:text-white">
            Entries on {formatDate(date)}
            {!isAdmin && ownerDairies.length > 0 && (
              <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">
                · {ownerDairies.join(', ')}
              </span>
            )}
          </h3>
          {(isAdmin || ownerDairies.length > 1) && (
            <div>
              <label className="label">Show dairy</label>
              <select
                className="input md:max-w-xs"
                value={filterDairy}
                onChange={(e) => setFilterDairy(e.target.value)}
              >
                <option value="">{isAdmin ? 'All' : 'All my dairies'}</option>
                {(isAdmin ? (dairies || []).map((d) => d.name) : ownerDairies).map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <Stat label="Entries" value={rows.length} />
          <Stat label="Total Qty" value={liters(totals.qty)} />
          <Stat label="Total Amount" value={currency(totals.amt)} />
        </div>

        {loading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700">
                  <th className="th">Dairy</th>
                  <th className="th">Session</th>
                  <th className="th">Qty (L)</th>
                  <th className="th">FAT</th>
                  <th className="th">Price/FAT</th>
                  <th className="th">Rate (₹/L)</th>
                  <th className="th text-right">Amount</th>
                  {(isAdmin || isOwner) && <th className="th text-right no-print">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e._id}>
                    <td className="td">
                      <span className={`text-xs px-2 py-1 rounded-full ${e.dairy === 'Nature Dairy' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'
                        }`}>
                        {e.dairy || '—'}
                      </span>
                    </td>
                    <td className="td">
                      <span className={`text-xs px-2 py-1 rounded-full ${e.session === 'Morning' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                        }`}>
                        {e.session}
                      </span>
                    </td>
                    <td className="td">{e.quantity.toFixed(2)}</td>
                    <td className="td">{e.fat.toFixed(1)}</td>
                    <td className="td">{currency(e.pricePerFat)}</td>
                    <td className="td">{currency(e.rate)}</td>
                    <td className="td text-right font-semibold">{currency(e.totalAmount)}</td>
                    {(isAdmin || isOwner) && (
                      <td className="td text-right no-print space-x-2">
                        <button className="btn-ghost" onClick={() => editEntry(e)}>Edit</button>
                        {isAdmin && (
                          <button className="btn-ghost text-red-500" onClick={() => remove(e._id)}>Delete</button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={isAdmin || isOwner ? 8 : 7} className="td text-center text-slate-400">No entries for this date</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
