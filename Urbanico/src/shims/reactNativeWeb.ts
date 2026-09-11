import * as RNW from 'react-native-web';

// TurboModuleRegistry fallback for Expo / React Native Web
export const TurboModuleRegistry = {
  get: () => null,
  getEnforcing: (_name: string) => null,
};

const defaultExport = {
  ...RNW,
  TurboModuleRegistry,
};

export const {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Platform,
  Animated,
  Modal,
  Pressable,
  ActivityIndicator,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  NativeModules,
  PixelRatio,
  StatusBar,
  SafeAreaView,
} = RNW as any;

export default defaultExport;
