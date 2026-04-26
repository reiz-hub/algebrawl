// components/Sprite.tsx
import React from 'react';
import { Image, ImageStyle, StyleSheet, View } from 'react-native';

type ActionState = 'stand' | 'idle' | 'attack' | 'hit' | 'win' | 'defeat';

interface SpriteProps {
  action: ActionState;
  isEnemy?: boolean;
}

const heroSprites: Record<ActionState, any> = {
  win:     require('../assets/images/sprites/hero_win.png'),
  attack:  require('../assets/images/sprites/hero_attack.png'),
  defeat:  require('../assets/images/sprites/hero_defeat.png'),
  hit:     require('../assets/images/sprites/hero_hit.png'),
  stand:   require('../assets/images/sprites/hero_win.png'),
  idle:    require('../assets/images/sprites/hero_idle.png'),
};

const villainSprites: Record<ActionState, any> = {
  attack:  require('../assets/images/sprites/villain_attack.png'),
  defeat:  require('../assets/images/sprites/villain_defeat.png'),
  hit:     require('../assets/images/sprites/villain_hit.png'),
  idle:    require('../assets/images/sprites/villain_idle.png'),
  win:     require('../assets/images/sprites/villain_win.png'),
  stand:   require('../assets/images/sprites/villain_idle.png'),  // reuse idle as default stand
};

export default function Sprite({ action, isEnemy = false }: SpriteProps) {
  const sprites = isEnemy ? villainSprites : heroSprites;

  const imageStyle: ImageStyle = isEnemy
    ? { ...styles.spriteImage, transform: [{ scaleX: -1 }] }
    : styles.spriteImage;

  return (
    <View style={styles.spriteContainer}>
      <Image
        source={sprites[action]}
        style={imageStyle}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  spriteContainer: {
    width: 120,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
  },
  spriteImage: {
    width: 120,
    height: 140,
  },
});