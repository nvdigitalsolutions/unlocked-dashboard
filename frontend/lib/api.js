export async function fetchFromAPI(path, options = {}) {
  const url = `${process.env.BACKEND_URL}${path}`;
  const res = await fetch(url, options);
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error);
  }
  return res.json();
}
