import React from 'react';
import dynamic from 'next/dynamic';
import { Container } from '../components/Container';
import { Text } from '../components/Text';

const Editor = dynamic(() => import('@craftjs/core').then(mod => mod.Editor), { ssr: false });
const Frame = dynamic(() => import('@craftjs/core').then(mod => mod.Frame), { ssr: false });
const Element = dynamic(() => import('@craftjs/core').then(mod => mod.Element), { ssr: false });

export default function Home() {
  return (
    <Editor resolver={{ Container, Text }}>
      <Frame>
        <Element is={Container} padding="40px" canvas>
          <Text text="Welcome to the frontend" fontSize="24px" />
        </Element>
      </Frame>
    </Editor>
  );
}
