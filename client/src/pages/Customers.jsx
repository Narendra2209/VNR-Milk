import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { customerAPI } from '../services/api';
import useFetch from '../hooks/useFetch.js';
import Spinner from '../components/Spinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const EMPTY = { serialNumber: '', name: '', phone: '', address: '', milkType: 'Buffalo', pricePerFat: 10 };

export default function Customers() {
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const { data, loading, refetch } = useFetch(() => customerAPI.list(search), [search]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await customerAPI.update(editingId, form);
        toast.success('Customer updated');
      } else {
        await customerAPI.create(form);
        toast.success('Customer added');
      }
      setForm(EMPTY);
      setEditingId(null);
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Save failed');
    }
  };

  const edit = (c) => {
    setForm({
      serialNumber: c.serialNumber,
      name: c.name,
      phone: c.phone || '',
      address: c.address || '',
      milkType: c.milkType || 'Buffalo',
      pricePerFat: c.pricePerFat ?? 10
    });
    setEditingId(c._id);
  };

  const remove = async (c) => {
    if (!confirm(`Delete ${c.name}?`)) return;
    try {
      await customerAPI.remove(c._id);
      toast.success('Deleted');
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Customers</h2>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
        <h3 className="font-semibold mb-4 text-slate-800 dark:text-white">
          {editingId ? 'Edit Customer' : 'Add Customer'}
        </h3>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div>
            <label className="label">Serial Number</label>
            <input
              className="input"
              value={form.serialNumber}
              onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
              required
              disabled={!!editingId}
            />
          </div>
          <div>
            <label className="label">Name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Phone</label>
            <input
              className="input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Price (₹ per FAT)</label>
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
          <div className="md:col-span-2">
            <label className="label">Address</label>
            <input
              className="input"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div className="md:col-span-6 flex gap-2">
            <button type="submit" className="btn-primary">
              {editingId ? 'Update' : 'Add'}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => { setForm(EMPTY); setEditingId(null); }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </motion.div>

      <div className="card p-5">
        <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800 dark:text-white">All Customers</h3>
          <input
            className="input md:max-w-sm"
            placeholder="Search by serial or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700">
                  <th className="th">Serial</th>
                  <th className="th">Name</th>
                  <th className="th">Phone</th>
                  <th className="th">Type</th>
                  <th className="th">Price/FAT</th>
                  <th className="th">Address</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data || []).map((c) => (
                  <tr key={c._id}>
                    <td className="td font-semibold">{c.serialNumber}</td>
                    <td className="td">{c.name}</td>
                    <td className="td">{c.phone || '-'}</td>
                    <td className="td">
                      <span className={`text-xs px-2 py-1 rounded-full ${c.milkType === 'Buffalo' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                        {c.milkType}
                      </span>
                    </td>
                    <td className="td font-mono">₹{Number(c.pricePerFat ?? 10).toFixed(2)}</td>
                    <td className="td">{c.address || '-'}</td>
                    <td className="td text-right">
                      <button className="btn-ghost" onClick={() => edit(c)}>Edit Price</button>
                      {isAdmin && (
                        <button className="btn-ghost text-red-500" onClick={() => remove(c)}>Delete</button>
                      )}
                    </td>
                  </tr>
                ))}
                {(!data || data.length === 0) && (
                  <tr>
                    <td colSpan="7" className="td text-center text-slate-400">No customers yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
