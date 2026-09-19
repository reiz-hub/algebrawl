// app/leaderboard.tsx
// Leaderboard — Top players ranked by MMR

import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import NeoButton from '../components/NeoButton';
import { GameFonts } from '../constants/theme';
import { useGameStore } from '../hooks/useGameStore';
import { fetchLeaderboard, type LeaderboardEntry } from '../services/multiplayerService';
import { getRank, RANKS } from '../services/mmrService';

import TopBar from '../components/TopBar';

export default function LeaderboardScreen({
  showBackButton = true,
  onBack,
}: {
  showBackButton?: boolean;
  onBack?: () => void;
} = {}) {
  const router = useRouter();
  const { userId, mmr, onlineWins, onlineLosses } = useGameStore();

  // Hardware back mirrors the in-game TopBar back button
  useEffect(() => {
    const onBackPress = () => {
      if (onBack) {
        onBack();
        return true;
      }
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/dungeon' as any);
      }
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [onBack, router]);

  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLeaderboard = useCallback(async () => {
    const data = await fetchLeaderboard(50);
    setPlayers(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadLeaderboard();
  }, []);

  // Find current player's rank position
  const myPosition = players.findIndex((p) => p.id === userId) + 1;
  const myRank = getRank(mmr);

  const renderItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const rank = getRank(item.mmr);
    const isMe = item.id === userId;
    const position = index + 1;
    const wins = item.online_wins ?? 0;
    const losses = item.online_losses ?? 0;
    const displayName = item.ingame_name || item.username || 'Unknown';

    return (
      <View style={[styles.row, isMe && styles.rowHighlight]}>
        {/* Position */}
        <View style={styles.positionCol}>
          <Text
            style={[
              styles.positionNumber,
              position === 1
                ? styles.positionTop1
                : position === 2
                ? styles.positionTop2
                : position === 3
                ? styles.positionTop3
                : null,
            ]}
          >
            #{position}
          </Text>
        </View>

        {/* Rank Icon */}
        <View style={styles.rankCol}>
          <Image source={rank.icon} style={styles.rankBadgeIcon} resizeMode="contain" />
        </View>

        {/* Player Info */}
        <View style={styles.playerCol}>
          <Text style={[styles.playerName, isMe && styles.playerNameMe]} numberOfLines={1}>
            {displayName}
            {isMe ? ' (You)' : ''}
          </Text>
          <Text style={styles.playerRecord}>
            {wins}W - {losses}L
          </Text>
        </View>

        {/* MMR */}
        <View style={styles.mmrCol}>
          <Text style={[styles.mmrValue, { color: rank.color }]}>{item.mmr}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with TopBar and Back button on the right */}
      <TopBar title="RANKING" showBackButton={showBackButton} onBack={onBack} />

      {/* My Stats Card */}
      <View style={styles.myStatsCard}>
        <View style={styles.myStatsShadow} />
        <View style={styles.myStatsContent}>
          <View style={styles.myStatsLeft}>
            <Image source={myRank.icon} style={styles.myStatsRankIcon} resizeMode="contain" />
            <View>
              <Text style={[styles.myStatsRankName, { color: myRank.color }]}>
                {myRank.name}
              </Text>
              <Text style={styles.myStatsMmr}>{mmr} MMR</Text>
            </View>
          </View>
          <View style={styles.myStatsRight}>
            <Text style={styles.myStatsRecord}>
              {onlineWins}W - {onlineLosses}L
            </Text>
            {myPosition > 0 && (
              <Text style={styles.myStatsPosition}>Rank #{myPosition}</Text>
            )}
          </View>
        </View>
      </View>

      {/* Rank Overview */}
      <View style={styles.rankLegend}>
        {RANKS.map((r) => {
          const isAchieved = (mmr ?? 0) >= r.minMmr;
          return (
            <View key={r.name} style={styles.rankLegendItem}>
              <View style={styles.rankIconWrapper}>
                <Image
                  source={r.icon}
                  style={[
                    styles.rankLegendIcon,
                    !isAchieved && styles.rankLegendIconLocked,
                  ]}
                  resizeMode="contain"
                />
                {!isAchieved && (
                  <Image
                    source={r.icon}
                    style={styles.rankIconShadowOverlay}
                    resizeMode="contain"
                  />
                )}
              </View>
              <Text
                style={[
                  styles.rankLegendName,
                  { color: isAchieved ? r.color : '#8c7e6c' },
                  !isAchieved && styles.rankLegendNameLocked,
                ]}
              >
                {r.minMmr}+
              </Text>
            </View>
          );
        })}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#1a1008" />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      ) : (
        <FlatList
          data={players}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>🏜️</Text>
              <Text style={styles.emptyText}>No ranked players yet</Text>
              <Text style={styles.emptyHint}>Play a ranked match to appear here!</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff9f0',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 14,
    backgroundColor: '#1a1008',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: GameFonts.brawl,
    fontSize: 22,
    color: '#f5a623',
    letterSpacing: 1,
  },

  // My Stats
  myStatsCard: {
    position: 'relative',
    margin: 16,
    marginBottom: 8,
  },
  myStatsShadow: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 12,
  },
  myStatsContent: {
    backgroundColor: '#1a1008',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  myStatsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  myStatsRankIcon: {
    width: 36,
    height: 36,
  },
  myStatsRankName: {
    fontFamily: GameFonts.brawl,
    fontSize: 16,
  },
  myStatsMmr: {
    fontFamily: GameFonts.arcade,
    fontSize: 12,
    color: '#fff',
    marginTop: 2,
  },
  myStatsRight: {
    alignItems: 'flex-end',
  },
  myStatsRecord: {
    fontFamily: GameFonts.hud,
    fontSize: 13,
    color: '#fff',
  },
  myStatsPosition: {
    fontFamily: GameFonts.arcade,
    fontSize: 11,
    color: '#f5a623',
    marginTop: 4,
  },

  // Rank Legend
  rankLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  rankLegendItem: {
    alignItems: 'center',
  },
  rankIconWrapper: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  rankLegendIcon: {
    width: 38,
    height: 38,
  },
  rankLegendIconLocked: {
    opacity: 0.35,
  },
  rankIconShadowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 38,
    height: 38,
    tintColor: '#000000',
    opacity: 0.6,
  },
  rankLegendName: {
    fontFamily: GameFonts.arcade,
    fontSize: 10,
  },
  rankLegendNameLocked: {
    opacity: 0.5,
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1a1008',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  rowHighlight: {
    backgroundColor: '#eff6ff',
    borderColor: '#1a6cf5',
    borderWidth: 3,
  },

  positionCol: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionNumber: {
    fontFamily: GameFonts.arcade,
    fontSize: 14,
    color: '#7a6a55',
  },
  positionTop1: {
    color: '#b45309',
  },
  positionTop2: {
    color: '#475569',
  },
  positionTop3: {
    color: '#78350f',
  },

  rankCol: {
    width: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    marginRight: 8,
  },
  rankBadgeIcon: {
    width: 38,
    height: 38,
  },
  playerCol: {
    flex: 1,
    justifyContent: 'center',
  },
  playerName: {
    fontFamily: GameFonts.brawl,
    fontSize: 14,
    color: '#1a1008',
  },
  playerNameMe: {
    color: '#1a6cf5',
  },
  playerRecord: {
    fontFamily: GameFonts.hud,
    fontSize: 11,
    color: '#7a6a55',
    marginTop: 2,
  },

  mmrCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 8,
  },
  mmrValue: {
    fontFamily: GameFonts.arcade,
    fontSize: 16,
  },

  // Loading / Empty
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: GameFonts.hud,
    fontSize: 14,
    color: '#7a6a55',
  },
  emptyBox: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontFamily: GameFonts.brawl,
    fontSize: 18,
    color: '#1a1008',
    marginBottom: 6,
  },
  emptyHint: {
    fontFamily: GameFonts.hud,
    fontSize: 13,
    color: '#7a6a55',
  },

  // Bottom
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff9f0',
    borderTopWidth: 2,
    borderColor: '#e5d9c4',
  },
  backBtn: {
    backgroundColor: '#e5d9c4',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  backBtnText: {
    fontFamily: GameFonts.brawl,
    fontSize: 14,
    color: '#1a1008',
    textTransform: 'uppercase',
  },
});
