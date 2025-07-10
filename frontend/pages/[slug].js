import React from 'react';
import dynamic from 'next/dynamic';
import { Container } from '../components/Container';
import { Text } from '../components/Text';

const Editor = dynamic(() => import('@craftjs/core').then(mod => mod.Editor), {
  ssr: false,
});
const Frame = dynamic(() => import('@craftjs/core').then(mod => mod.Frame), {
  ssr: false,
});
const Element = dynamic(() => import('@craftjs/core').then(mod => mod.Element), {
  ssr: false,
});

export default function Page({ page }) {
  if (!page) {
    return <p>Not Found</p>;
  }
  const hasContent = page.content && Object.keys(page.content).length > 0;

  return (
    <Editor resolver={{ Container, Text }}>
      <Frame data={hasContent ? page.content : undefined}>
        {!hasContent && (
          <Element is={Container} padding="40px" canvas>
            <Text text={page.title} fontSize="24px" />
          </Element>
        )}
      </Frame>
    </Editor>
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
