function getTypeName(node) {
  if (!node || !node.type) {
    return null;
  }
  if (typeof node.type === 'string') {
    return node.type;
  }
  if (typeof node.type === 'object' && node.type.resolvedName) {
    return node.type.resolvedName;
  }
  return null;
}

export function isValidContent(content, resolver) {
  if (!content || typeof content !== 'object') {
    return false;
  }

  const keys = Object.keys(content);
  if (keys.length === 0) {
    return false;
  }

  for (const id of keys) {
    const node = content[id];
    const typeName = getTypeName(node);
    const component = resolver[typeName];
    if (!typeName || !component ||
        (typeof component !== 'function' && typeof component !== 'object')) {
      return false;
    }

    const children = [];
    if (Array.isArray(node.nodes)) {
      children.push(...node.nodes);
    }
    if (node.linkedNodes && typeof node.linkedNodes === 'object') {
      children.push(...Object.values(node.linkedNodes));
    }

    for (const childId of children) {
      if (!content[childId]) {
        return false;
      }
    }
  }

  return true;
}
