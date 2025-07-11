import React, { useEffect, useState } from 'react';
import { useEditor } from '@craftjs/core';

export function Sidebar() {
  const { selected, query, actions } = useEditor((state) => ({
    selected: state.events.selected,
  }));
  const [text, setText] = useState('');

  useEffect(() => {
    if (selected && selected.length > 0) {
      const node = query.node(selected[0]).get();
      const t = node.data?.props?.text;
      if (typeof t === 'string') {
        setText(t);
      } else {
        setText('');
      }
    }
  }, [selected, query]);

  if (!selected || selected.length === 0) {
    return <div className="sidebar">Select an element</div>;
  }

  const nodeId = selected[0];
  const node = query.node(nodeId).get();
  const hasText = typeof node.data?.props?.text === 'string';

  const handleChange = (e) => {
    const val = e.target.value;
    setText(val);
    if (hasText) {
      actions.setProp(nodeId, (props) => {
        props.text = val;
      });
    }
  };

  return (
    <div className="sidebar">
      {hasText ? (
        <input value={text} onChange={handleChange} />
      ) : (
        <p>Select a text element to edit</p>
      )}
    </div>
  );
}
