import React from 'react';
import dynamic from 'next/dynamic';
import { Container } from '../components/Container';
import { Text } from '../components/Text';
import { isValidContent } from '../lib/isValidContent';

const resolver = { Container, Text };

const Editor = dynamic(() => import('@craftjs/core').then(mod => mod.Editor), { ssr: false });
const Frame = dynamic(() => import('@craftjs/core').then(mod => mod.Frame), { ssr: false });
const Element = dynamic(() => import('@craftjs/core').then(mod => mod.Element), { ssr: false });

export default function Home({ page }) {
  if (!page) {
    return <p>Not Found</p>;
  }

  const hasContent = isValidContent(page.content, resolver);

  return (
    <Editor resolver={resolver}>
      <Frame data={hasContent ? page.content : undefined}>
        {!hasContent && (
          <Element is={Container} padding="40px" canvas>
            <Text text="Welcome to the frontend" fontSize="24px" />
          </Element>
        )}
      </Frame>
    </Editor>
  );
}

  export async function getStaticProps() {
    try {
    const url = `${process.env.BACKEND_URL}/api/pages?filters[slug][$eq]=home`;
    console.log('getStaticProps(home) fetch:', url);
    const res = await fetch(url);
    console.log('getStaticProps(home) status:', res.status);

    if (!res.ok) {
      const body = await res.text();
      console.warn(`Failed to load home page: ${res.status}`);
      console.warn('Home page response body:', body);
      return { props: { page: null }, revalidate: 60 };
    }

    const data = await res.json();
    if (!Array.isArray(data.data)) {
      console.warn('Unexpected home page response:', data);
    }
    const page = Array.isArray(data.data) && data.data.length > 0
      ? data.data[0].attributes
      : null;

    return { props: { page }, revalidate: 60 };
  } catch (err) {
    console.error(err);
    return { props: { page: null }, revalidate: 60 };
  }
}
