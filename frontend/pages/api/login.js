import { serialize } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  const { identifier, password } = req.body;
  try {
    const strapiRes = await fetch(`${process.env.BACKEND_URL}/api/auth/local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await strapiRes.json();
    if (!strapiRes.ok) {
      return res.status(strapiRes.status).json({ message: data.error?.message || 'Login failed' });
    }
    res.setHeader(
      'Set-Cookie',
      serialize('jwt', data.jwt, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      })
    );
    res.status(200).json({ user: data.user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Error connecting to backend' });
  }
}
