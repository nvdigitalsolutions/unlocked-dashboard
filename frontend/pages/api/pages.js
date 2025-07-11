export default async function handler(req, res) {
  const { slug, id } = req.query;
  const jwt = req.cookies?.jwt;
  if (!jwt) {
    return res.status(401).end();
  }

  const headers = { Authorization: `Bearer ${jwt}` };

  if (req.method === 'PUT') {
    if (!id) return res.status(400).json({ message: 'Missing id' });
    try {
      const resp = await fetch(`${process.env.BACKEND_URL}/api/pages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ data: { content: req.body.content } }),
      });
      const data = await resp.json();
      return res.status(resp.status).json(data);
    } catch (err) {
      return res.status(500).json({ message: 'Proxy error' });
    }
  } else if (req.method === 'GET') {
    try {
      const qs = slug ? `filters[slug][$eq]=${slug}` : `filters[id][$eq]=${id}`;
      const resp = await fetch(`${process.env.BACKEND_URL}/api/pages?${qs}`, {
        headers,
      });
      const data = await resp.json();
      return res.status(resp.status).json(data);
    } catch (err) {
      return res.status(500).json({ message: 'Proxy error' });
    }
  } else {
    return res.status(405).end();
  }
}
