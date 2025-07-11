import React from 'react';
import { useNode } from '@craftjs/core';
import PropTypes from 'prop-types';

export const Text = ({ text, fontSize }) => {
  const {
    connectors: { connect, drag },
  } = useNode();
  return (
    <p ref={(ref) => connect(drag(ref))} style={{ fontSize }}>
      {text}
    </p>
  );
};

Text.propTypes = {
  text: PropTypes.string,
  fontSize: PropTypes.string,
};

Text.craft = {
  displayName: 'Text',
  props: {
    text: 'Edit me',
    fontSize: '16px',
  },
};
