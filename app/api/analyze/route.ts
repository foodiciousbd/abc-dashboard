import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
  }

  const body = await req.json()
  const { totalSales, totalOrders, avgOrder, period, outlet, salesByOutlet, topProducts, targets } = body

  const prompt = `You are briefing a busy retail business owner. Be like a smart colleague — short, direct, no jargon. 3 short paragraphs only.

Here is the current dashboard data:
- Period: ${period}
- Filter: ${outlet}
- Total Sales: RM ${totalSales.toLocaleString()}
- Total Orders: ${totalOrders.toLocaleString()}
- Avg Order Value: RM ${avgOrder}

Sales by outlet:
${salesByOutlet.map((o: { outlet: string; sales: number }) => `- ${o.outlet}: RM ${o.sales.toLocaleString()}`).join('\n')}

Monthly target vs actual (cumulative for the period):
${targets.map((t: { outlet: string; actual: number; target: number; pct: number }) => `- ${t.outlet}: RM ${t.actual.toLocaleString()} actual vs RM ${t.target.toLocaleString()} target (${t.pct.toFixed(1)}%)`).join('\n')}

Top 3 products:
${topProducts.slice(0, 3).map((p: { product: string; sales: number }) => `- ${p.product}: RM ${p.sales.toLocaleString()}`).join('\n')}

Write exactly 3 short paragraphs with these headings in bold:
**What's going well**
**What needs attention**
**One thing to do next**

Keep it conversational, plain English, no bullet points inside the paragraphs. 2-3 sentences each max.`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024, thinkingConfig: { thinkingBudget: 0 } },
        }),
      }
    )

    if (!res.ok) {
      const err = await res.text()
      console.error('Gemini error:', err)
      return NextResponse.json({ error: 'Gemini request failed', detail: err }, { status: 500 })
    }

    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response from AI.'
    return NextResponse.json({ summary: text })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to reach Gemini' }, { status: 500 })
  }
}
