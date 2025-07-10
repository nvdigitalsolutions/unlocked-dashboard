import React from 'react';
import { useEditor } from '@craftjs/core';
import PropTypes from 'prop-types';

export function SaveButton({ onSave }) {
  const { query } = useEditor();
  return (
    <button onClick={() => onSave(JSON.parse(query.serialize()))}>
      Save
    </button>
  );
}

SaveButton.propTypes = {
  onSave: PropTypes.func.isRequired,
};
