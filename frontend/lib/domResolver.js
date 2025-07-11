import React from 'react';
import { DOM_ELEMENTS } from './isValidContent';

export const domResolver = DOM_ELEMENTS.reduce((acc, tag) => {
  acc[tag] = (props) => React.createElement(tag, props, props.children);
  return acc;
}, {});
