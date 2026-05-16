import React, { useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';

interface NeoButtonProps {
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[] | any;
  shadowStyle?: ViewStyle | ViewStyle[] | any;
  wrapperStyle?: ViewStyle | ViewStyle[] | any;
  children: React.ReactNode;
  disabled?: boolean;
}

export default function NeoButton({ onPress, style, shadowStyle, wrapperStyle, children, disabled }: NeoButtonProps) {
  const transAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    if (!disabled) {
      Animated.spring(transAnim, { toValue: 6, useNativeDriver: true, speed: 60, bounciness: 10 }).start();
    }
  };

  const handlePressOut = () => {
    Animated.spring(transAnim, { toValue: 0, useNativeDriver: true, speed: 60, bounciness: 10 }).start();
  };

  return (
    <View style={[styles.btnWrapper, wrapperStyle]}>
      <View style={[styles.btnShadow, shadowStyle]} />
      <Animated.View style={{ transform: [{ translateX: transAnim }, { translateY: transAnim }] }}>
        <TouchableOpacity
          activeOpacity={1}
          style={[style, disabled && { opacity: 0.7 }]}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  btnWrapper: {
    position: 'relative',
    width: '100%'
  },
  btnShadow: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 16 // Default, overridden by button style if provided
  }
});
