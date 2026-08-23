// app/leaderboard.tsx
// Leaderboard — Top players ranked by MMR

import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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

export default function LeaderboardScreen() {
  const router = useRouter();
  const { userId, mmr, onlineWins, onlineLosses } = useGameStore();

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
          {position <= 3 ? (
            <Text style={styles.positionMedal}>
              {position === 1 ? '🥇' : position === 2 ? '🥈' : '🥉'}
            </Text>
          ) : (
            <Text style={styles.positionNumber}>#{position}</Text>
          )}
        </View>

        {/* Player Info */}
        <View style={styles.playerCol}>
          <View style={styles.playerNameRow}>
            <Text style={styles.rankBadge}>{rank.badge}</Text>
            <Text style={[styles.playerName, isMe && styles.playerNameMe]} numberOfLines={1}>
              {displayName}
              {isMe ? ' (You)' : ''}
            </Text>
          </View>
          <Text style={styles.playerRecord}>
            {wins}W - {losses}L
          </Text>
        </View>

        {/* MMR */}
        <View style={styles.mmrCol}>
          <Text style={[styles.mmrValue, { color: rank.color }]}>{item.mmr}</Text>
          <Text style={[styles.rankName, { color: rank.color }]}>{rank.name}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏆 LEADERBOARD</Text>
      </View>

      {/* My Stats Card */}
      <View style={styles.myStatsCard}>
        <View style={styles.myStatsShadow} />
        <View style={styles.myStatsContent}>
          <View style={styles.myStatsLeft}>
            <Text style={styles.myStatsRankBadge}>{myRank.badge}</Text>
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

      {/* Rank Legend */}
      <View style={styles.rankLegend}>
        {RANKS.map((r) => (
          <View key={r.name} style={styles.rankLegendItem}>
            <Text style={styles.rankLegendBadge}>{r.badge}</Text>
            <Text style={[styles.rankLegendName, { color: r.color }]}>{r.minMmr}+</Text>
          </View>
        ))}
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

      {/* Back Button */}
      <View style={styles.bottomBar}>
        <NeoButton
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={18} color="#1a1008" />
          <Text style={styles.backBtnText}>Back</Text>
        </NeoButton>
      </View>
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
  myStatsRankBadge: {
    fontSize: 30,
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
    justifyContent: 'center',
    gap: 14,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  rankLegendItem: {
    alignItems: 'center',
  },
  rankLegendBadge: {
    fontSize: 18,
  },
  rankLegendName: {
    fontFamily: GameFonts.arcade,
    fontSize: 8,
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
    width: 40,
    alignItems: 'center',
  },
  positionMedal: {
    fontSize: 22,
  },
  positionNumber: {
    fontFamily: GameFonts.arcade,
    fontSize: 12,
    color: '#7a6a55',
  },

  playerCol: {
    flex: 1,
    marginLeft: 8,
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rankBadge: {
    fontSize: 16,
  },
  playerName: {
    fontFamily: GameFonts.brawl,
    fontSize: 13,
    color: '#1a1008',
    flexShrink: 1,
  },
  playerNameMe: {
    color: '#1a6cf5',
  },
  playerRecord: {
    fontFamily: GameFonts.hud,
    fontSize: 11,
    color: '#7a6a55',
    marginTop: 2,
    marginLeft: 22,
  },

  mmrCol: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  mmrValue: {
    fontFamily: GameFonts.arcade,
    fontSize: 16,
  },
  rankName: {
    fontFamily: GameFonts.hud,
    fontSize: 10,
    textTransform: 'uppercase',
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
