import { isValidContent } from '../lib/isValidContent';

const resolver = {
  Container: () => null,
  Text: () => null,
};

test('returns false for empty content', () => {
  expect(isValidContent({}, resolver)).toBe(false);
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
