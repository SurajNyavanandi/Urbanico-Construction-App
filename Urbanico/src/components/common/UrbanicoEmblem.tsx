import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Building2, Layers } from 'lucide-react';

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
    <View
      style={[
        {
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: size * 0.28,
          backgroundColor: color === '#FFFFFF' ? 'rgba(255,255,255,0.12)' : '#F5F5F7',
        },
        style,
      ]}
    >
      <Layers size={size * 0.58} color={color} strokeWidth={2.2} />
    </View>
  );
};

