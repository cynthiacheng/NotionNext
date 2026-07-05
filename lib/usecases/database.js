/**
 * JSON file-based database for the partner use case library.
 * Uses /tmp on Vercel (read-only project filesystem) or data/ locally.
 * Uses synchronous I/O to keep reads and writes atomic within the Node.js event loop.
 *
 * Note: /tmp on Vercel is ephemeral per serverless instance — data resets on cold starts.
 * For production persistence, replace with MongoDB or another external store.
 */

import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'

// Vercel's project filesystem is read-only; /tmp is the only writable path
const IS_VERCEL = process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined
const DATA_DIR = IS_VERCEL ? '/tmp' : path.join(process.cwd(), 'data')
const DB_PATH = path.join(DATA_DIR, 'usecases-db.json')

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function initDb() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@partner.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345'
  const hash = bcrypt.hashSync(adminPassword, 10)
  return {
    accounts: [
      {
        id: 1,
        email: adminEmail,
        password_hash: hash,
        company: 'System Admin',
        role: 'admin',
        approved: true,
        created_at: new Date().toISOString()
      }
    ],
    use_cases: [],
    next_account_id: 2,
    next_usecase_id: 1
  }
}

function readDb() {
  ensureDataDir()
  if (!fs.existsSync(DB_PATH)) {
    const initial = initDb()
    writeDb(initial)
    return initial
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))
}

function writeDb(data) {
  ensureDataDir()
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

// ─── Accounts ────────────────────────────────────────────────────────────────

export function getAllAccounts() {
  return readDb().accounts
}

export function getAccountByEmail(email) {
  return readDb().accounts.find(a => a.email === email.toLowerCase()) || null
}

export function getAccountById(id) {
  return readDb().accounts.find(a => a.id === id) || null
}

export function createAccount({ email, password_hash, company, role = 'partner', approved = false }) {
  const db = readDb()
  if (db.accounts.find(a => a.email === email.toLowerCase())) {
    throw new Error('Email already registered')
  }
  const account = {
    id: db.next_account_id,
    email: email.toLowerCase(),
    password_hash,
    company,
    role,
    approved,
    created_at: new Date().toISOString()
  }
  db.accounts.push(account)
  db.next_account_id++
  writeDb(db)
  return account
}

export function updateAccount(id, updates) {
  const db = readDb()
  const idx = db.accounts.findIndex(a => a.id === id)
  if (idx === -1) throw new Error('Account not found')
  // Never overwrite id or created_at
  const { id: _id, created_at: _ca, ...safeUpdates } = updates
  db.accounts[idx] = { ...db.accounts[idx], ...safeUpdates }
  writeDb(db)
  return db.accounts[idx]
}

export function deleteAccount(id) {
  const db = readDb()
  const exists = db.accounts.find(a => a.id === id)
  if (!exists) throw new Error('Account not found')
  if (exists.role === 'admin') throw new Error('Cannot delete admin account')
  db.accounts = db.accounts.filter(a => a.id !== id)
  // Cascade delete use cases
  db.use_cases = db.use_cases.filter(uc => uc.account_id !== id)
  writeDb(db)
}

// ─── Use Cases ────────────────────────────────────────────────────────────────

export function getAllUseCases() {
  return readDb().use_cases
}

export function getUseCasesByAccountId(accountId) {
  return readDb().use_cases.filter(uc => uc.account_id === accountId)
}

export function createUseCases(accountId, defaultCompany, records) {
  const db = readDb()
  const now = new Date().toISOString()
  const created = []
  for (const r of records) {
    const uc = {
      id: db.next_usecase_id,
      account_id: accountId,
      company: r.company || defaultCompany,
      product: r.product || '',
      description: r.description || '',
      country: r.country || '',
      industry: r.industry || '',
      date: r.date || '',
      created_at: now
    }
    db.use_cases.push(uc)
    db.next_usecase_id++
    created.push(uc)
  }
  writeDb(db)
  return created
}

export function deleteUseCase(id, requestingAccountId, role) {
  const db = readDb()
  const uc = db.use_cases.find(u => u.id === id)
  if (!uc) throw new Error('Use case not found')
  if (role !== 'admin' && uc.account_id !== requestingAccountId) {
    throw new Error('Forbidden')
  }
  db.use_cases = db.use_cases.filter(u => u.id !== id)
  writeDb(db)
}
