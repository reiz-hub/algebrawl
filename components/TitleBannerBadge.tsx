// components/TitleBannerBadge.tsx
import { Feather } from '@expo/vector-icons';
import React from 'react';
import {
  Image,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { GameFonts } from '../constants/theme';
import { getTitleBanner } from '../constants/titleBanners';
import TouchableOpacity from './TouchableOpacity';

interface TitleBannerBadgeProps {
  titleId?: string | null;
  size?: 'sm' | 'md' | 'lg';
  onPress?: () => void;
  showEditIcon?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function TitleBannerBadge({
  titleId,
  size = 'md',
  onPress,
  showEditIcon = false,
  style,
}: TitleBannerBadgeProps) {
  const banner = getTitleBanner(titleId);

  const badgeDimensions =
    size === 'sm' ? { width: 22, height: 24 } : size === 'lg' ? { width: 36, height: 40 } : { width: 28, height: 32 };

  const innerElements = (
    <>
      {/* Badge Image */}
      <Image
        source={banner.badgeImage}
        style={[styles.badgeImage, badgeDimensions]}
        resizeMode="contain"
      />

      {/* Title Text */}
      <Text
        style={[
          styles.titleText,
          size === 'sm' && styles.titleTextSm,
          size === 'lg' && styles.titleTextLg,
          { color: '#1a1008' },
        ]}
        numberOfLines={1}
      >
        {banner.name.toUpperCase()}
      </Text>

      {showEditIcon && (
        <View style={styles.editIconBadge}>
          <Feather name="chevron-down" size={12} color="#7a6a55" />
        </View>
      )}
    </>
  );

  const containerStyles = [
    styles.container,
    size === 'sm' && styles.containerSm,
    size === 'lg' && styles.containerLg,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={containerStyles}
      >
        {innerElements}
      </TouchableOpacity>
    );
  }

  return (
    <View style={containerStyles}>
      {innerElements}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#fffdf9',
    borderWidth: 2,
    borderBottomWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 6,
  },
  containerSm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  containerLg: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 8,
  },
  badgeImage: {
    // sizing driven by props
  },
  titleText: {
    fontFamily: GameFonts.brawl,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  titleTextSm: {
    fontSize: 9,
    letterSpacing: 0.3,
  },
  titleTextLg: {
    fontSize: 13,
    letterSpacing: 0.8,
  },
  editIconBadge: {
    marginLeft: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

