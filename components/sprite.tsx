// components/Sprite.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';

type ActionState = 'stand' | 'idle' | 'attack' | 'hit' | 'win' | 'defeat';

interface SpriteProps {
  action: ActionState;
  isEnemy?: boolean;
  characterId?: string;
  enemyId?: string;
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

const villain2Sprites: Record<ActionState, any> = {
  attack: require('../assets/images/sprites/villain2_attack.png'),
  defeat: require('../assets/images/sprites/villain2_defeat.png'),
  hit: require('../assets/images/sprites/villain2_hit.png'),
  idle: require('../assets/images/sprites/villain2_idle.png'),
  win: require('../assets/images/sprites/villain2_win.png'),
  stand: require('../assets/images/sprites/villain2_idle.png'),
};

const slimeSprites: Record<ActionState, any> = {
  attack: require('../assets/images/sprites/slime_attack.png'),
  defeat: require('../assets/images/sprites/slime_defeat.png'),
  hit: require('../assets/images/sprites/slime_hit.png'),
  idle: require('../assets/images/sprites/slime_idle.png'),
  win: require('../assets/images/sprites/slime_win.png'),
  stand: require('../assets/images/sprites/slime_idle.png'),
};

const knightSprites: Record<ActionState, any> = {
  attack: require('../assets/images/sprites/knight_attack.png'),
  defeat: require('../assets/images/sprites/knight_defeat.png'),
  hit: require('../assets/images/sprites/knight_hit.png'),
  idle: require('../assets/images/sprites/knight_idle.png'),
  win: require('../assets/images/sprites/knight_win.png'),
  stand: require('../assets/images/sprites/knight_idle.png'),
};

const mummySprites: Record<ActionState, any> = {
  attack: require('../assets/images/sprites/mummy_attack.png'),
  defeat: require('../assets/images/sprites/mummy_defeat.png'),
  hit: require('../assets/images/sprites/mummy_hit.png'),
  idle: require('../assets/images/sprites/mummy_idle.png'),
  win: require('../assets/images/sprites/mummy_win.png'),
  stand: require('../assets/images/sprites/mummy_idle.png'),
};

const golemSprites: Record<ActionState, any> = {
  attack: require('../assets/images/sprites/golem_attack.png'),
  defeat: require('../assets/images/sprites/golem_defeat.png'),
  hit: require('../assets/images/sprites/golem_hit.png'),
  idle: require('../assets/images/sprites/golem_idle.png'),
  win: require('../assets/images/sprites/golem_win.png'),
  stand: require('../assets/images/sprites/golem_idle.png'),
};

const easyDragonSprites: Record<ActionState, any> = {
  attack: require('../assets/images/sprites/easy_dragon_attack.png'),
  defeat: require('../assets/images/sprites/easy_dragon_defeat.png'),
  hit: require('../assets/images/sprites/easy_dragon_hit.png'),
  idle: require('../assets/images/sprites/easy_dragon_idle.png'),
  win: require('../assets/images/sprites/easy_dragon_win.png'),
  stand: require('../assets/images/sprites/easy_dragon_idle.png'),
};

const mediumDragonSprites: Record<ActionState, any> = {
  attack: require('../assets/images/sprites/medium_dragon_attack.png'),
  defeat: require('../assets/images/sprites/medium_dragon_defeat.png'),
  hit: require('../assets/images/sprites/medium_dragon_hit.png'),
  idle: require('../assets/images/sprites/medium_dragon_idle.png'),
  win: require('../assets/images/sprites/medium_dragon_win.png'),
  stand: require('../assets/images/sprites/medium_dragon_idle.png'),
};

const enemySpritesMap: Record<string, Record<ActionState, any>> = {
  villain1: villainSprites,
  villain2: villain2Sprites,
  slime: slimeSprites,
  knight: knightSprites,
  mummy: mummySprites,
  golem: golemSprites,
  easy_dragon: easyDragonSprites,
  medium_dragon: mediumDragonSprites,
  dragon: easyDragonSprites,
};

interface IdleProfile {
  duration: number; // Half-cycle duration in ms
  bounceHeight: number; // Max vertical lift in px
  squashY: [number, number]; // [inhale/top scaleY, exhale/bottom scaleY]
  squashX: [number, number]; // [inhale/top scaleX, exhale/bottom scaleX]
  tiltDeg: [number, number, number]; // [start, peak, return] in degrees
  shadowScaleRange: [number, number]; // [ground scaleX, apex scaleX]
  shadowOpacityRange: [number, number]; // [ground opacity, apex opacity]
}

const defaultProfile: IdleProfile = {
  duration: 850,
  bounceHeight: 4,
  squashY: [0.97, 1.03],
  squashX: [1.02, 0.98],
  tiltDeg: [0, 1, -0.5],
  shadowScaleRange: [1, 0.85],
  shadowOpacityRange: [0.35, 0.18],
};

const customProfiles: Record<string, Partial<IdleProfile>> = {
  // Heroes
  c0: { duration: 850, bounceHeight: 4, squashY: [0.97, 1.03], squashX: [1.02, 0.98] },
  char_algebro: { duration: 850, bounceHeight: 4, squashY: [0.97, 1.03], squashX: [1.02, 0.98] },
  c1: { duration: 750, bounceHeight: 3, squashY: [0.98, 1.025], squashX: [1.015, 0.985], tiltDeg: [0, 0.6, -0.4] }, // Lovelace - brisk, intellectual
  c2: { duration: 900, bounceHeight: 4, squashY: [0.97, 1.03], squashX: [1.02, 0.98], tiltDeg: [0, -0.8, 0.4] }, // Newton - calm, thoughtful
  c3: { duration: 800, bounceHeight: 5, squashY: [0.965, 1.035], squashX: [1.025, 0.975], tiltDeg: [0, 1.2, -0.6] }, // Tesla - energetic electric
  c4: { duration: 850, bounceHeight: 4, squashY: [0.97, 1.03], squashX: [1.02, 0.98], tiltDeg: [0, 0.8, -0.4] }, // Curie - radiant, steady

  // Enemies
  slime: { duration: 950, bounceHeight: 7, squashY: [0.88, 1.10], squashX: [1.10, 0.90], shadowScaleRange: [1.1, 0.72], shadowOpacityRange: [0.42, 0.15] }, // Slime - extra squishy jelly
  golem: { duration: 1250, bounceHeight: 2, squashY: [0.98, 1.015], squashX: [1.015, 0.985], shadowScaleRange: [1, 0.92], shadowOpacityRange: [0.38, 0.28] }, // Golem - heavy stone breathing
  easy_dragon: { duration: 1100, bounceHeight: 8, squashY: [0.95, 1.04], squashX: [1.03, 0.97], tiltDeg: [0, 1.8, -1.2], shadowScaleRange: [1, 0.7] }, // Dragon - hovering flight
  medium_dragon: { duration: 1100, bounceHeight: 8, squashY: [0.95, 1.04], squashX: [1.03, 0.97], tiltDeg: [0, 1.8, -1.2], shadowScaleRange: [1, 0.7] },
  dragon: { duration: 1100, bounceHeight: 8, squashY: [0.95, 1.04], squashX: [1.03, 0.97], tiltDeg: [0, 1.8, -1.2], shadowScaleRange: [1, 0.7] },
  mummy: { duration: 1150, bounceHeight: 4, squashY: [0.97, 1.025], squashX: [1.02, 0.98], tiltDeg: [0, -1.2, 0.8] }, // Mummy - shambling float
  knight: { duration: 950, bounceHeight: 3, squashY: [0.975, 1.025], squashX: [1.02, 0.98] }, // Knight - disciplined armored stance
  villain1: { duration: 850, bounceHeight: 4, squashY: [0.97, 1.03], squashX: [1.02, 0.98], tiltDeg: [0, 1, -0.5] },
  villain2: { duration: 900, bounceHeight: 4, squashY: [0.965, 1.035], squashX: [1.025, 0.975], tiltDeg: [0, -1, 0.8] },
};

export default function Sprite({ action, isEnemy = false, characterId, enemyId }: SpriteProps) {
  const heroSet = (characterId && characterSprites[characterId]) || characterSprites.c0;
  const enemySet = (enemyId && enemySpritesMap[enemyId]) || (enemyId === 'villain2' ? villain2Sprites : villainSprites);
  // If characterId is explicitly provided (multiplayer battle against another player's equipped character), use that character skin
  const sprites = characterId ? heroSet : (isEnemy ? enemySet : heroSet);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const idleAnim = useRef(new Animated.Value(0)).current;

  const isIdle = action === 'idle' || action === 'stand';
  const profileKey = characterId || enemyId || (isEnemy ? 'villain1' : 'c0');
  const custom = customProfiles[profileKey] || {};
  const profile: IdleProfile = { ...defaultProfile, ...custom };

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
  }, [action, shakeAnim]);

  useEffect(() => {
    if (isIdle) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(idleAnim, {
            toValue: 1,
            duration: profile.duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(idleAnim, {
            toValue: 0,
            duration: profile.duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      idleAnim.setValue(0);
    }
  }, [action, isIdle, idleAnim, profile.duration]);

  // Dynamic idle transformations (breathing, floating, squash & stretch)
  const idleTranslateY = idleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -profile.bounceHeight],
  });

  const idleScaleY = idleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [profile.squashY[0], profile.squashY[1]],
  });

  const idleScaleX = idleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: isEnemy
      ? [-profile.squashX[0], -profile.squashX[1]]
      : [profile.squashX[0], profile.squashX[1]],
  });

  const idleRotate = idleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: profile.tiltDeg.map((deg) => `${isEnemy ? -deg : deg}deg`),
  });

  const shadowScale = idleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [profile.shadowScaleRange[0], profile.shadowScaleRange[1]],
  });

  const shadowOpacity = idleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [profile.shadowOpacityRange[0], profile.shadowOpacityRange[1]],
  });

  const animatedTransform = [
    { translateX: shakeAnim },
    ...(isIdle
      ? [
        { translateY: idleTranslateY },
        { scaleX: idleScaleX },
        { scaleY: idleScaleY },
        { rotate: idleRotate },
      ]
      : isEnemy
        ? [{ scaleX: -1 as const }]
        : []),
  ];

  const isSlimeAttack = (enemyId === 'slime' || sprites === slimeSprites) && action === 'attack';
  const isKnightAttack = (enemyId === 'knight' || sprites === knightSprites) && action === 'attack';
  const isMediumDragonAttack = (enemyId === 'medium_dragon' || sprites === mediumDragonSprites) && action === 'attack';
  const spriteImageStyle = [
    styles.spriteImage,
    isSlimeAttack && styles.slimeAttackImage,
    isKnightAttack && styles.knightAttackImage,
    isMediumDragonAttack && styles.mediumDragonAttackImage,
  ];

  return (
    <View style={styles.spriteContainer}>
      <Animated.View style={{ transform: animatedTransform }}>
        <Image
          source={sprites[action]}
          style={spriteImageStyle}
          resizeMode="contain"
        />
      </Animated.View>
      {isIdle && (
        <Animated.View
          style={[
            styles.shadow,
            {
              transform: [{ scaleX: shadowScale }],
              opacity: shadowOpacity,
            },
          ]}
        />
      )}
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
  slimeAttackImage: {
    width: 172,
    height: 140,
  },
  knightAttackImage: {
    width: 215,
    height: 140,
  },
  mediumDragonAttackImage: {
    width: 154,
    height: 140,
  },
  shadow: {
    position: 'absolute',
    bottom: 6,
    width: 60,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#000',
    alignSelf: 'center',
    zIndex: -1,
  },
});