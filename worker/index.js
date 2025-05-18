export default {
    async fetch(request) {
      const url = new URL(request.url);
      if (!url.pathname.startsWith('/openai/')) {
        return new Response('Not Found', { status: 404 });
      }
      const payload = await request.json();
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });
      return new Response(await resp.text(), {
        status: resp.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  