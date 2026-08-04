import React from 'react';

export default function codegenNativeComponent(componentName: string, options?: any) {
  return (props: any) => React.createElement('div', props);
}
