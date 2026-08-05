// components/Sprite.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';

type ActionState = 'stand' | 'idle' | 'attack' | 'hit' | 'win' | 'defeat';

interface SpriteProps {
  action: ActionState;
  isEnemy?: boolean;
  characterId?: string;
}

const characterSprites: Record<string, Record<ActionState, any>> = {
  c0: {
    win: require('../assets/images/sprites/hero_win.png'),
    attack: require('../assets/images/sprites/hero_attack.png'),
    defeat: require('../assets/images/sprites/hero_defeat.png'),
    hit: require('../assets/images/sprites/hero_hit.png'),
    stand: require('../assets/images/sprites/hero_win.png'),
    idle: require('../assets/images/sprites/hero_idle.png'),
  },
  char_algebro: {
    win: require('../assets/images/sprites/hero_win.png'),
    attack: require('../assets/images/sprites/hero_attack.png'),
    defeat: require('../assets/images/sprites/hero_defeat.png'),
    hit: require('../assets/images/sprites/hero_hit.png'),
    stand: require('../assets/images/sprites/hero_win.png'),
    idle: require('../assets/images/sprites/hero_idle.png'),
  },
  c1: {
    win: require('../assets/images/sprites/lovelacewin.png'),
    attack: require('../assets/images/sprites/lovelaceattack.png'),
    defeat: require('../assets/images/sprites/Lovelacedefeat.png'),
    hit: require('../assets/images/sprites/Lovelacehit.png'),
    stand: require('../assets/images/sprites/lovelacewin.png'),
    idle: require('../assets/images/sprites/lovelaceidle.png'),
  },
  c2: {
    win: require('../assets/images/sprites/newtonwin.png'),
    attack: require('../assets/images/sprites/newtonattack.png'),
    defeat: require('../assets/images/sprites/Newtondefeat.png'),
    hit: require('../assets/images/sprites/Newtonhit.png'),
    stand: require('../assets/images/sprites/newtonwin.png'),
    idle: require('../assets/images/sprites/newtonidle.png'),
  },
  c3: {
    win: require('../assets/images/sprites/teslawin.png'),
    attack: require('../assets/images/sprites/teslaattack.png'),
    defeat: require('../assets/images/sprites/tesladefeat.png'),
    hit: require('../assets/images/sprites/teslahit.png'),
    stand: require('../assets/images/sprites/teslawin.png'),
    idle: require('../assets/images/sprites/teslaidle.png'),
  },
  c4: {
    win: require('../assets/images/sprites/curiewin.png'),
    attack: require('../assets/images/sprites/curieattack.png'),
    defeat: require('../assets/images/sprites/curiedefeat.png'),
    hit: require('../assets/images/sprites/curiehit.png'),
    stand: require('../assets/images/sprites/curiewin.png'),
    idle: require('../assets/images/sprites/curieidle.png'),
  },
};

const villainSprites: Record<ActionState, any> = {
  attack: require('../assets/images/sprites/villain_attack.png'),
  defeat: require('../assets/images/sprites/villain_defeat.png'),
  hit: require('../assets/images/sprites/villain_hit.png'),
  idle: require('../assets/images/sprites/villain_idle.png'),
  win: require('../assets/images/sprites/villain_win.png'),
  stand: require('../assets/images/sprites/villain_idle.png'),
};

export default function Sprite({ action, isEnemy = false, characterId }: SpriteProps) {
  const heroSet = (characterId && characterSprites[characterId]) || characterSprites.c0;
  const sprites = isEnemy ? villainSprites : heroSet;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (action === 'hit') {
      shakeAnim.setValue(0);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: -16, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 16, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -12, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 12, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
      ]).start();
    }
  }, [action]);

  const animatedStyle = {
    transform: [
      { translateX: shakeAnim },
      ...(isEnemy ? [{ scaleX: -1 as const }] : []),
    ],
  };

  return (
    <View style={styles.spriteContainer}>
      <Animated.View style={animatedStyle}>
        <Image
          source={sprites[action]}
          style={styles.spriteImage}
          resizeMode="contain"
        />
      </Animated.View>
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