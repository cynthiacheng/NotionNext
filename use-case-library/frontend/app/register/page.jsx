'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', name: '', company: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.register(form.email, form.password, form.name, form.company);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8 text-center">
          <div className="text-green-500 text-5xl mb-4">✓</div>
          <h2 className="text-xl font-semibold mb-2">Registration submitted</h2>
          <p className="text-gray-500 text-sm mb-6">
            Your account is pending admin approval. You will be able to log in once approved.
          </p>
          <Link href="/login" className="text-blue-600 hover:underline text-sm">Back to login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-2xl font-bold mb-1">Request Access</h1>
        <p className="text-gray-500 mb-6 text-sm">Create a partner account. An admin will approve it.</p>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: 'Full Name', key: 'name', type: 'text', required: true },
            { label: 'Company', key: 'company', type: 'text', required: false },
            { label: 'Email', key: 'email', type: 'email', required: true },
            { label: 'Password', key: 'password', type: 'password', required: true }
          ].map(({ label, key, type, required }) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-1">{label}{!required && <span className="text-gray-400"> (optional)</span>}</label>
              <input
                type={type} required={required}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form[key]}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
              />
            </div>
          ))}
          <button
            type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 rounded-lg text-sm transition"
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>

        <p className="mt-4 text-sm text-center text-gray-500">
          Already have access?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
