const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function generateProposal(industry, useCases) {
  const context = useCases.length > 0
    ? useCases.map(uc =>
        `- Product: ${uc.product} | Company: ${uc.company} | Country: ${uc.country} | Date: ${new Date(uc.date).toISOString().split('T')[0]} | Description: ${uc.description}`
      ).join('\n')
    : 'No use cases available yet.';

  const prompt = `You are a sales enablement assistant helping partners sell solutions to enterprise customers.

Below is a library of real-world use cases from partner companies:

USE CASE LIBRARY:
${context}

A partner is targeting customers in the "${industry}" industry.

Based on the use cases above, generate a sales enablement package. Respond with ONLY valid JSON in this exact format:
{
  "product_proposal": "A compelling 2–3 paragraph proposal recommending the most relevant products and solutions for the ${industry} industry, drawing on specific use cases where applicable.",
  "unique_selling_points": [
    "USP 1",
    "USP 2",
    "USP 3",
    "USP 4",
    "USP 5"
  ],
  "customer_readiness_checklist": [
    "Checklist item 1",
    "Checklist item 2",
    "Checklist item 3",
    "Checklist item 4",
    "Checklist item 5",
    "Checklist item 6",
    "Checklist item 7",
    "Checklist item 8"
  ]
}`;

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = message.content[0].text.trim();
  // Strip markdown code fences if present
  const cleaned = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/, '');
  return JSON.parse(cleaned);
}

module.exports = { generateProposal };
