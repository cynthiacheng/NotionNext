/**
 * LLM integration using the Anthropic Claude API.
 * Given a target industry and the use cases knowledge base,
 * generates product proposals, USPs, and a customer readiness checklist.
 */

import Anthropic from '@anthropic-ai/sdk'

const MODEL = 'claude-sonnet-4-6'
const MAX_TOKENS = 2048

function formatUseCases(useCases) {
  if (!useCases.length) return 'No use cases available in the knowledge base yet.'
  return useCases
    .map((uc, i) =>
      `[${i + 1}] Company: ${uc.company} | Product: ${uc.product} | Country: ${uc.country} | Industry: ${uc.industry || 'N/A'} | Date: ${uc.date || 'N/A'}
       Description: ${uc.description}`
    )
    .join('\n\n')
}

const SYSTEM_PROMPT = `You are a partner sales enablement AI assistant for a technology company.
You have access to a knowledge base of real-world customer use cases contributed by partner companies.
Your job is to help sales partners prepare compelling, evidence-based proposals for their prospects.
Always ground your recommendations in the actual use cases provided. Be specific and practical.`

function buildUserPrompt(industry, useCasesText) {
  return `KNOWLEDGE BASE OF PARTNER USE CASES:
${useCasesText}

---
A sales partner is preparing to approach a prospect in the "${industry}" industry.

Based on the knowledge base above, generate a comprehensive sales enablement package. Respond with ONLY valid JSON (no markdown, no code blocks) in this exact structure:

{
  "productProposal": [
    {
      "product": "Product or solution name",
      "rationale": "2-3 sentence explanation of why this fits the ${industry} industry, referencing specific use cases",
      "relevantExamples": ["Brief reference to use case 1", "Brief reference to use case 2"]
    }
  ],
  "uniqueSellingPoints": [
    "Specific USP backed by a real example from the knowledge base",
    "..."
  ],
  "customerReadinessChecklist": [
    "Does the customer have [specific prerequisite relevant to ${industry}]?",
    "..."
  ],
  "summary": "2-3 sentence executive summary tailored to the ${industry} industry"
}

Requirements:
- productProposal: 2-4 products/solutions most relevant to ${industry}
- uniqueSellingPoints: exactly 6 points, each citing a real example from the knowledge base
- customerReadinessChecklist: exactly 10 yes/no questions specific to ${industry} readiness
- If the knowledge base has no ${industry}-specific cases, extrapolate from similar industries`
}

export async function queryKnowledgeEngine(industry, useCases) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }

  const client = new Anthropic({ apiKey })
  const useCasesText = formatUseCases(useCases)

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: buildUserPrompt(industry, useCasesText)
      }
    ]
  })

  const raw = message.content[0]?.text?.trim() || ''

  // Strip markdown code fences if the model adds them
  const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

  try {
    return JSON.parse(jsonStr)
  } catch {
    // If parsing fails, return a structured error response rather than crashing
    return {
      productProposal: [],
      uniqueSellingPoints: [],
      customerReadinessChecklist: [],
      summary: 'Unable to parse response. Raw output: ' + raw.slice(0, 200),
      parseError: true
    }
  }
}
