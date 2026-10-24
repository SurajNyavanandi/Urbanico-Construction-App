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

const rnwAny: any = RNW;
const rnwModule: any = (rnwAny && rnwAny.default) ? rnwAny.default : (rnwAny || {});
const rawAnimated = rnwModule?.Animated || rnwAny?.Animated || {};

export const Animated = {
  ...rawAnimated,
  timing: (value: any, config: any) =>
    rawAnimated.timing?.(value, config ? { ...config, useNativeDriver: false } : config),
  spring: (value: any, config: any) =>
    rawAnimated.spring?.(value, config ? { ...config, useNativeDriver: false } : config),
  decay: (value: any, config: any) =>
    rawAnimated.decay?.(value, config ? { ...config, useNativeDriver: false } : config),
};

export const ActivityIndicator = rnwModule.ActivityIndicator || rnwAny.ActivityIndicator;
export const Alert = rnwModule.Alert || rnwAny.Alert || { alert: (title: string, msg?: string) => console.log(title, msg) };
export const AppState = rnwModule.AppState || rnwAny.AppState || { addEventListener: () => ({ remove: () => {} }) };
export const BackHandler = rnwModule.BackHandler || rnwAny.BackHandler || { addEventListener: () => ({ remove: () => {} }) };
export const Button = rnwModule.Button || rnwAny.Button;
export const Dimensions = rnwModule.Dimensions || rnwAny.Dimensions;
export const Easing = rnwModule.Easing || rnwAny.Easing;
export const FlatList = rnwModule.FlatList || rnwAny.FlatList;
export const Image = rnwModule.Image || rnwAny.Image;
export const ImageBackground = rnwModule.ImageBackground || rnwAny.ImageBackground || rnwModule.Image || rnwAny.Image;
export const Keyboard = rnwModule.Keyboard || rnwAny.Keyboard || { dismiss: () => {} };
export const KeyboardAvoidingView = rnwModule.KeyboardAvoidingView || rnwAny.KeyboardAvoidingView || rnwModule.View;
export const LayoutAnimation = rnwModule.LayoutAnimation || rnwAny.LayoutAnimation || { configureNext: () => {} };
export const Linking = rnwModule.Linking || rnwAny.Linking;
export const Modal = rnwModule.Modal || rnwAny.Modal;
export const NativeModules = rnwModule.NativeModules || rnwAny.NativeModules || {};
export const PanResponder = rnwModule.PanResponder || rnwAny.PanResponder;
export const PixelRatio = rnwModule.PixelRatio || rnwAny.PixelRatio;
export const Platform = rnwModule.Platform || rnwAny.Platform || { OS: 'web', select: (obj: any) => obj?.web || obj?.default };
export const Pressable = rnwModule.Pressable || rnwAny.Pressable;
export const ProgressBarAndroid = rnwModule.ProgressBarAndroid || rnwAny.ProgressBarAndroid;
export const RefreshControl = rnwModule.RefreshControl || rnwAny.RefreshControl || ((props: any) => props.children || null);
export const SafeAreaView = rnwModule.SafeAreaView || rnwAny.SafeAreaView || rnwModule.View;
export const ScrollView = rnwModule.ScrollView || rnwAny.ScrollView;
export const SectionList = rnwModule.SectionList || rnwAny.SectionList;
export const StatusBar = rnwModule.StatusBar || rnwAny.StatusBar;
export const StyleSheet = rnwModule.StyleSheet || rnwAny.StyleSheet;
export const Switch = rnwModule.Switch || rnwAny.Switch;
export const Text = rnwModule.Text || rnwAny.Text;
export const TextInput = rnwModule.TextInput || rnwAny.TextInput;
export const ToastAndroid = rnwModule.ToastAndroid || rnwAny.ToastAndroid;
export const TouchableOpacity = rnwModule.TouchableOpacity || rnwAny.TouchableOpacity;
export const TouchableHighlight = rnwModule.TouchableHighlight || rnwAny.TouchableHighlight;
export const TouchableWithoutFeedback = rnwModule.TouchableWithoutFeedback || rnwAny.TouchableWithoutFeedback;
export const useColorScheme = rnwModule.useColorScheme || rnwAny.useColorScheme || (() => 'light');
export const View = rnwModule.View || rnwAny.View;
export const Vibration = rnwModule.Vibration || rnwAny.Vibration || { vibrate: () => {} };

export default {
  ...rnwAny,
  ...rnwModule,
  Animated,
  TurboModuleRegistry,
  LogBox,
  useWindowDimensions,
  RefreshControl,
  ImageBackground,
};
