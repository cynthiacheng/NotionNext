/**
 * Auth utilities using Node.js built-in crypto (no external JWT dependency).
 * Implements HS256 JWT signing and verification + bcrypt password helpers.
 */

import crypto from 'crypto'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'partner-usecase-library-secret-key-change-in-production'
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

function b64url(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function b64urlDecode(str) {
  let s = str.replace(/-/g, '+').replace(/_/g, '/')
  const pad = s.length % 4
  if (pad) s += '='.repeat(4 - pad)
  return Buffer.from(s, 'base64').toString('utf8')
}

function hmacSig(header, body) {
  return crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

export function signToken(payload) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const iat = Math.floor(Date.now() / 1000)
  const exp = iat + TOKEN_TTL_SECONDS
  const body = b64url(JSON.stringify({ ...payload, iat, exp }))
  const sig = hmacSig(header, body)
  return `${header}.${body}.${sig}`
}

export function verifyToken(token) {
  try {
    if (!token) return null
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [header, body, sig] = parts
    const expected = hmacSig(header, body)
    if (sig !== expected) return null
    const decoded = JSON.parse(b64urlDecode(body))
    if (decoded.exp < Math.floor(Date.now() / 1000)) return null
    return decoded
  } catch {
    return null
  }
}

export function hashPassword(password) {
  return bcrypt.hashSync(password, 10)
}

export function checkPassword(password, hash) {
  return bcrypt.compareSync(password, hash)
}

/**
 * Middleware helper: extract and verify JWT from Authorization header.
 * Returns the decoded payload, or sends 401 and returns null.
 */
export function requireAuth(req, res) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  const decoded = verifyToken(token)
  if (!decoded) {
    res.status(401).json({ error: 'Unauthorized' })
    return null
  }
  return decoded
}

/**
 * Like requireAuth but also enforces admin role.
 */
export function requireAdmin(req, res) {
  const user = requireAuth(req, res)
  if (!user) return null
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: admin only' })
    return null
  }
  return user
}
