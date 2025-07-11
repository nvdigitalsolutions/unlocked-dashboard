import React, { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Container } from '../components/Container';
import { Text } from '../components/Text';
import { isValidContent } from '../lib/isValidContent';
import { domResolver } from '../lib/domResolver';

const craftDisabled = process.env.NEXT_PUBLIC_DISABLE_CRAFTJS === 'true';

const resolver = { ...domResolver, Container, Text };

let Editor = null;
let Frame = null;
let Element = null;
let SaveButton = null;
let Sidebar = null;
if (!craftDisabled) {
  Editor = dynamic(() => import('@craftjs/core').then((mod) => mod.Editor), {
    ssr: false,
    suspense: true,
  });
  Frame = dynamic(() => import('@craftjs/core').then((mod) => mod.Frame), {
    ssr: false,
    suspense: true,
  });
  Element = dynamic(() => import('@craftjs/core').then((mod) => mod.Element), {
    ssr: false,
    suspense: true,
  });
  SaveButton = dynamic(() => import('../components/SaveButton').then((mod) => mod.SaveButton), {
    ssr: false,
    suspense: true,
  });
  Sidebar = dynamic(() => import('../components/Sidebar').then((mod) => mod.Sidebar), {
    ssr: false,
    suspense: true,
  });
}

export default function Dashboard({ pageEntry }) {
  const [content, setContent] = useState(pageEntry?.attributes.content);

  async function handleSave(nodes) {
    if (!pageEntry) return;
    try {
      const res = await fetch(`/api/pages?id=${pageEntry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: nodes }),
      });
      if (!res.ok) alert('Save failed');
    } catch (err) {
      console.error(err);
    }
  }

  if (!pageEntry) {
    return <p>Loading...</p>;
  }

  if (craftDisabled) {
    return (
      <div>
        <p>{pageEntry.attributes?.title || 'Dashboard'}</p>
        {pageEntry.attributes?.content && (
          <pre>{JSON.stringify(pageEntry.attributes.content, null, 2)}</pre>
        )}
      </div>
    );
  }

  const hasContent = isValidContent(content, resolver);

  return (
    <div>
      <SaveButton onSave={handleSave} />
      <Suspense fallback={null}>
        <Sidebar />
      </Suspense>
      <Suspense fallback={null}>
        <Editor resolver={resolver} onNodesChange={(query) => {
          try {
            setContent(JSON.parse(query.serialize()));
          } catch (e) {
            console.error('Failed to parse nodes', e);
          }
        }}>
          <Frame data={hasContent ? content : undefined}>
            {!hasContent && (
              <Element is={Container} padding="40px" canvas>
                <Text text="Welcome" fontSize="24px" />
              </Element>
            )}
          </Frame>
        </Editor>
      </Suspense>
    </div>
  );
}

export async function getServerSideProps({ req }) {
  const cookies = req.headers.cookie ? require('cookie').parse(req.headers.cookie) : {};
  const jwt = cookies.jwt;
  if (!jwt) {
    return {
      redirect: { destination: '/login', permanent: false },
    };
  }
  try {
    const authRes = await fetch(`${process.env.BACKEND_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    if (!authRes.ok) {
      return { redirect: { destination: '/login', permanent: false } };
    }
    const base = process.env.FRONTEND_URL || 'http://localhost:3000';
    const pageRes = await fetch(`${base}/api/pages?slug=home`, {
      headers: { Cookie: req.headers.cookie || '' },
    });
    const { data } = await pageRes.json();
    const pageEntry = data && data[0];
    return { props: { pageEntry: pageEntry || null } };
  } catch (err) {
    console.error('JWT validation failed', err);
    return { redirect: { destination: '/login', permanent: false } };
  }
}
