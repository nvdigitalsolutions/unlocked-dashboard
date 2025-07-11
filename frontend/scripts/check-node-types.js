#!/usr/bin/env node
// List unique Craft.js node types from all pages in Strapi.

const base = process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL ||
  'http://localhost:1337';
const url = `${base.replace(/\/$/, '')}/api/pages?pagination[pageSize]=100`;

function listNodeTypes(tree) {
  const seen = new Set();
  const walk = (node) => {
    if (!node) return;
    if (node.type) {
      const t = typeof node.type === 'string' ? node.type : node.type.resolvedName;
      if (t) seen.add(t);
    }
    if (node.nodes) node.nodes.forEach((id) => walk(tree[id]));
    if (node.linkedNodes) Object.values(node.linkedNodes).forEach((id) => walk(tree[id]));
  };
  if (tree && tree.ROOT) {
    walk(tree.ROOT);
  }
  return Array.from(seen);
}

// Known components from the frontend resolver
const allowed = new Set([
  'Container',
  'Text',
  'a',
  'article',
  'button',
  'circle',
  'div',
  'em',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hr',
  'img',
  'input',
  'label',
  'li',
  'main',
  'nav',
  'option',
  'p',
  'path',
  'rect',
  'section',
  'select',
  'span',
  'strong',
  'svg',
  'table',
  'tbody',
  'td',
  'text',
  'textarea',
  'th',
  'thead',
  'tr',
  'ul'
]);

(async () => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const types = new Set();
    for (const page of data.data || []) {
      const content = page.attributes?.content;
      if (content) listNodeTypes(content).forEach((t) => types.add(t));
    }
    const found = Array.from(types);
    console.log('Craft node types found:', found.join(', '));
    const unknown = found.filter((t) => !allowed.has(t));
    if (unknown.length) {
      console.error('Unknown Craft node types:', unknown.join(', '));
      console.error('Add these components to the resolver before <Editor> mounts.');
      process.exitCode = 1;
    }
  } catch (err) {
    console.warn('Failed to fetch page data:', err.message);
    process.exitCode = 1;
  }
})();
