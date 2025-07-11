# Fixing Craft.js "component type does not exist in the resolver" errors

The Craft.js runtime error typically means that the editor is trying to render a node whose `type` isn't available in the `resolver` passed to `<Editor>`. When the JSON tree saved in Strapi references a component not registered in the resolver, Craft can't resolve the component and hydration fails with a message like:

```
Invariant failed: The component type specified for this node (undefined) does not exist in the resolver
```

The following checklist covers the most common causes in a Strapi + Next.js setup and how to resolve them.

## 1. Ensure every component is in the resolver before `<Editor>` mounts

```tsx
// editor-wrapper.tsx
'use client';
import { Editor } from '@craftjs/core';
import { Text } from '@/components/craft/Text';
import { Container } from '@/components/craft/Container';

const resolver = {
  Text,
  Container,
  // ...other components
};

export default function CraftEditor({ initialJson, readonly }) {
  return (
    <Editor resolver={resolver} enabled={!readonly}>
      <Frame json={initialJson}>{/* fallback / blank canvas */}</Frame>
    </Editor>
  );
}
```

## 2. Verify each component's `displayName`

```tsx
export const Text = ({ text }) => <p>{text}</p>;
Text.craft = { displayName: 'Text' };
```

If you rename or wrap a component, set `displayName` explicitly so the stored JSON matches the runtime component name.

## 3. Check the JSON from Strapi

```tsx
const initialJson = JSON.parse(data.attributes.builder);
console.log(
  Object.keys(initialJson.nodes).map(id => initialJson.nodes[id].data.displayName)
);
```

Any name not present in `resolver` will break hydration.

## 4. Be careful with dynamic imports and lazy loading

Craft needs components synchronously when it mounts. If using `next/dynamic`, set `ssr: false` but ensure the component has been loaded before passing it to the resolver module.

## 5. Ensure a single copy of React and Craft.js

Having multiple versions of React or Craft.js in `node_modules` can cause `instanceof` checks to fail. Verify both the frontend and backend use the same package versions and avoid duplicate installs in a monorepo.

## Quick debug script

1. Retrieve the saved JSON from Strapi.
2. Run:

```js
const json = /* paste */;
const names = Object.values(json.nodes).map(n => n.data.displayName);
console.log([...new Set(names)]);
```

Compare that list with `Object.keys(resolver)` to find any missing component names.

If none of the above steps reveal the issue, gather the resolver object, the list of `displayName`s from the saved JSON, and how the components are imported in the editor container. With that information you can pinpoint the node Craft can't resolve.
