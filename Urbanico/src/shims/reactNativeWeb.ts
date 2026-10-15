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

const rnwModule: any = (RNW as any).default || RNW;
const rawAnimated = rnwModule?.Animated || {};

export const Animated = {
  ...rawAnimated,
  timing: (value: any, config: any) =>
    rawAnimated.timing?.(value, config ? { ...config, useNativeDriver: false } : config),
  spring: (value: any, config: any) =>
    rawAnimated.spring?.(value, config ? { ...config, useNativeDriver: false } : config),
  decay: (value: any, config: any) =>
    rawAnimated.decay?.(value, config ? { ...config, useNativeDriver: false } : config),
};

export const ActivityIndicator = rnwModule.ActivityIndicator;
export const Alert = rnwModule.Alert;
export const AppState = rnwModule.AppState;
export const BackHandler = rnwModule.BackHandler;
export const Button = rnwModule.Button;
export const Dimensions = rnwModule.Dimensions;
export const Easing = rnwModule.Easing;
export const FlatList = rnwModule.FlatList;
export const Image = rnwModule.Image;
export const ImageBackground = rnwModule.ImageBackground || rnwModule.Image;
export const Keyboard = rnwModule.Keyboard;
export const KeyboardAvoidingView = rnwModule.KeyboardAvoidingView;
export const LayoutAnimation = rnwModule.LayoutAnimation;
export const Linking = rnwModule.Linking;
export const Modal = rnwModule.Modal;
export const NativeModules = rnwModule.NativeModules || {};
export const PanResponder = rnwModule.PanResponder;
export const PixelRatio = rnwModule.PixelRatio;
export const Platform = rnwModule.Platform;
export const Pressable = rnwModule.Pressable;
export const ProgressBarAndroid = rnwModule.ProgressBarAndroid;
export const RefreshControl = rnwModule.RefreshControl || ((props: any) => props.children || null);
export const SafeAreaView = rnwModule.SafeAreaView;
export const ScrollView = rnwModule.ScrollView;
export const SectionList = rnwModule.SectionList;
export const StatusBar = rnwModule.StatusBar;
export const StyleSheet = rnwModule.StyleSheet;
export const Switch = rnwModule.Switch;
export const Text = rnwModule.Text;
export const TextInput = rnwModule.TextInput;
export const ToastAndroid = rnwModule.ToastAndroid;
export const TouchableOpacity = rnwModule.TouchableOpacity;
export const TouchableHighlight = rnwModule.TouchableHighlight;
export const TouchableWithoutFeedback = rnwModule.TouchableWithoutFeedback;
export const useColorScheme = rnwModule.useColorScheme;
export const View = rnwModule.View;
export const Vibration = rnwModule.Vibration;

export default {
  ...rnwModule,
  Animated,
  TurboModuleRegistry,
  LogBox,
  useWindowDimensions,
  RefreshControl,
  ImageBackground,
};
