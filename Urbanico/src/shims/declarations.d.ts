declare module 'react-native-web' {
  const content: any;
  export default content;
  export const View: any;
  export const Text: any;
  export const Image: any;
  export const ImageBackground: any;
  export const TouchableOpacity: any;
  export const ScrollView: any;
  export const TextInput: any;
  export type TextInput = any;
  export const StyleSheet: any;
  export const Platform: any;
  export const Animated: any;
  export const Modal: any;
  export const Pressable: any;
  export const ActivityIndicator: any;
  export const Dimensions: any;
  export const useWindowDimensions: () => { width: number; height: number; scale: number; fontScale: number };
  export const FlatList: any;
  export const KeyboardAvoidingView: any;
  export const Linking: any;
  export const NativeModules: any;
  export const PixelRatio: any;
  export const StatusBar: any;
  export const SafeAreaView: any;
  export const RefreshControl: any;
  export const Switch: any;
  export type ViewStyle = any;
  export type TextStyle = any;
  export type ImageStyle = any;
  export type StyleProp<T> = any;
  export type DimensionValue = any;
  export type TextProps = any;
  export type LayoutChangeEvent = any;
}

declare module 'react-native' {
  export * from 'react-native-web';
  export const TextInput: any;
  export type TextInput = any;
  const content: any;
  export default content;
}

declare module 'lucide-react-native' {
  export * from 'lucide-react';
}

declare module 'react-native-webview' {
  import React from 'react';
  export const WebView: React.FC<any>;
  export default WebView;
}

declare module 'react-native-safe-area-context' {
  import React from 'react';
  export const SafeAreaContext: React.Context<any>;
  export const SafeAreaProvider: React.FC<any>;
  export const SafeAreaView: React.FC<any>;
  export const useSafeAreaInsets: () => { top: number; right: number; bottom: number; left: number };
  export const useSafeAreaFrame: () => { x: number; y: number; width: number; height: number };
  export const SafeAreaConsumer: any;
  export const initialWindowMetrics: any;
}

declare module 'expo-status-bar' {
  import React from 'react';
  export const StatusBar: React.FC<any>;
  export default StatusBar;
}

declare module 'expo-location' {
  export const Accuracy: any;
  export const requestForegroundPermissionsAsync: any;
  export const getCurrentPositionAsync: any;
  export const reverseGeocodeAsync: any;
  const content: any;
  export default content;
}
