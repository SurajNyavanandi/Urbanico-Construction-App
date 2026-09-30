import React, { useState, useEffect } from 'react';
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

export const useWindowDimensions = () => {
  const [dimensions, setDimensions] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 375,
    height: typeof window !== 'undefined' ? window.innerHeight : 812,
    scale: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
    fontScale: 1,
  }));

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
        scale: window.devicePixelRatio || 1,
        fontScale: 1,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return dimensions;
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
  View,
  Vibration,
} = RNW as any;

const defaultExport = {
  ...RNW,
  TurboModuleRegistry,
  useWindowDimensions,
  RefreshControl: (RNW as any).RefreshControl || ((props: any) => props.children || null),
  ImageBackground: (RNW as any).ImageBackground || ((RNW as any).Image),
};

export default defaultExport;
