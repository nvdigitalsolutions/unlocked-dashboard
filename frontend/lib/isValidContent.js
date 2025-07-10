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
    if (!node || !node.type || !resolver[node.type]) {
      return false;
    }
  }
  return true;
}
