/**
 * POST /api/usecases/auth
 * body: { action: 'login', email, password }
 *    → { token, user: { id, email, company, role } }
 *
 * body: { action: 'register', email, password, company }
 *    → { message: 'Registration submitted. Await admin approval.' }
 */

import { getAccountByEmail, createAccount } from '../../../lib/usecases/database'
import { signToken, checkPassword, hashPassword } from '../../../lib/usecases/auth'

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { action, email, password, company } = req.body || {}

  if (!action || !email || !password) {
    return res.status(400).json({ error: 'action, email and password are required' })
  }

  if (action === 'login') {
    const account = getAccountByEmail(email)
    if (!account) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    if (!checkPassword(password, account.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    if (!account.approved) {
      return res.status(403).json({ error: 'Account pending admin approval' })
    }
    const token = signToken({ id: account.id, email: account.email, company: account.company, role: account.role })
    return res.status(200).json({
      token,
      user: { id: account.id, email: account.email, company: account.company, role: account.role }
    })
  }

  if (action === 'register') {
    if (!company) {
      return res.status(400).json({ error: 'company is required for registration' })
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }
    try {
      const password_hash = hashPassword(password)
      createAccount({ email, password_hash, company, role: 'partner', approved: false })
      return res.status(201).json({ message: 'Registration submitted. Await admin approval.' })
    } catch (err) {
      if (err.message === 'Email already registered') {
        return res.status(409).json({ error: err.message })
      }
      throw err
    }
  }

  return res.status(400).json({ error: `Unknown action: ${action}` })
}
