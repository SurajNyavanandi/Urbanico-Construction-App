import * as RNW from 'react-native-web';

export * from 'react-native-web';

// TurboModuleRegistry fallback for Expo / React Native Web
export const TurboModuleRegistry = {
  get: () => null,
  getEnforcing: (_name: string) => null,
};

const defaultExport = {
  ...RNW,
  TurboModuleRegistry,
};

export default defaultExport;
