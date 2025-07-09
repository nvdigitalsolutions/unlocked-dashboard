export default async function handler(req, res) {
  const { secret, slug = '' } = req.query;
  if (secret !== process.env.PREVIEW_SECRET) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  const pageRes = await fetch(`${process.env.BACKEND_URL}/api/pages?filters[slug][$eq]=${slug}`);
  const pageData = await pageRes.json();
  if (!pageData.data?.length) {
    return res.status(404).json({ message: 'Not Found' });
  }

  res.setPreviewData({});
  res.writeHead(307, { Location: `/${slug}` });
  res.end();
}
