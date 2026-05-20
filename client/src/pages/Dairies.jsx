import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { dairyConfigAPI } from '../services/api';
import useFetch from '../hooks/useFetch.js';
import Spinner from '../components/Spinner.jsx';

export default function Dairies() {
  const { data, loading, refetch } = useFetch(() => dairyConfigAPI.list(), []);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [saving, setSaving] = useState(false);

  const add = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Enter a dairy name');
    setSaving(true);
    try {
      await dairyConfigAPI.create(name.trim());
      toast.success('Dairy added');
      setName('');
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Add failed');
    } finally {
      setSaving(false);
    }
  };

  const saveRename = async (id) => {
    if (!editingName.trim()) return toast.error('Name cannot be empty');
    try {
      await dairyConfigAPI.update(id, { name: editingName.trim() });
      toast.success('Renamed');
      setEditingId(null);
      setEditingName('');
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Rename failed');
    }
  };

  const toggleActive = async (d) => {
    try {
      await dairyConfigAPI.update(d._id, { active: !d.active });
      toast.success(d.active ? 'Deactivated' : 'Activated');
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed');
    }
  };

  const remove = async (d) => {
    if (!confirm(`Delete "${d.name}"?`)) return;
    try {
      await dairyConfigAPI.remove(d._id);
      toast.success('Deleted');
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Dairies</h2>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
        <h3 className="font-semibold mb-4 text-slate-800 dark:text-white">Add Dairy</h3>
        <form onSubmit={add} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[220px]">
            <label className="label">Dairy name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sunrise Dairy"
              required
            />
          </div>
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? 'Adding...' : 'Add Dairy'}
          </button>
        </form>
      </motion.div>

      <div className="card p-5">
        <h3 className="font-semibold mb-4 text-slate-800 dark:text-white">All Dairies</h3>
        {loading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700">
                  <th className="th">Name</th>
                  <th className="th">Status</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data || []).map((d) => (
                  <tr key={d._id}>
                    <td className="td font-semibold">
                      {editingId === d._id ? (
                        <input
                          className="input py-1"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                        />
                      ) : d.name}
                    </td>
                    <td className="td">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        d.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {d.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="td text-right space-x-1">
                      {editingId === d._id ? (
                        <>
                          <button className="btn-ghost" onClick={() => saveRename(d._id)}>Save</button>
                          <button className="btn-ghost" onClick={() => { setEditingId(null); setEditingName(''); }}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button className="btn-ghost" onClick={() => { setEditingId(d._id); setEditingName(d.name); }}>Rename</button>
                          <button className="btn-ghost" onClick={() => toggleActive(d)}>
                            {d.active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button className="btn-ghost text-red-500" onClick={() => remove(d)}>Delete</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {(!data || data.length === 0) && (
                  <tr><td colSpan="3" className="td text-center text-slate-400">No dairies yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Renaming a dairy updates references in dairy entries and user assignments. Delete is only allowed when nothing references the dairy — otherwise deactivate.
        </p>
      </div>
    </div>
  );
}
