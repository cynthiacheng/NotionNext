const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    const allowed = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only CSV and Excel files are allowed'));
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

router.use(auth, adminOnly);

// GET /admin/partners — list all partner accounts
router.get('/partners', async (req, res) => {
  try {
    const partners = await prisma.user.findMany({
      where: { role: 'PARTNER' },
      select: { id: true, email: true, name: true, company: true, approved: true, createdAt: true }
    });
    res.json(partners);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch partners' });
  }
});

// PATCH /admin/partners/:id/approve
router.patch('/partners/:id/approve', async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { approved: true },
      select: { id: true, email: true, name: true, approved: true }
    });
    res.json(user);
  } catch {
    res.status(404).json({ error: 'Partner not found' });
  }
});

// PATCH /admin/partners/:id/reject
router.patch('/partners/:id/reject', async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { approved: false },
      select: { id: true, email: true, name: true, approved: true }
    });
    res.json(user);
  } catch {
    res.status(404).json({ error: 'Partner not found' });
  }
});

// GET /admin/usecases — list all use cases
router.get('/usecases', async (req, res) => {
  try {
    const useCases = await prisma.useCase.findMany({
      orderBy: { createdAt: 'desc' },
      include: { uploadedBy: { select: { name: true, company: true } } }
    });
    res.json(useCases);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch use cases' });
  }
});

// DELETE /admin/usecases/:id
router.delete('/usecases/:id', async (req, res) => {
  try {
    await prisma.useCase.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(404).json({ error: 'Use case not found' });
  }
});

// POST /admin/upload — upload CSV or Excel file of use cases
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const filePath = req.file.path;
  const ext = path.extname(req.file.originalname).toLowerCase();

  try {
    let rows = [];

    if (ext === '.csv') {
      rows = await parseCSV(filePath);
    } else {
      rows = parseExcel(filePath);
    }

    const records = normalizeRows(rows);
    if (records.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'No valid rows found. Ensure columns: description, country, product, date, company' });
    }

    const created = await prisma.useCase.createMany({
      data: records.map(r => ({ ...r, userId: req.user.id }))
    });

    fs.unlinkSync(filePath);
    res.json({ message: `Imported ${created.count} use cases` });
  } catch (err) {
    console.error(err);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(500).json({ error: 'Failed to process file: ' + err.message });
  }
});

function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', data => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

function parseExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet);
}

function normalizeRows(rows) {
  return rows
    .map(row => {
      // Normalize keys to lowercase
      const r = Object.fromEntries(Object.entries(row).map(([k, v]) => [k.toLowerCase().trim(), String(v).trim()]));
      const description = r.description || r['use case description'] || r['usecase'];
      const country = r.country;
      const product = r.product || r['company product'] || r['product name'];
      const dateRaw = r.date || r['date uploaded'];
      const company = r.company || r['company name'];

      if (!description || !country || !product || !dateRaw || !company) return null;

      const date = new Date(dateRaw);
      if (isNaN(date.getTime())) return null;

      return { description, country, product, date, company };
    })
    .filter(Boolean);
}

module.exports = router;
