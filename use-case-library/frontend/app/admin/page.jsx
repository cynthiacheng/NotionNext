'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState('partners');
  const [partners, setPartners] = useState([]);
  const [useCases, setUseCases] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const u = localStorage.getItem('user');
    if (!token || role !== 'ADMIN') { router.replace('/login'); return; }
    setUser(JSON.parse(u));
  }, [router]);

  const loadPartners = useCallback(async () => {
    try { setPartners(await api.getPartners()); } catch {}
  }, []);

  const loadUseCases = useCallback(async () => {
    try { setUseCases(await api.getUseCases()); } catch {}
  }, []);

  useEffect(() => {
    Promise.all([loadPartners(), loadUseCases()]).finally(() => setLoading(false));
  }, [loadPartners, loadUseCases]);

  function logout() {
    localStorage.clear();
    router.push('/login');
  }

  async function handleApprove(id, approve) {
    try {
      const updated = approve ? await api.approvePartner(id) : await api.rejectPartner(id);
      setPartners(ps => ps.map(p => p.id === updated.id ? { ...p, approved: updated.approved } : p));
    } catch (err) { alert(err.message); }
  }

  async function handleDeleteUseCase(id) {
    if (!confirm('Delete this use case?')) return;
    try {
      await api.deleteUseCase(id);
      setUseCases(us => us.filter(u => u.id !== id));
    } catch (err) { alert(err.message); }
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setUploadMsg('');
    try {
      const res = await api.uploadFile(file);
      setUploadMsg(res.message);
      setFile(null);
      e.target.reset();
      loadUseCases();
    } catch (err) {
      setUploadMsg('Error: ' + err.message);
    } finally {
      setUploading(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading...</div>;

  const pending = partners.filter(p => !p.approved);
  const approved = partners.filter(p => p.approved);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Use Case Library</h1>
          <p className="text-xs text-gray-400">Admin Dashboard</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.name}</span>
          <button onClick={logout} className="text-sm text-red-500 hover:underline">Logout</button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[['partners', `Partners (${partners.length})`], ['upload', 'Upload Use Cases'], ['usecases', `Use Cases (${useCases.length})`]].map(([key, label]) => (
            <button
              key={key} onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === key ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
            >{label}</button>
          ))}
        </div>

        {/* Partners Tab */}
        {tab === 'partners' && (
          <div className="space-y-6">
            {pending.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-orange-600 uppercase tracking-wide mb-3">Pending Approval ({pending.length})</h2>
                <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                  {pending.map(p => (
                    <div key={p.id} className="px-5 py-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.email}{p.company ? ` · ${p.company}` : ''}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(p.id, true)} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg">Approve</button>
                        <button onClick={() => handleApprove(p.id, false)} className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs rounded-lg">Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
            <section>
              <h2 className="text-sm font-semibold text-green-600 uppercase tracking-wide mb-3">Approved Partners ({approved.length})</h2>
              {approved.length === 0 ? <p className="text-sm text-gray-400">No approved partners yet.</p> : (
                <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                  {approved.map(p => (
                    <div key={p.id} className="px-5 py-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.email}{p.company ? ` · ${p.company}` : ''}</p>
                      </div>
                      <button onClick={() => handleApprove(p.id, false)} className="px-3 py-1.5 bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 text-xs rounded-lg">Revoke</button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Upload Tab */}
        {tab === 'upload' && (
          <div className="max-w-lg">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold mb-1">Upload Use Cases</h2>
              <p className="text-sm text-gray-400 mb-4">
                Upload a CSV or Excel file. Required columns: <code className="bg-gray-100 px-1 rounded text-xs">description</code>, <code className="bg-gray-100 px-1 rounded text-xs">country</code>, <code className="bg-gray-100 px-1 rounded text-xs">product</code>, <code className="bg-gray-100 px-1 rounded text-xs">date</code>, <code className="bg-gray-100 px-1 rounded text-xs">company</code>
              </p>
              <form onSubmit={handleUpload} className="space-y-4">
                <input
                  type="file" accept=".csv,.xlsx,.xls" required
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  onChange={e => setFile(e.target.files[0])}
                />
                <button type="submit" disabled={uploading || !file}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 rounded-lg text-sm font-medium transition">
                  {uploading ? 'Uploading...' : 'Upload File'}
                </button>
              </form>
              {uploadMsg && (
                <p className={`mt-3 text-sm ${uploadMsg.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{uploadMsg}</p>
              )}
            </div>

            <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-700 mb-2">Sample CSV format</p>
              <pre className="text-xs text-blue-600 whitespace-pre-wrap">
{`description,country,product,date,company
Automated invoice processing,Singapore,AI Document Processor,2024-03-15,Acme Corp
Customer churn prediction,Malaysia,Analytics Suite,2024-01-20,Beta Ltd`}
              </pre>
            </div>
          </div>
        )}

        {/* Use Cases Tab */}
        {tab === 'usecases' && (
          <div>
            {useCases.length === 0 ? (
              <p className="text-sm text-gray-400">No use cases uploaded yet.</p>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Product', 'Company', 'Country', 'Date', 'Description', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {useCases.map(uc => (
                      <tr key={uc.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{uc.product}</td>
                        <td className="px-4 py-3 text-gray-600">{uc.company}</td>
                        <td className="px-4 py-3 text-gray-600">{uc.country}</td>
                        <td className="px-4 py-3 text-gray-600">{new Date(uc.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{uc.description}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleDeleteUseCase(uc.id)} className="text-red-500 hover:text-red-700 text-xs">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
