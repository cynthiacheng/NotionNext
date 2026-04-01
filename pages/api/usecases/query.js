/**
 * POST /api/usecases/query
 * body: { industry: string }
 *
 * Public endpoint — no auth required.
 * Uses the Claude API to generate a proposal based on the use cases knowledge base.
 *
 * Returns {
 *   industry,
 *   productProposal: [{ product, rationale, relevantExamples }],
 *   uniqueSellingPoints: string[],
 *   customerReadinessChecklist: string[],
 *   summary: string
 * }
 */

import { getAllUseCases } from '../../../lib/usecases/database'
import { queryKnowledgeEngine } from '../../../lib/usecases/llm'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { industry } = req.body || {}
  if (!industry || typeof industry !== 'string' || industry.trim().length < 2) {
    return res.status(400).json({ error: 'industry is required (at least 2 characters)' })
  }

  const useCases = getAllUseCases()

  try {
    const result = await queryKnowledgeEngine(industry.trim(), useCases)
    return res.status(200).json({ industry: industry.trim(), ...result })
  } catch (err) {
    if (err.message?.includes('ANTHROPIC_API_KEY')) {
      return res.status(503).json({ error: 'AI service not configured. Set ANTHROPIC_API_KEY.' })
    }
    console.error('LLM query error:', err)
    return res.status(500).json({ error: 'Failed to generate proposal. Please try again.' })
  }
}
