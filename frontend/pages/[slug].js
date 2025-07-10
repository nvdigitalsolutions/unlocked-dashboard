import React from 'react';
import dynamic from 'next/dynamic';
import { Container } from '../components/Container';
import { Text } from '../components/Text';
import { isValidContent } from '../lib/isValidContent';

const craftDisabled = process.env.NEXT_PUBLIC_DISABLE_CRAFTJS === 'true';

const resolver = { Container, Text };

let Editor = null;
let Frame = null;
let Element = null;
if (!craftDisabled) {
  Editor = dynamic(() => import('@craftjs/core').then((mod) => mod.Editor), {
    ssr: false,
  });
  Frame = dynamic(() => import('@craftjs/core').then((mod) => mod.Frame), {
    ssr: false,
  });
  Element = dynamic(() => import('@craftjs/core').then((mod) => mod.Element), {
    ssr: false,
  });
}

export default function Page({ page }) {
  if (!page) {
    return <p>Not Found</p>;
  }
  if (craftDisabled) {
    return <p>{page.title}</p>;
  }
  const hasContent = isValidContent(page.content, resolver);

  return (
    <Editor resolver={resolver}>
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
    const url = `${process.env.BACKEND_URL}/api/pages`;
    console.log('getStaticPaths fetch:', url);
    const res = await fetch(url);
    console.log('getStaticPaths status:', res.status);
    const data = await res.json();
    if (!Array.isArray(data.data)) {
      console.warn('Unexpected pages response:', data);
    }
    const paths = (data.data || []).map((p) => ({ params: { slug: p.attributes.slug } }));
    return { paths, fallback: true };
  } catch (err) {
    console.error(err);
    return { paths: [], fallback: true };
  }
}

export async function getStaticProps({ params }) {
  try {
    const url = `${process.env.BACKEND_URL}/api/pages?filters[slug][$eq]=${params.slug}`;
    console.log('getStaticProps fetch:', url);
    const res = await fetch(url);
    console.log('getStaticProps status:', res.status);
    const data = await res.json();
    if (!Array.isArray(data.data)) {
      console.warn('Unexpected page response:', data);
    }
    const page = (data.data && data.data[0]?.attributes) || null;
    return { props: { page }, revalidate: 60 };
  } catch (err) {
    console.error(err);
    return { props: { page: null }, revalidate: 60 };
  }
}
