import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Container } from '../components/Container';
import { Text } from '../components/Text';
import { isValidContent } from '../lib/isValidContent';
import { domResolver } from '../lib/domResolver';
import { useCraftDisabled } from '../lib/useCraftDisabled';

const resolver = { ...domResolver, Container, Text };

const Editor = dynamic(() => import('@craftjs/core').then(mod => mod.Editor), {
  ssr: false,
  suspense: true,
});
const Frame = dynamic(() => import('@craftjs/core').then(mod => mod.Frame), {
  ssr: false,
  suspense: true,
});
const Element = dynamic(() => import('@craftjs/core').then(mod => mod.Element), {
  ssr: false,
  suspense: true,
});
const SaveButton = dynamic(() => import('../components/SaveButton').then(mod => mod.SaveButton), {
  ssr: false,
  suspense: true,
});
const Sidebar = dynamic(() => import('../components/Sidebar').then(mod => mod.Sidebar), {
  ssr: false,
  suspense: true,
});

export default function Home({ page }) {
  const craftDisabled = useCraftDisabled();
  const showEditing = page && page.enableCraftjs && !craftDisabled;

  async function handleSave(nodes) {
    if (!page || !page.id) return;
    try {
      const res = await fetch(`/api/pages?id=${page.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: nodes }),
      });
      if (!res.ok) alert('Save failed');
    } catch (err) {
      console.error(err);
    }
  }

  if (!page) {
    return <p>Not Found</p>;
  }

  if (!page.enableCraftjs) {
    return (
      <div>
        <p>{page.title}</p>
        <p>Content editing disabled</p>
      </div>
    );
  }

  const hasContent = isValidContent(page.content, resolver);

  return (
    <div>
      {showEditing && (
        <Suspense fallback={null}>
          <SaveButton onSave={handleSave} />
          <Sidebar />
        </Suspense>
      )}
      <Suspense fallback={null}>
        <Editor resolver={resolver} enabled={!craftDisabled}>
          <Frame data={hasContent ? page.content : undefined}>
            {!hasContent && (
              <Element is={Container} padding="40px" canvas>
                <Text text="Welcome to the frontend" fontSize="24px" />
              </Element>
            )}
          </Frame>
        </Editor>
      </Suspense>
    </div>
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
      ? { id: data.data[0].id, ...data.data[0].attributes }
      : null;

    return { props: { page }, revalidate: 60 };
  } catch (err) {
    console.error(err);
    return { props: { page: null }, revalidate: 60 };
  }
}
