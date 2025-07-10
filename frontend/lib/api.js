export async function fetchFromAPI(path, options = {}) {
  const base =
    typeof window === 'undefined'
      ? process.env.BACKEND_URL
      : process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL;
  const url = `${base}${path}`;
  const res = await fetch(url, options);
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error);
  }
  return res.json();
}
