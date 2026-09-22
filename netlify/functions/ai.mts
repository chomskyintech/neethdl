const MAX_SOURCE = 20000
const MAX_SELECTION = 6000
const MAX_QUESTION = 2000
const MAX_SIM_OUTPUT = 5000

function cleanHistory(history) {
  if (!Array.isArray(history)) return []
  return history.slice(-6).flatMap(item => {
    const role = item?.role === 'assistant' ? 'assistant' : item?.role === 'user' ? 'user' : null
    const text = typeof item?.text === 'string' ? item.text.trim().slice(0, 3000) : ''
    return role && text ? [{ role, text }] : []
  })
}

function extractResponseText(data) {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim()
  }

  return (data?.output || [])
    .flatMap(item => Array.isArray(item?.content) ? item.content : [])
    .filter(item => item?.type === 'output_text' && typeof item?.text === 'string')
    .map(item => item.text)
    .join('\n')
    .trim()
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export default async (req) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed.' }, 405)

  const apiKey = Netlify.env.get('OPENAI_API_KEY')
  const model = Netlify.env.get('OPENAI_MODEL') || 'gpt-5.6-luna'
  if (!apiKey) return json({ ok: false, error: 'HDLForge AI is not configured yet.' }, 503)

  let body
  try {
    body = await req.json()
  } catch {
    return json({ ok: false, error: 'Invalid JSON request.' }, 400)
  }

  const question = typeof body?.question === 'string'
    ? body.question.trim().slice(0, MAX_QUESTION)
    : ''
  const source = typeof body?.source === 'string'
    ? body.source.slice(0, MAX_SOURCE)
    : ''
  const language = typeof body?.language === 'string'
    ? body.language.slice(0, 40)
    : 'HDL'
  const simulatorOutput = typeof body?.simulatorOutput === 'string'
    ? body.simulatorOutput.slice(0, MAX_SIM_OUTPUT)
    : ''

  const selection = body?.selection || {}
  const selectedCode = typeof selection.code === 'string'
    ? selection.code.trim().slice(0, MAX_SELECTION)
    : ''

  if (!question) return json({ ok: false, error: 'A question is required.' }, 400)
  if (!selectedCode) return json({ ok: false, error: 'Select some code before asking AI.' }, 400)

  const problem = body?.problem || {}
  const constraints = Array.isArray(problem.constraints)
    ? problem.constraints.slice(0, 8).map(item => String(item).slice(0, 500)).join('\n- ')
    : ''

  const history = cleanHistory(body?.history)
    .map(item => `${item.role === 'assistant' ? 'Assistant' : 'User'}: ${item.text}`)
    .join('\n\n')

  const context = [
    `Problem: ${String(problem.title || problem.id || 'HDL problem').slice(0, 300)}`,
    `Topic: ${String(problem.topic || '').slice(0, 200)}`,
    `Language: ${language}`,
    `Selected lines: ${Number(selection.startLine) || '?'}-${Number(selection.endLine) || '?'}`,
    '',
    'Problem requirement:',
    String(problem.task || '').slice(0, 5000),
    constraints ? `\nConstraints:\n- ${constraints}` : '',
    '',
    'Selected code:',
    selectedCode,
    '',
    'Full current source:',
    source,
    simulatorOutput ? `\nLatest simulator/compiler output:\n${simulatorOutput}` : '',
    history ? `\nRecent conversation:\n${history}` : '',
    '',
    `User question: ${question}`,
  ].join('\n')

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        store: false,
        max_output_tokens: 1200,
        input: [
          {
            role: 'developer',
            content: 'You are HDLForge AI, an expert teaching assistant for Verilog, SystemVerilog, VHDL, RTL design, FPGA, digital design, and verification. Answer about the selected code in its supplied problem context. Be concise but technically precise. Explain cycle timing, inferred hardware, synthesizability, width/signedness, reset behavior, latch risks, blocking versus non-blocking semantics, protocol behavior, and likely bugs when relevant. Do not claim you ran a simulation unless simulator output is provided. Prefer explaining the selected code over rewriting the entire solution unless the user explicitly asks for a rewrite.',
          },
          { role: 'user', content: context },
        ],
      }),
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      const detail = data?.error?.message || `AI provider returned HTTP ${response.status}.`
      return json({ ok: false, error: detail }, response.status === 429 ? 429 : 502)
    }

    const answer = extractResponseText(data)
    if (!answer) return json({ ok: false, error: 'AI returned an empty response.' }, 502)

    return json({ ok: true, answer, model })
  } catch (error) {
    return json({ ok: false, error: error?.message || 'AI request failed.' }, 502)
  }
}

export const config = {
  path: '/api/ai',
}
