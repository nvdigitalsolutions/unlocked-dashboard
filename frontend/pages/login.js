import { useState } from 'react';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    if (res.ok) {
      window.location.href = '/dashboard';
    } else {
      const data = await res.json();
      setError(data.message || 'Login failed');
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Login</button>
      {error && <p>{error}</p>}
    </form>
  );
}
