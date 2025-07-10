import React from 'react';

export default function Page({ page }) {
  if (!page) {
    return <p>Not Found</p>;
  }
  return (
    <div>
      <h1>{page.title}</h1>
      <pre>{JSON.stringify(page.content, null, 2)}</pre>
    </div>
  );
}

export async function getStaticPaths() {
  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/pages`);
    const data = await res.json();
    const paths = data.data.map((p) => ({ params: { slug: p.attributes.slug } }));
    return { paths, fallback: true };
  } catch (err) {
    console.error(err);
    return { paths: [], fallback: true };
  }
}

export async function getStaticProps({ params }) {
  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/pages?filters[slug][$eq]=${params.slug}`);
    const data = await res.json();
    const page = data.data[0]?.attributes || null;
    return { props: { page }, revalidate: 60 };
  } catch (err) {
    console.error(err);
    return { props: { page: null }, revalidate: 60 };
  }
}
