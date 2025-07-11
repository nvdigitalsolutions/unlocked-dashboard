import { serialize } from 'cookie';

export default async function handler(req, res) {
  const jwt = req.cookies?.jwt;
  if (!jwt) {
    return res.status(401).end();
  }
  try {
    const strapiRes = await fetch(`${process.env.BACKEND_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    if (!strapiRes.ok) throw new Error('Invalid');
    const user = await strapiRes.json();
    res.setHeader(
      'Set-Cookie',
      serialize('loggedIn', 'true', {
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      })
    );
    res.status(200).json({ user });
  } catch {
    res.status(401).end();
  }
}
