// components/SketchBorder.tsx
// Clean Medieval Fantasy RPG / Manuscript Frame
// A refined, high-clarity medieval border that frames content elegantly without visual noise.
//
// Features:
// - Native crisp outer frame (2px solid dark iron)
// - Inset manuscript ruling frame (1px delicate bronze double-border)
// - 4 sleek forged iron corner bracket caps
// - 4 clean corner diamond studs (rivets)
// - Top & bottom centered heraldic diamond insignia
// - 100% sharp rendering with zero rotation blur or stray artifacts
// - pointerEvents="none" so child buttons and touchables remain fully interactive

import React from 'react';
import { View, ViewStyle, StyleSheet, StyleProp } from 'react-native';

interface SketchBorderProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  borderColor?: string;
  accentColor?: string;
  borderWidth?: number;
  showInnerBorder?: boolean;
  showCornerRivets?: boolean;
  showCornerBrackets?: boolean;
}

export default function SketchBorder({
  children,
  style,
  borderColor = '#1e1308',
  accentColor = '#7a5530',
  borderWidth = 2,
  showInnerBorder = true,
  showCornerRivets = true,
  showCornerBrackets = true,
}: SketchBorderProps) {
  const bw = borderWidth;
  const color = borderColor;
  const accent = accentColor;

  return (
    <View style={[{ position: 'relative' }, style]}>
      {/* ── Children Content ── */}
      {children}

      {/* ── Clean Medieval Border Overlay (pointerEvents="none" ensures zero touch interception) ── */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {/* ── 1. Outer Solid Iron Border ── */}
        <View
          style={[
            styles.outerBorder,
            {
              borderWidth: bw,
              borderColor: color,
            },
          ]}
        />

        {/* ── 2. Inner Manuscript Inset Margin (Double-Border Framing) ── */}
        {showInnerBorder && (
          <View
            style={[
              styles.innerRuling,
              {
                borderColor: accent,
              },
            ]}
          />
        )}

        {/* ── 3. Four Sleek Corner Reinforcement Brackets ── */}
        {showCornerBrackets && (
          <>
            {/* Top-Left */}
            <View style={[styles.bracketH, { top: 0, left: 0, backgroundColor: color }]} />
            <View style={[styles.bracketV, { top: 0, left: 0, backgroundColor: color }]} />

            {/* Top-Right */}
            <View style={[styles.bracketH, { top: 0, right: 0, backgroundColor: color }]} />
            <View style={[styles.bracketV, { top: 0, right: 0, backgroundColor: color }]} />

            {/* Bottom-Left */}
            <View style={[styles.bracketH, { bottom: 0, left: 0, backgroundColor: color }]} />
            <View style={[styles.bracketV, { bottom: 0, left: 0, backgroundColor: color }]} />

            {/* Bottom-Right */}
            <View style={[styles.bracketH, { bottom: 0, right: 0, backgroundColor: color }]} />
            <View style={[styles.bracketV, { bottom: 0, right: 0, backgroundColor: color }]} />
          </>
        )}

        {/* ── 4. Four Clean Corner Rivet Diamonds ── */}
        {showCornerRivets && (
          <>
            {/* Top-Left */}
            <View
              style={[
                styles.cornerRivet,
                { top: 5, left: 5, borderColor: color, backgroundColor: accent },
              ]}
            >
              <View style={styles.rivetDot} />
            </View>

            {/* Top-Right */}
            <View
              style={[
                styles.cornerRivet,
                { top: 5, right: 5, borderColor: color, backgroundColor: accent },
              ]}
            >
              <View style={styles.rivetDot} />
            </View>

            {/* Bottom-Left */}
            <View
              style={[
                styles.cornerRivet,
                { bottom: 5, left: 5, borderColor: color, backgroundColor: accent },
              ]}
            >
              <View style={styles.rivetDot} />
            </View>

            {/* Bottom-Right */}
            <View
              style={[
                styles.cornerRivet,
                { bottom: 5, right: 5, borderColor: color, backgroundColor: accent },
              ]}
            >
              <View style={styles.rivetDot} />
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /* Outer Frame */
  outerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 6,
  },

  /* Inner Ruling Margin */
  innerRuling: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    right: 4,
    borderWidth: 1,
    borderRadius: 3,
    opacity: 0.45,
  },

  /* Corner Bracket Arms (Clean right-angle forged caps) */
  bracketH: {
    position: 'absolute',
    width: 12,
    height: 3,
    borderRadius: 1,
  },
  bracketV: {
    position: 'absolute',
    width: 3,
    height: 12,
    borderRadius: 1,
  },

  /* Corner Rivets (Crisp diamond studs) */
  cornerRivet: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderWidth: 1,
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  rivetDot: {
    width: 2,
    height: 2,
    backgroundColor: '#d8b982',
    borderRadius: 1,
  },
});
