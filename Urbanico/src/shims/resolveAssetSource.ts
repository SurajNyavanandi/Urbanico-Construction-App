export function resolveAssetSource(source: any) {
  if (typeof source === 'object' && source !== null) {
    return {
      uri: source.uri || '',
      width: source.width || 0,
      height: source.height || 0,
      scale: source.scale || 1,
    };
  }
  if (typeof source === 'string') {
    return {
      uri: source,
      width: 0,
      height: 0,
      scale: 1,
    };
  }
  return {
    uri: '',
    width: 0,
    height: 0,
    scale: 1,
  };
}

export default resolveAssetSource;
