const allowedMethods = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

export default async function handler(req, res) {
  const method = req.method ?? 'GET';
  if (!allowedMethods.has(method)) {
    res.setHeader('Allow', [...allowedMethods].join(', '));
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const backendOrigin = process.env.BACKEND_URL;
  if (!backendOrigin) {
    res.status(503).json({ error: 'The API backend is not configured for this deployment' });
    return;
  }

  let target;
  try {
    const backendUrl = new URL(backendOrigin);
    if (!['http:', 'https:'].includes(backendUrl.protocol) || backendUrl.pathname !== '/') {
      throw new Error('BACKEND_URL must be an HTTP(S) origin without a path');
    }

    const requestUrl = new URL(req.url ?? '/', 'https://vercel.invalid');
    const apiPath = requestUrl.pathname === '/api' || requestUrl.pathname.startsWith('/api/')
      ? requestUrl.pathname
      : `/api${requestUrl.pathname === '/' ? '' : requestUrl.pathname}`;
    target = new URL(`${apiPath}${requestUrl.search}`, backendUrl);
  } catch (error) {
    console.error('Invalid BACKEND_URL configuration:', error.message);
    res.status(500).json({ error: 'The API backend URL is invalid' });
    return;
  }

  const headers = {};
  for (const name of ['accept', 'content-type', 'cookie', 'authorization']) {
    const value = req.headers[name];
    if (value) headers[name] = value;
  }

  let body;
  if (method !== 'GET' && method !== 'HEAD' && req.body !== undefined) {
    body = Buffer.isBuffer(req.body)
      ? req.body
      : typeof req.body === 'string'
        ? req.body
        : JSON.stringify(req.body);
  }

  try {
    const upstream = await fetch(target, { method, headers, body });
    res.status(upstream.status);
    const contentType = upstream.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);

    const cookies = upstream.headers.getSetCookie?.() ?? [];
    if (cookies.length) {
      res.setHeader('Set-Cookie', cookies);
    }

    const responseBody = Buffer.from(await upstream.arrayBuffer());
    if (responseBody.length) {
      res.send(responseBody);
    } else {
      res.end();
    }
  } catch (error) {
    console.error('API backend request failed:', error);
    res.status(502).json({ error: 'Unable to reach the API backend' });
  }
}
