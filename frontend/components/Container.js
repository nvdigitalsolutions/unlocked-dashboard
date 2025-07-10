import React from 'react';
import { useNode } from '@craftjs/core';
import PropTypes from 'prop-types';

export const Container = ({ children, padding }) => {
  const {
    connectors: { connect, drag },
  } = useNode();
  return (
    <div ref={(ref) => connect(drag(ref))} style={{ padding }}>
      {children}
    </div>
  );
};

Container.propTypes = {
  padding: PropTypes.string,
  children: PropTypes.node,
};

Container.craft = {
  props: {
    padding: '20px',
  },
  rules: {
    canDrag: () => true,
  },
};
