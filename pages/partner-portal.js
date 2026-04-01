/**
 * Partner Portal — /partner-portal
 *
 * Three views:
 *   1. Login / Register form (unauthenticated)
 *   2. Partner dashboard: upload CSV/Excel, view own use cases
 *   3. Admin dashboard: manage accounts, view all use cases
 */

import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'

const API = '/api/usecases'

// ─── API helpers ─────────────────────────────────────────────────────────────

async function apiFetch(url, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Alert({ type, msg }) {
  if (!msg) return null
  const colors = {
    error: 'bg-red-50 border-red-400 text-red-700',
    success: 'bg-green-50 border-green-400 text-green-700',
    info: 'bg-blue-50 border-blue-400 text-blue-700'
  }
  return (
    <div className={`border-l-4 p-3 rounded text-sm mb-4 ${colors[type] || colors.info}`}>
      {msg}
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 inline mr-2 text-current" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// ─── Auth Screen ─────────────────────────────────────────────────────────────

function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', company: '' })
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState(null)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setAlert(null)
    setLoading(true)
    try {
      if (mode === 'login') {
        const data = await apiFetch(`${API}/auth`, {
          method: 'POST',
          body: { action: 'login', email: form.email, password: form.password }
        })
        onLogin(data.token, data.user)
      } else {
        await apiFetch(`${API}/auth`, {
          method: 'POST',
          body: { action: 'register', email: form.email, password: form.password, company: form.company }
        })
        setAlert({ type: 'success', msg: 'Registration submitted! Wait for admin approval before logging in.' })
        setMode('login')
      }
    } catch (err) {
      setAlert({ type: 'error', msg: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏢</div>
          <h1 className="text-2xl font-bold text-gray-900">Partner Portal</h1>
          <p className="text-gray-500 text-sm mt-1">Use Case Knowledge Library</p>
        </div>

        <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
          {['login', 'register'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setAlert(null) }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${mode === m ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        <Alert type={alert?.type} msg={alert?.msg} />

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email" required value={form.email} onChange={set('email')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="you@company.com"
            />
          </div>
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input
                type="text" required value={form.company} onChange={set('company')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Acme Corp"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password" required value={form.password} onChange={set('password')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder={mode === 'register' ? 'Min 8 characters' : '••••••••'}
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-60"
          >
            {loading && <Spinner />}
            {mode === 'login' ? 'Sign In' : 'Request Access'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Upload Tab ───────────────────────────────────────────────────────────────

function UploadTab({ token, user, onRefresh }) {
  const fileRef = useRef()
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState(null)

  async function handleUpload(e) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return setAlert({ type: 'error', msg: 'Please select a file' })
    setAlert(null)
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`${API}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setAlert({ type: 'success', msg: `Successfully imported ${data.imported} use case(s).` })
      fileRef.current.value = ''
      onRefresh()
    } catch (err) {
      setAlert({ type: 'error', msg: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-1">Upload Use Cases</h3>
        <p className="text-sm text-gray-500 mb-4">
          Upload a CSV or Excel file. Required columns: <code className="bg-gray-100 px-1 rounded">description</code>, <code className="bg-gray-100 px-1 rounded">country</code>, <code className="bg-gray-100 px-1 rounded">product</code>. Optional: <code className="bg-gray-100 px-1 rounded">date</code>, <code className="bg-gray-100 px-1 rounded">industry</code>, <code className="bg-gray-100 px-1 rounded">company</code>.
        </p>
        <Alert type={alert?.type} msg={alert?.msg} />
        <form onSubmit={handleUpload} className="flex gap-3 items-center">
          <input
            ref={fileRef} type="file" accept=".csv,.xlsx,.xls"
            className="block text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <button
            type="submit" disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition disabled:opacity-60 whitespace-nowrap"
          >
            {loading && <Spinner />}Upload
          </button>
        </form>

        {/* Template download hint */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
          <strong>CSV template columns:</strong> description, country, product, date, industry, company
        </div>
      </div>
    </div>
  )
}

// ─── Use Cases Tab ────────────────────────────────────────────────────────────

function UseCasesTab({ token, useCases, onDelete }) {
  const [deleting, setDeleting] = useState(null)

  async function handleDelete(id) {
    if (!confirm('Delete this use case?')) return
    setDeleting(id)
    try {
      await apiFetch(`${API}/usecases?id=${id}`, { method: 'DELETE', token })
      onDelete()
    } catch (err) {
      alert(err.message)
    } finally {
      setDeleting(null)
    }
  }

  if (!useCases.length) {
    return (
      <div className="text-center py-16 text-gray-400">
        <div className="text-5xl mb-3">📂</div>
        <p>No use cases uploaded yet.</p>
        <p className="text-sm mt-1">Use the Upload tab to add your first batch.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500 text-xs uppercase tracking-wide">
            {['Company', 'Product', 'Industry', 'Country', 'Date', 'Description', ''].map(h => (
              <th key={h} className="pb-3 pr-4 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {useCases.map(uc => (
            <tr key={uc.id} className="hover:bg-gray-50">
              <td className="py-3 pr-4 font-medium text-gray-900 whitespace-nowrap">{uc.company}</td>
              <td className="py-3 pr-4 text-blue-600 whitespace-nowrap">{uc.product}</td>
              <td className="py-3 pr-4 whitespace-nowrap">{uc.industry || '—'}</td>
              <td className="py-3 pr-4 whitespace-nowrap">{uc.country}</td>
              <td className="py-3 pr-4 whitespace-nowrap text-gray-400">{uc.date || '—'}</td>
              <td className="py-3 pr-4 text-gray-600 max-w-xs truncate">{uc.description}</td>
              <td className="py-3">
                <button
                  onClick={() => handleDelete(uc.id)}
                  disabled={deleting === uc.id}
                  className="text-red-400 hover:text-red-600 text-xs px-2 py-1 rounded hover:bg-red-50 transition disabled:opacity-40"
                >
                  {deleting === uc.id ? '…' : 'Delete'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Admin Accounts Tab ───────────────────────────────────────────────────────

function AccountsTab({ token, accounts, onRefresh }) {
  const [newAccount, setNewAccount] = useState({ email: '', password: '', company: '', role: 'partner' })
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [alert, setAlert] = useState(null)

  const set = k => e => setNewAccount(a => ({ ...a, [k]: e.target.value }))

  async function create(e) {
    e.preventDefault()
    setCreating(true)
    setAlert(null)
    try {
      await apiFetch(`${API}/accounts`, { method: 'POST', body: newAccount, token })
      setAlert({ type: 'success', msg: 'Account created.' })
      setNewAccount({ email: '', password: '', company: '', role: 'partner' })
      setShowForm(false)
      onRefresh()
    } catch (err) {
      setAlert({ type: 'error', msg: err.message })
    } finally {
      setCreating(false)
    }
  }

  async function toggleApproval(acc) {
    try {
      await apiFetch(`${API}/accounts`, {
        method: 'PUT',
        body: { id: acc.id, approved: !acc.approved },
        token
      })
      onRefresh()
    } catch (err) {
      alert(err.message)
    }
  }

  async function deleteAcc(id) {
    if (!confirm('Delete this account and all its use cases?')) return
    try {
      await apiFetch(`${API}/accounts?id=${id}`, { method: 'DELETE', token })
      onRefresh()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{accounts.length} account(s)</p>
        <button
          onClick={() => setShowForm(v => !v)}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {showForm ? 'Cancel' : '+ New Account'}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <Alert type={alert?.type} msg={alert?.msg} />
          <form onSubmit={create} className="grid grid-cols-2 gap-3">
            <input required type="email" placeholder="Email" value={newAccount.email} onChange={set('email')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            <input required type="text" placeholder="Company" value={newAccount.company} onChange={set('company')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            <input required type="password" placeholder="Password (min 8 chars)" value={newAccount.password} onChange={set('password')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            <select value={newAccount.role} onChange={set('role')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
              <option value="partner">Partner</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" disabled={creating}
              className="col-span-2 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-60">
              {creating && <Spinner />}Create Account
            </button>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500 text-xs uppercase tracking-wide">
              {['Email', 'Company', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                <th key={h} className="pb-3 pr-4 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {accounts.map(acc => (
              <tr key={acc.id} className="hover:bg-gray-50">
                <td className="py-3 pr-4 font-medium text-gray-900">{acc.email}</td>
                <td className="py-3 pr-4">{acc.company}</td>
                <td className="py-3 pr-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${acc.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                    {acc.role}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${acc.approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {acc.approved ? 'Approved' : 'Pending'}
                  </span>
                </td>
                <td className="py-3 pr-4 text-gray-400 whitespace-nowrap">{acc.created_at?.slice(0, 10)}</td>
                <td className="py-3 flex gap-2">
                  {acc.role !== 'admin' && (
                    <button onClick={() => toggleApproval(acc)}
                      className={`text-xs px-2 py-1 rounded transition ${acc.approved ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'}`}>
                      {acc.approved ? 'Revoke' : 'Approve'}
                    </button>
                  )}
                  {acc.role !== 'admin' && (
                    <button onClick={() => deleteAcc(acc.id)}
                      className="text-xs px-2 py-1 text-red-400 hover:text-red-600 rounded hover:bg-red-50 transition">
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({ token, user, onLogout }) {
  const [activeTab, setActiveTab] = useState('upload')
  const [useCases, setUseCases] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)

  const isAdmin = user.role === 'admin'

  const tabs = isAdmin
    ? [
        { id: 'upload', label: 'Upload Use Cases' },
        { id: 'usecases', label: `Use Cases (${useCases.length})` },
        { id: 'accounts', label: `Accounts (${accounts.length})` }
      ]
    : [
        { id: 'upload', label: 'Upload Use Cases' },
        { id: 'usecases', label: `My Use Cases (${useCases.length})` }
      ]

  async function load() {
    setLoading(true)
    try {
      const [ucData, accData] = await Promise.all([
        apiFetch(`${API}/usecases`, { token }),
        isAdmin ? apiFetch(`${API}/accounts`, { token }) : Promise.resolve({ accounts: [] })
      ])
      setUseCases(ucData.useCases)
      setAccounts(accData.accounts)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏢</span>
          <div>
            <h1 className="font-bold text-gray-900">Partner Portal</h1>
            <p className="text-xs text-gray-500">{user.company} · {user.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href="/use-case-engine" target="_blank"
            className="text-sm text-blue-600 hover:underline hidden sm:block">
            Open Query Engine →
          </a>
          <button onClick={onLogout}
            className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 transition">
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white border border-gray-200 rounded-xl p-1 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {loading ? (
            <div className="flex justify-center py-12"><Spinner />Loading…</div>
          ) : (
            <>
              {activeTab === 'upload' && <UploadTab token={token} user={user} onRefresh={load} />}
              {activeTab === 'usecases' && <UseCasesTab token={token} useCases={useCases} onDelete={load} />}
              {activeTab === 'accounts' && isAdmin && <AccountsTab token={token} accounts={accounts} onRefresh={load} />}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

// ─── Page Root ────────────────────────────────────────────────────────────────

export default function PartnerPortal() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('partner_session')
    if (stored) {
      try { setSession(JSON.parse(stored)) } catch {}
    }
  }, [])

  function handleLogin(token, user) {
    const s = { token, user }
    localStorage.setItem('partner_session', JSON.stringify(s))
    setSession(s)
  }

  function handleLogout() {
    localStorage.removeItem('partner_session')
    setSession(null)
  }

  return (
    <>
      <Head>
        <title>Partner Portal — Use Case Library</title>
        <meta name="description" content="Partner portal for uploading and managing customer use cases" />
      </Head>
      {session
        ? <Dashboard token={session.token} user={session.user} onLogout={handleLogout} />
        : <AuthScreen onLogin={handleLogin} />
      }
    </>
  )
}
