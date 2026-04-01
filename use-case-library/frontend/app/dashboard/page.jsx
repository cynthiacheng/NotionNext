'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [industry, setIndustry] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (!token) { router.replace('/login'); return; }
    setUser(JSON.parse(u));
  }, [router]);

  function logout() {
    localStorage.clear();
    router.push('/login');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!industry.trim()) return;
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const data = await api.query(industry);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Use Case Library</h1>
          <p className="text-xs text-gray-400">Partner Knowledge Engine</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.name}{user?.company ? ` · ${user.company}` : ''}</span>
          <button onClick={logout} className="text-sm text-red-500 hover:underline">Logout</button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Query Form */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mb-8">
          <h2 className="text-xl font-bold mb-1">Sales Proposal Generator</h2>
          <p className="text-sm text-gray-500 mb-6">Enter your target customer's industry to get a tailored product proposal, unique selling points, and customer readiness checklist.</p>

          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              placeholder="e.g. Healthcare, Manufacturing, Retail, Banking..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={industry}
              onChange={e => setIndustry(e.target.value)}
              required
            />
            <button
              type="submit" disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg text-sm transition whitespace-nowrap"
            >
              {loading ? 'Generating...' : 'Generate Proposal'}
            </button>
          </form>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>

        {/* Loading spinner */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
            <p className="text-sm text-gray-400">Analyzing use cases and generating proposal...</p>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="space-y-6">
            {/* Product Proposal */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                <h3 className="font-semibold text-gray-900">Product Proposal</h3>
                <span className="ml-auto text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">{industry}</span>
              </div>
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{result.product_proposal}</div>
            </section>

            {/* Unique Selling Points */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-7 h-7 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                <h3 className="font-semibold text-gray-900">Unique Selling Points</h3>
              </div>
              <ul className="space-y-2">
                {result.unique_selling_points.map((usp, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="mt-0.5 w-5 h-5 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                    <span>{usp}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Customer Readiness Checklist */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-7 h-7 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                <h3 className="font-semibold text-gray-900">Customer Readiness Checklist</h3>
              </div>
              <ul className="space-y-2">
                {result.customer_readiness_checklist.map((item, i) => (
                  <ChecklistItem key={i} item={item} />
                ))}
              </ul>
            </section>

            {/* Copy button */}
            <div className="text-right">
              <button
                onClick={() => {
                  const text = [
                    `PRODUCT PROPOSAL — ${industry}`,
                    '',
                    result.product_proposal,
                    '',
                    'UNIQUE SELLING POINTS',
                    ...result.unique_selling_points.map((u, i) => `${i + 1}. ${u}`),
                    '',
                    'CUSTOMER READINESS CHECKLIST',
                    ...result.customer_readiness_checklist.map((c, i) => `☐ ${c}`)
                  ].join('\n');
                  navigator.clipboard.writeText(text);
                }}
                className="text-sm text-gray-500 hover:text-gray-800 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
              >
                Copy to clipboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChecklistItem({ item }) {
  const [checked, setChecked] = useState(false);
  return (
    <li
      className="flex items-start gap-2 text-sm cursor-pointer"
      onClick={() => setChecked(c => !c)}
    >
      <span className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition ${checked ? 'bg-purple-600 border-purple-600 text-white' : 'border-gray-300'}`}>
        {checked && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
      </span>
      <span className={checked ? 'line-through text-gray-400' : 'text-gray-700'}>{item}</span>
    </li>
  );
}
