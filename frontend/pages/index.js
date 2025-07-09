import React from 'react';
import { Editor, Frame, Element } from '@craftjs/core';
import { Container } from '../components/Container';
import { Text } from '../components/Text';

export default function Home() {
  if (typeof window === 'undefined') {
    return null;
  }

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
