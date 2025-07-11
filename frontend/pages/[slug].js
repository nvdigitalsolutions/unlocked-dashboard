import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Container } from '../components/Container';
import { Text } from '../components/Text';
import { isValidContent } from '../lib/isValidContent';
import { useCraftDisabled } from '../lib/useCraftDisabled';

const resolver = { Container, Text };

const Editor = dynamic(() => import('@craftjs/core').then((mod) => mod.Editor), {
  ssr: false,
  suspense: true,
});
const Frame = dynamic(() => import('@craftjs/core').then((mod) => mod.Frame), {
  ssr: false,
  suspense: true,
});
const Element = dynamic(() => import('@craftjs/core').then((mod) => mod.Element), {
  ssr: false,
  suspense: true,
});
const SaveButton = dynamic(() => import('../components/SaveButton').then((mod) => mod.SaveButton), {
  ssr: false,
  suspense: true,
});
const Sidebar = dynamic(() => import('../components/Sidebar').then((mod) => mod.Sidebar), {
  ssr: false,
  suspense: true,
});

export default function Page({ page }) {
  const craftDisabled = useCraftDisabled();
  const showEditing = page && page.enableCraftjs && !craftDisabled;

  async function handleSave(json) {
    if (!page || !page.id) return;
    try {
      const jwtMatch = document.cookie.match(/(?:^|; )jwt=([^;]*)/);
      const jwt = jwtMatch ? jwtMatch[1] : null;
      const res = await fetch(`${process.env.BACKEND_URL}/api/pages/${page.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
        },
        body: JSON.stringify({ data: { content: json } }),
      });
      if (!res.ok) {
        console.error('Save failed:', await res.text());
      }
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
                <Text text={page.title} fontSize="24px" />
              </Element>
            )}
          </Frame>
        </Editor>
      </Suspense>
    </div>
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
    const page = (data.data && data.data[0])
      ? { id: data.data[0].id, ...data.data[0].attributes }
      : null;
    return { props: { page }, revalidate: 60 };
  } catch (err) {
    console.error(err);
    return { props: { page: null }, revalidate: 60 };
  }
}
