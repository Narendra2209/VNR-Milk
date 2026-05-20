import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { customerAPI, milkAPI } from '../services/api';
import useFetch from '../hooks/useFetch.js';
import { currency, liters, formatDate } from '../utils/format.js';

function ratePreview(fat, pricePerFat) {
  const f = Number(fat);
  const p = Number(pricePerFat);
  if (!f || !p) return 0;
  return Number(((f * p) / 10).toFixed(2));
}

export default function MilkEntryForm({ session }) {
  const today = new Date().toISOString().slice(0, 10);
  const [serial, setSerial] = useState('');
  const [customer, setCustomer] = useState(null);
  const [date, setDate] = useState(today);
  const [quantity, setQuantity] = useState('');
  const [fat, setFat] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: entries, refetch } = useFetch(() => milkAPI.list({ date, session }), [date, session]);

  const rate = useMemo(() => ratePreview(fat, customer?.pricePerFat), [fat, customer]);
  const total = useMemo(() => {
    const q = Number(quantity);
    const r = Number(rate);
    return q && r ? Number((q * r).toFixed(2)) : 0;
  }, [quantity, rate]);

  const findCustomer = async (sn) => {
    if (!sn) { setCustomer(null); return; }
    try {
      const c = await customerAPI.getBySerial(sn);
      setCustomer(c);
    } catch {
      setCustomer(null);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!customer) return toast.error('Customer not found');
    if (!quantity || !fat) return toast.error('Enter quantity and FAT');
    setSaving(true);
    try {
      await milkAPI.create({
        serialNumber: customer.serialNumber,
        date,
        session,
        quantity: Number(quantity),
        fat: Number(fat)
      });
      toast.success(`${session} entry saved`);
      setSerial(''); setCustomer(null); setQuantity(''); setFat('');
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const sessionEntries = entries || [];
  const totals = sessionEntries.reduce(
    (a, e) => ({ qty: a.qty + e.quantity, amt: a.amt + e.totalAmount, fat: a.fat + e.fat }),
    { qty: 0, amt: 0, fat: 0 }
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{session} Entry</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Record {session.toLowerCase()} milk collection</p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={submit}
        className="card p-5 grid grid-cols-1 md:grid-cols-6 gap-3"
      >
        <div className="md:col-span-1">
          <label className="label">Serial</label>
          <input
            className="input"
            value={serial}
            onChange={(e) => { setSerial(e.target.value); findCustomer(e.target.value); }}
            placeholder="S001"
            required
          />
        </div>
        <div className="md:col-span-2">
          <label className="label">Customer</label>
          <input
            className="input"
            value={
              customer
                ? `${customer.name} (${customer.milkType}) — ₹${Number(customer.pricePerFat ?? 0).toFixed(2)}/FAT`
                : (serial ? 'Not found' : '')
            }
            disabled
          />
        </div>
        <div>
          <label className="label">Date</label>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="label">Quantity (L)</label>
          <input
            type="number"
            step="0.01"
            className="input"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">FAT</label>
          <input
            type="number"
            step="0.1"
            className="input"
            value={fat}
            onChange={(e) => setFat(e.target.value)}
            required
          />
        </div>

        <div className="md:col-span-3 card p-3 bg-brand-50 dark:bg-slate-700 border-brand-100 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-300">Rate (auto)</div>
            <div className="text-lg font-bold text-brand-700 dark:text-brand-100">{currency(rate)}/L</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-300">Total Amount</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-300">{currency(total)}</div>
          </div>
        </div>

        <div className="md:col-span-3 flex items-end justify-end">
          <button type="submit" disabled={saving || !customer} className="btn-primary disabled:opacity-50">
            {saving ? 'Saving...' : `Save ${session} Entry`}
          </button>
        </div>
      </motion.form>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Entries</div>
          <div className="text-2xl font-bold">{sessionEntries.length}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Total Quantity</div>
          <div className="text-2xl font-bold">{liters(totals.qty)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Total Amount</div>
          <div className="text-2xl font-bold text-emerald-600">{currency(totals.amt)}</div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold mb-4 text-slate-800 dark:text-white">
          {session} entries — {formatDate(date)}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700">
                <th className="th">Serial</th>
                <th className="th">Name</th>
                <th className="th">Qty (L)</th>
                <th className="th">FAT</th>
                <th className="th">Rate</th>
                <th className="th text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {sessionEntries.map((e) => (
                <tr key={e._id}>
                  <td className="td font-semibold">{e.serialNumber}</td>
                  <td className="td">{e.customerName}</td>
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
              {sessionEntries.length === 0 && (
                <tr>
                  <td colSpan="6" className="td text-center text-slate-400">
                    No entries yet for this date
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
