import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function synthesizeIntel(competitorName: string, data: {
  pricing?: any;
  features?: any[];
  news?: any[];
  reviews?: any[];
}) {
  const prompt = `Analyze the following competitive intelligence for ${competitorName}:

PRICING DATA:
${JSON.stringify(data.pricing, null, 2)}

FEATURES:
${JSON.stringify(data.features, null, 2)}

RECENT NEWS:
${JSON.stringify(data.news, null, 2)}

CUSTOMER REVIEWS:
${JSON.stringify(data.reviews, null, 2)}

Provide:
1. Executive summary (2-3 sentences)
2. Key changes detected
3. Strategic implications
4. Recommended actions`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 800,
    temperature: 0.7,
  });

  return completion.choices[0].message.content;
}

export async function generateWeeklyReport(competitors: any[]) {
  const prompt = `Generate a weekly competitor intelligence report based on the following data:

${JSON.stringify(competitors, null, 2)}

Format as:
# WEEKLY COMPETITOR INTELLIGENCE REPORT
Week of [DATE]

## EXECUTIVE SUMMARY
- [Top 3-5 insights]

## ALERTS
[Major changes requiring attention]

## STRATEGIC RECOMMENDATIONS
- [Action items]

Keep it concise and actionable.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1500,
    temperature: 0.7,
  });

  return completion.choices[0].message.content;
}

export async function analyzeSentiment(reviews: any[]) {
  const prompt = `Analyze the sentiment of these customer reviews:

${JSON.stringify(reviews, null, 2)}

Provide:
1. Overall sentiment score (0-10)
2. Common complaints (top 3)
3. Common praise (top 3)
4. Sentiment trend (improving/declining/stable)`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 400,
    temperature: 0.5,
  });

  return completion.choices[0].message.content;
}

export { openai };
