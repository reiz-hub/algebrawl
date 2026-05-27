import React from 'react';
import { TouchableOpacity as RNTouchableOpacity, TouchableOpacityProps } from 'react-native';
import { soundService } from '../services/soundService';

export interface SoundTouchableOpacityProps extends TouchableOpacityProps {
  silent?: boolean;
}

export const TouchableOpacity: React.FC<SoundTouchableOpacityProps> = ({
  silent,
  onPress,
  ...props
}) => {
  const handlePress = (e: any) => {
    if (!silent) {
      soundService.playClick();
    }
    if (onPress) {
      onPress(e);
    }
  };

  return <RNTouchableOpacity onPress={handlePress} {...props} />;
};

export default TouchableOpacity;
