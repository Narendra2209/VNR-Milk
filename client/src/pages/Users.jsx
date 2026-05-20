import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { userAPI, dairyConfigAPI } from '../services/api';
import useFetch from '../hooks/useFetch.js';
import Spinner from '../components/Spinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const EMPTY = { username: '', password: '', role: 'owner', dairies: [] };

function toggleInList(list, value) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function Users() {
  const { user: me } = useAuth();
  const { data, loading, refetch } = useFetch(() => userAPI.list(), []);
  const { data: dairies } = useFetch(() => dairyConfigAPI.list(), []);
  const activeDairies = (dairies || []).filter((d) => d.active);
  const [form, setForm] = useState(EMPTY);
  const [resetId, setResetId] = useState(null);
  const [resetPwd, setResetPwd] = useState('');
  const [saving, setSaving] = useState(false);

  const create = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password) return toast.error('Username and password required');
    if (form.role === 'owner' && form.dairies.length === 0) return toast.error('Pick at least one dairy');
    setSaving(true);
    try {
      await userAPI.create({
        username: form.username.trim(),
        password: form.password,
        role: form.role,
        dairies: form.role === 'owner' ? form.dairies : []
      });
      toast.success('User created');
      setForm(EMPTY);
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u) => {
    try {
      await userAPI.update(u._id, { active: !u.active });
      toast.success(u.active ? 'Disabled' : 'Enabled');
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed');
    }
  };

  const changeDairies = async (u, newDairies) => {
    try {
      await userAPI.update(u._id, { dairies: newDairies });
      toast.success('Dairies updated');
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed');
    }
  };

  const resetPassword = async (id) => {
    if (!resetPwd) return toast.error('Enter a new password');
    try {
      await userAPI.update(id, { password: resetPwd });
      toast.success('Password updated');
      setResetId(null);
      setResetPwd('');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Reset failed');
    }
  };

  const remove = async (u) => {
    if (!confirm(`Delete user "${u.username}"?`)) return;
    try {
      await userAPI.remove(u._id);
      toast.success('Deleted');
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Users</h2>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
        <h3 className="font-semibold mb-4 text-slate-800 dark:text-white">Create User</h3>
        <form onSubmit={create} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="label">Username</label>
              <input
                className="input"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Role</label>
              <select
                className="input"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value, dairies: [] })}
              >
                <option value="owner">Dairy Owner</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={saving} className="btn-primary w-full disabled:opacity-50">
                {saving ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
          {form.role === 'owner' && (
            <div>
              <label className="label">Dairies (pick one or more)</label>
              {activeDairies.length === 0 ? (
                <div className="text-sm text-slate-500 dark:text-slate-400">No active dairies. Add one on the Dairies page first.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {activeDairies.map((d) => {
                    const checked = form.dairies.includes(d.name);
                    return (
                      <label
                        key={d._id}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer text-sm ${
                          checked
                            ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-300 text-brand-700 dark:text-brand-200'
                            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => setForm({ ...form, dairies: toggleInList(form.dairies, d.name) })}
                        />
                        {d.name}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </form>
      </motion.div>

      <div className="card p-5">
        <h3 className="font-semibold mb-4 text-slate-800 dark:text-white">All Users</h3>
        {loading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700">
                  <th className="th">Username</th>
                  <th className="th">Role</th>
                  <th className="th">Dairies</th>
                  <th className="th">Status</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data || []).map((u) => (
                  <tr key={u._id}>
                    <td className="td font-semibold">{u.username}{u._id === me?._id && <span className="text-xs text-slate-400 ml-2">(you)</span>}</td>
                    <td className="td">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        u.role === 'admin' ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'
                      }`}>
                        {u.role === 'admin' ? 'Admin' : 'Owner'}
                      </span>
                    </td>
                    <td className="td">
                      {u.role === 'owner' ? (
                        <div className="flex flex-wrap gap-1.5">
                          {activeDairies.map((d) => {
                            const checked = (u.dairies || []).includes(d.name);
                            return (
                              <label
                                key={d._id}
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border cursor-pointer ${
                                  checked
                                    ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-300 text-brand-700 dark:text-brand-200'
                                    : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  className="h-3 w-3"
                                  checked={checked}
                                  onChange={() => changeDairies(u, toggleInList(u.dairies || [], d.name))}
                                />
                                {d.name}
                              </label>
                            );
                          })}
                          {(u.dairies || [])
                            .filter((name) => !activeDairies.find((d) => d.name === name))
                            .map((name) => (
                              <span key={name} className="text-xs px-2 py-1 rounded-full bg-slate-200 text-slate-600">
                                {name} (inactive)
                              </span>
                            ))}
                        </div>
                      ) : '—'}
                    </td>
                    <td className="td">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        u.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {u.active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="td text-right space-x-1">
                      {resetId === u._id ? (
                        <span className="inline-flex items-center gap-1">
                          <input
                            type="password"
                            placeholder="New password"
                            className="input py-1 max-w-[160px]"
                            value={resetPwd}
                            onChange={(e) => setResetPwd(e.target.value)}
                          />
                          <button className="btn-ghost" onClick={() => resetPassword(u._id)}>Save</button>
                          <button className="btn-ghost" onClick={() => { setResetId(null); setResetPwd(''); }}>Cancel</button>
                        </span>
                      ) : (
                        <>
                          <button className="btn-ghost" onClick={() => { setResetId(u._id); setResetPwd(''); }}>Reset PW</button>
                          {u._id !== me?._id && (
                            <>
                              <button className="btn-ghost" onClick={() => toggleActive(u)}>
                                {u.active ? 'Disable' : 'Enable'}
                              </button>
                              <button className="btn-ghost text-red-500" onClick={() => remove(u)}>Delete</button>
                            </>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {(!data || data.length === 0) && (
                  <tr><td colSpan="5" className="td text-center text-slate-400">No users yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
