const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, approvedOnly } = require('../middleware/auth');
const { generateProposal } = require('../services/llm');

const router = express.Router();
const prisma = new PrismaClient();

// POST /query
// Body: { industry: string }
// Returns: { product_proposal, unique_selling_points, customer_readiness_checklist }
router.post('/', auth, approvedOnly, async (req, res) => {
  const { industry } = req.body;
  if (!industry || !industry.trim()) {
    return res.status(400).json({ error: 'industry is required' });
  }

  try {
    const useCases = await prisma.useCase.findMany({
      orderBy: { date: 'desc' }
    });

    const result = await generateProposal(industry.trim(), useCases);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate proposal: ' + err.message });
  }
});

module.exports = router;
