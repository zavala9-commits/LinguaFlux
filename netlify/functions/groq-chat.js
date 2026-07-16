// Proxy seguro para Groq. La GROQ_API_KEY vive SOLO en variables de entorno
// de Netlify, nunca en el navegador del usuario.
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return { statusCode: 200, body: JSON.stringify({ reply: null, demo: true }) };
  }

  try {
    const { messages, level, langName, langCode } = JSON.parse(event.body || '{}');

    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: `You are a friendly ${langName || 'language'} tutor for level ${level || 'A1'}. Keep answers short, correct gently, speak in ${langCode || 'en-US'}.`,
          },
          ...(messages || []),
        ],
        max_tokens: 120,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return { statusCode: 502, body: JSON.stringify({ error: 'Groq error', detail: errText }) };
    }

    const data = await resp.json();
    const reply = data.choices?.[0]?.message?.content || '';
    return { statusCode: 200, body: JSON.stringify({ reply }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
