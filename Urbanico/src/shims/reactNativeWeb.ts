import * as RNW from 'react-native-web';

// TurboModuleRegistry fallback for Expo / React Native Web
export const TurboModuleRegistry = {
  get: () => null,
  getEnforcing: (_name: string) => null,
};

export const LogBox = {
  ignoreLogs: (_logs: string[]) => {},
  ignoreAllLogs: (_ignore?: boolean) => {},
};

export const {
  ActivityIndicator,
  Alert,
  Animated,
  AppState,
  BackHandler,
  Button,
  Dimensions,
  Easing,
  FlatList,
  Image,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Linking,
  Modal,
  NativeModules,
  PanResponder,
  PixelRatio,
  Platform,
  Pressable,
  ProgressBarAndroid,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  SectionList,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  TouchableHighlight,
  TouchableWithoutFeedback,
  useColorScheme,
  useWindowDimensions,
  View,
  Vibration,
} = RNW as any;

const defaultExport = {
  ...RNW,
  TurboModuleRegistry,
  useWindowDimensions: (RNW as any).useWindowDimensions || (() => ({ width: typeof window !== 'undefined' ? window.innerWidth : 375, height: typeof window !== 'undefined' ? window.innerHeight : 812, scale: 1, fontScale: 1 })),
  RefreshControl: (RNW as any).RefreshControl || ((props: any) => props.children || null),
  ImageBackground: (RNW as any).ImageBackground || ((RNW as any).Image),
};

export default defaultExport;

