import React from 'react';
import { View, StyleSheet } from 'react-native';

export const SafeAreaContext = React.createContext({
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
});

export const SafeAreaProvider = ({ children, style, ...props }: any) => {
  const flatStyle = StyleSheet.flatten(style);
  return <View style={[{ flex: 1 }, flatStyle]} {...props}>{children}</View>;
};

export const SafeAreaView = ({ children, style, edges, mode, ...props }: any) => {
  const { onInsetsChange, ...restProps } = props;
  const flatStyle = StyleSheet.flatten(style);
  return (
    <View style={[{ flex: 1 }, flatStyle]} {...restProps}>
      {children}
    </View>
  );
};

export const useSafeAreaInsets = () => ({
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
});

export const useSafeAreaFrame = () => ({
  x: 0,
  y: 0,
  width: typeof window !== 'undefined' ? window.innerWidth : 375,
  height: typeof window !== 'undefined' ? window.innerHeight : 812,
});

export const SafeAreaConsumer = SafeAreaContext.Consumer;

export const initialWindowMetrics = {
  frame: { x: 0, y: 0, width: 375, height: 812 },
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
};
