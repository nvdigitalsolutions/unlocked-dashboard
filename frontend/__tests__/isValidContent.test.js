import { isValidContent } from '../lib/isValidContent';

const resolver = {
  Container: () => null,
  Text: () => null,
};

test('returns false for empty content', () => {
  expect(isValidContent({}, resolver)).toBe(false);
});

test('returns false when ROOT node is missing', () => {
  const content = {
    node1: { type: 'Container' },
  };
  expect(isValidContent(content, resolver)).toBe(false);
});

test('returns false when any node type is unknown', () => {
  const content = {
    ROOT: { type: 'Container' },
    node1: { type: 'Unknown' },
  };
  expect(isValidContent(content, resolver)).toBe(false);
});

test('returns true for valid content', () => {
  const content = {
    ROOT: { type: 'Container' },
    node1: { type: 'Text' },
  };
  expect(isValidContent(content, resolver)).toBe(true);
});

test('handles type objects with resolvedName', () => {
  const content = {
    ROOT: { type: { resolvedName: 'Container' } },
    node1: { type: { resolvedName: 'Text' } },
  };
  expect(isValidContent(content, resolver)).toBe(true);
});

test('allows basic HTML elements', () => {
  const content = {
    ROOT: { type: 'div', nodes: ['n1'] },
    n1: { type: 'Container' },
  };
  expect(isValidContent(content, resolver)).toBe(true);
});

test('allows extended HTML elements like svg', () => {
  const content = {
    ROOT: { type: 'svg', nodes: ['c1'] },
    c1: { type: 'circle' },
  };
  expect(isValidContent(content, resolver)).toBe(true);
});
