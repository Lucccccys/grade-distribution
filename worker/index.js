const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://lucccccys.github.io',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export default {
  async fetch(request) {
    // preflight request
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
      });
    }

    const url = new URL(request.url);
    if (!url.pathname.startsWith('/openai/')) {
      return new Response('Not Found', {
        status: 404,
        headers: CORS_HEADERS
      });
    }

    // OpenAI API Key
    let apiResponse;
    try {
      const payload = await request.json();
      apiResponse = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify(payload)
        }
      );
    } catch (err) {
      return new Response(err.toString(), {
        status: 500,
        headers: CORS_HEADERS
      });
    }

    // Handle the response from OpenAI API
    const body = await apiResponse.text();
    return new Response(body, {
      status: apiResponse.status,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json'
      }
    });
  }
}
