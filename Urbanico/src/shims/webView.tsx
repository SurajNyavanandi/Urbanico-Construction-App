import React from 'react';

export interface WebViewProps {
  source?: { html?: string; uri?: string };
  style?: any;
  onLoadEnd?: () => void;
  onMessage?: (event: any) => void;
  originWhitelist?: string[];
  javaScriptEnabled?: boolean;
  domStorageEnabled?: boolean;
  scalesPageToFit?: boolean;
  scrollEnabled?: boolean;
  [key: string]: any;
}

export const WebView: React.FC<WebViewProps> = ({
  source,
  style,
  onLoadEnd,
  onMessage,
  originWhitelist,
  javaScriptEnabled,
  domStorageEnabled,
  scalesPageToFit,
  scrollEnabled,
  ...props
}) => {
  const html = source?.html;
  const uri = source?.uri;

  return (
    <iframe
      srcDoc={html}
      src={uri}
      style={{
        border: 'none',
        width: '100%',
        height: '100%',
        ...(typeof style === 'object' ? style : {}),
      }}
      onLoad={onLoadEnd}
      {...props}
    />
  );
};

export default WebView;
