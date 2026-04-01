/**
 * Admin-only account management endpoint.
 *
 * GET    /api/usecases/accounts           → list all accounts
 * POST   /api/usecases/accounts           → create an account (admin-created, auto-approved)
 * PUT    /api/usecases/accounts           → update an account (approve, change role, etc.)
 * DELETE /api/usecases/accounts?id=<n>   → delete an account
 */

import { getAllAccounts, createAccount, updateAccount, deleteAccount } from '../../../lib/usecases/database'
import { requireAdmin, hashPassword } from '../../../lib/usecases/auth'

export default function handler(req, res) {
  const admin = requireAdmin(req, res)
  if (!admin) return

  if (req.method === 'GET') {
    const accounts = getAllAccounts().map(a => ({
      id: a.id,
      email: a.email,
      company: a.company,
      role: a.role,
      approved: a.approved,
      created_at: a.created_at
    }))
    return res.status(200).json({ accounts })
  }

  if (req.method === 'POST') {
    const { email, password, company, role = 'partner' } = req.body || {}
    if (!email || !password || !company) {
      return res.status(400).json({ error: 'email, password and company are required' })
    }
    try {
      const account = createAccount({
        email,
        password_hash: hashPassword(password),
        company,
        role,
        approved: true
      })
      return res.status(201).json({ account: { id: account.id, email: account.email, company: account.company, role: account.role, approved: account.approved } })
    } catch (err) {
      return res.status(409).json({ error: err.message })
    }
  }

  if (req.method === 'PUT') {
    const { id, approved, role, company, password } = req.body || {}
    if (!id) return res.status(400).json({ error: 'id is required' })
    const updates = {}
    if (approved !== undefined) updates.approved = approved
    if (role !== undefined) updates.role = role
    if (company !== undefined) updates.company = company
    if (password) updates.password_hash = hashPassword(password)
    try {
      const updated = updateAccount(Number(id), updates)
      return res.status(200).json({ account: { id: updated.id, email: updated.email, company: updated.company, role: updated.role, approved: updated.approved } })
    } catch (err) {
      return res.status(404).json({ error: err.message })
    }
  }

  if (req.method === 'DELETE') {
    const id = Number(req.query.id)
    if (!id) return res.status(400).json({ error: 'id query param is required' })
    try {
      deleteAccount(id)
      return res.status(200).json({ message: 'Account deleted' })
    } catch (err) {
      return res.status(400).json({ error: err.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
