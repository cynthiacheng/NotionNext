/**
 * POST /api/usecases/upload
 * Multipart form upload of a CSV or Excel file containing use cases.
 *
 * Expected columns (case-insensitive):
 *   description / use case description
 *   country
 *   product / company product
 *   date
 *   industry  (optional)
 *   company   (optional, defaults to partner's company)
 *
 * Returns { imported: number, useCases: [...] }
 */

import formidable from 'formidable'
import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { requireAuth } from '../../../lib/usecases/auth'
import { createUseCases } from '../../../lib/usecases/database'

export const config = {
  api: { bodyParser: false }
}

// Normalize a column header to a canonical key
function normalizeKey(raw) {
  const s = (raw || '').toLowerCase().replace(/[\s_-]+/g, '')
  if (['description', 'usecasedescription', 'usecase', 'casedescription'].includes(s)) return 'description'
  if (['country'].includes(s)) return 'country'
  if (['product', 'companyproduct', 'productname'].includes(s)) return 'product'
  if (['date', 'casedate'].includes(s)) return 'date'
  if (['industry', 'targetindustry', 'sector'].includes(s)) return 'industry'
  if (['company', 'companyname', 'partnername'].includes(s)) return 'company'
  return null
}

function normalizeRow(rawRow) {
  const row = {}
  for (const [k, v] of Object.entries(rawRow)) {
    const key = normalizeKey(k)
    if (key) row[key] = (v || '').toString().trim()
  }
  return row
}

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const result = Papa.parse(content, { header: true, skipEmptyLines: true })
  return result.data.map(normalizeRow).filter(r => r.description || r.product)
}

function parseExcel(filePath) {
  const workbook = XLSX.readFile(filePath)
  const sheetName = workbook.SheetNames[0]
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName])
  return rows.map(normalizeRow).filter(r => r.description || r.product)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = requireAuth(req, res)
  if (!user) return

  if (!user.approved) {
    return res.status(403).json({ error: 'Account not approved' })
  }

  const form = formidable({ maxFileSize: 10 * 1024 * 1024 }) // 10 MB limit

  let files
  try {
    ;[, files] = await form.parse(req)
  } catch (err) {
    return res.status(400).json({ error: `File parsing failed: ${err.message}` })
  }

  const fileArray = files.file || files.usecases || Object.values(files)[0]
  const file = Array.isArray(fileArray) ? fileArray[0] : fileArray

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded. Use field name "file" or "usecases".' })
  }

  const ext = path.extname(file.originalFilename || '').toLowerCase()
  let records = []

  try {
    if (ext === '.csv') {
      records = parseCSV(file.filepath)
    } else if (['.xlsx', '.xls'].includes(ext)) {
      records = parseExcel(file.filepath)
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Upload a .csv, .xlsx or .xls file.' })
    }
  } finally {
    // Clean up temp file
    try { fs.unlinkSync(file.filepath) } catch {}
  }

  if (!records.length) {
    return res.status(400).json({ error: 'No valid records found. Check column headers (description, country, product, date, industry, company).' })
  }

  const created = createUseCases(user.id, user.company, records)
  return res.status(201).json({ imported: created.length, useCases: created })
}
