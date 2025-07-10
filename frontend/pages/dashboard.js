import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Container } from '../components/Container';
import { Text } from '../components/Text';
import { isValidContent } from '../lib/isValidContent';

const craftDisabled = process.env.NEXT_PUBLIC_DISABLE_CRAFTJS === 'true';

const resolver = { Container, Text };

let Editor = null;
let Frame = null;
let Element = null;
let SaveButton = null;
if (!craftDisabled) {
  Editor = dynamic(() => import('@craftjs/core').then((mod) => mod.Editor), { ssr: false });
  Frame = dynamic(() => import('@craftjs/core').then((mod) => mod.Frame), { ssr: false });
  Element = dynamic(() => import('@craftjs/core').then((mod) => mod.Element), { ssr: false });
  SaveButton = dynamic(() => import('../components/SaveButton').then((mod) => mod.SaveButton), { ssr: false });
}

export default function Dashboard() {
  const [page, setPage] = useState(null);
  const [content, setContent] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${process.env.BACKEND_URL}/api/pages?filters[slug][$eq]=home`);
        const data = await res.json();
        const pageEntry = data.data && data.data[0];
        if (pageEntry) {
          setPage(pageEntry);
          setContent(pageEntry.attributes.content);
        }
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  async function handleSave(json) {
    if (!page) return;
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
    return <p>Loading...</p>;
  }

  if (craftDisabled) {
    return (
      <div>
        <p>{page.attributes?.title || 'Dashboard'}</p>
        {page.attributes?.content && (
          <pre>{JSON.stringify(page.attributes.content, null, 2)}</pre>
        )}
      </div>
    );
  }

  const hasContent = isValidContent(content, resolver);

  return (
    <div>
      <SaveButton onSave={handleSave} />
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
    </div>
  );
}
