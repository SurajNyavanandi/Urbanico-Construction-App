import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';

interface UrbanicoEmblemProps {
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export const UrbanicoEmblem: React.FC<UrbanicoEmblemProps> = ({
  size = 84,
  color = '#111111',
  style,
}) => {
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
      >
        {/* Left Wing / Petal */}
        <path
          d="M 32 14 C 40 14 54 24 57 52 C 59 72 54 92 60 102 C 50 94 34 78 28 56 C 22 38 23 22 32 14 Z"
          fill={color}
        />
        {/* Right Wing / Petal */}
        <path
          d="M 88 14 C 80 14 66 24 63 52 C 61 72 66 92 60 102 C 70 94 86 78 92 56 C 98 38 97 22 88 14 Z"
          fill={color}
        />
      </svg>
    </View>
  );
};
