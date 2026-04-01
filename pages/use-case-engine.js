/**
 * Use Case Query Engine — /use-case-engine
 *
 * Public page. Users type a target customer industry and receive:
 *   - Product proposal
 *   - Unique selling points
 *   - Customer readiness checklist
 */

import { useState } from 'react'
import Head from 'next/head'

function Spinner({ size = 'sm' }) {
  const cls = size === 'lg' ? 'h-8 w-8' : 'h-4 w-4 inline mr-2'
  return (
    <svg className={`animate-spin ${cls} text-current`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

const EXAMPLE_INDUSTRIES = [
  'Healthcare', 'Financial Services', 'Manufacturing', 'Retail & E-commerce',
  'Logistics & Supply Chain', 'Education', 'Government & Public Sector', 'Energy & Utilities'
]

function ProductProposalCard({ item, index }) {
  const colors = ['blue', 'indigo', 'violet', 'purple']
  const color = colors[index % colors.length]
  const cls = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', icon: 'text-blue-500' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', badge: 'bg-indigo-100 text-indigo-700', icon: 'text-indigo-500' },
    violet: { bg: 'bg-violet-50', border: 'border-violet-200', badge: 'bg-violet-100 text-violet-700', icon: 'text-violet-500' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700', icon: 'text-purple-500' }
  }[color]

  return (
    <div className={`rounded-xl border ${cls.border} ${cls.bg} p-5`}>
      <div className="flex items-start gap-3 mb-3">
        <div className={`text-xl ${cls.icon}`}>📦</div>
        <div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls.badge}`}>
            Solution {index + 1}
          </span>
          <h3 className="font-bold text-gray-900 mt-1">{item.product}</h3>
        </div>
      </div>
      <p className="text-gray-700 text-sm leading-relaxed mb-3">{item.rationale}</p>
      {item.relevantExamples?.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Evidence from knowledge base:</p>
          {item.relevantExamples.map((ex, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
              <span className="text-green-500 mt-0.5 shrink-0">✓</span>
              <span>{ex}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SectionHeader({ icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="text-3xl">{icon}</div>
      <div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
    </div>
  )
}

function ResultsPanel({ data, industry }) {
  return (
    <div className="space-y-8 mt-8">
      {/* Summary banner */}
      {data.summary && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">⚡</span>
            <span className="font-semibold text-sm uppercase tracking-wide opacity-80">Executive Summary</span>
          </div>
          <p className="text-lg leading-relaxed">{data.summary}</p>
          <div className="mt-3 inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 text-sm">
            <span>🏭</span>
            <span>Industry: {industry}</span>
          </div>
        </div>
      )}

      {/* Product Proposals */}
      {data.productProposal?.length > 0 && (
        <section>
          <SectionHeader
            icon="🎯"
            title="Product Recommendations"
            subtitle="Solutions best matched to this industry based on real customer deployments"
          />
          <div className="grid sm:grid-cols-2 gap-4">
            {data.productProposal.map((item, i) => (
              <ProductProposalCard key={i} item={item} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Unique Selling Points */}
      {data.uniqueSellingPoints?.length > 0 && (
        <section>
          <SectionHeader
            icon="💎"
            title="Unique Selling Points"
            subtitle="Evidence-backed value propositions tailored to this industry"
          />
          <div className="grid sm:grid-cols-2 gap-3">
            {data.uniqueSellingPoints.map((usp, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-sm transition">
                <div className="bg-green-100 text-green-600 font-bold text-xs rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{usp}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Readiness Checklist */}
      {data.customerReadinessChecklist?.length > 0 && (
        <section>
          <SectionHeader
            icon="✅"
            title="Customer Readiness Checklist"
            subtitle="Use this checklist to assess if your prospect is ready to adopt the solution"
          />
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {data.customerReadinessChecklist.map((item, i) => (
              <label key={i} className="flex items-start gap-4 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition group">
                <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-gray-400 mr-2">#{i + 1}</span>
                  <span className="text-sm text-gray-700">{item}</span>
                </div>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">Check each item to assess customer readiness before proposing a solution.</p>
        </section>
      )}
    </div>
  )
}

export default function UseCaseEngine() {
  const [industry, setIndustry] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  async function handleQuery(e) {
    e.preventDefault()
    if (!industry.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/usecases/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry: industry.trim() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Query failed')
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function selectExample(ex) {
    setIndustry(ex)
    setResult(null)
    setError(null)
  }

  return (
    <>
      <Head>
        <title>Use Case Query Engine — Partner Knowledge Base</title>
        <meta name="description" content="AI-powered proposal generator backed by real partner use cases" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Hero */}
        <div className="max-w-4xl mx-auto px-4 pt-16 pb-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <span>🤖</span> AI-Powered Knowledge Engine
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-3 leading-tight">
              Partner Use Case<br />
              <span className="text-blue-600">Query Engine</span>
            </h1>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Enter your target customer industry and get an AI-generated proposal backed by real partner success stories.
            </p>
          </div>

          {/* Search form */}
          <form onSubmit={handleQuery} className="relative">
            <div className="flex gap-3 bg-white rounded-2xl shadow-lg border border-gray-200 p-2">
              <input
                type="text"
                value={industry}
                onChange={e => setIndustry(e.target.value)}
                placeholder="e.g. Healthcare, Financial Services, Manufacturing…"
                className="flex-1 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none text-base bg-transparent"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !industry.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-2"
              >
                {loading ? <Spinner /> : <span>🔍</span>}
                {loading ? 'Generating…' : 'Generate Proposal'}
              </button>
            </div>
          </form>

          {/* Example industries */}
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            <span className="text-xs text-gray-400 self-center">Try:</span>
            {EXAMPLE_INDUSTRIES.map(ex => (
              <button
                key={ex}
                onClick={() => selectExample(ex)}
                className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition bg-white"
              >
                {ex}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm text-center">
              <span className="font-semibold">Error: </span>{error}
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="mt-10 space-y-4">
              <div className="h-32 bg-white/60 rounded-2xl animate-pulse" />
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="h-40 bg-white/60 rounded-xl animate-pulse" />
                <div className="h-40 bg-white/60 rounded-xl animate-pulse" />
              </div>
              <div className="h-64 bg-white/60 rounded-xl animate-pulse" />
            </div>
          )}

          {/* Results */}
          {result && !loading && <ResultsPanel data={result} industry={result.industry} />}

          {/* Footer CTA */}
          {!loading && !result && !error && (
            <div className="mt-16 text-center">
              <p className="text-sm text-gray-400">
                Are you a partner?{' '}
                <a href="/partner-portal" className="text-blue-600 hover:underline font-medium">
                  Upload your use cases →
                </a>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pb-8 text-xs text-gray-300">
          Powered by Partner Use Case Knowledge Base · Claude AI
        </div>
      </div>
    </>
  )
}
