import React, { useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SHOP_ITEMS } from '../constants/shopItems';
import { useGameStore } from '../hooks/useGameStore';
import { ItemCategory, ItemRarity, ShopItem } from '../types/shop';
import NeoButton from './NeoButton';

const RARITY_COLORS: Record<ItemRarity, { bg: string; text: string; border: string }> = {
  common: { bg: '#e2e8f0', text: '#1a1008', border: '#1a1008' },
  rare: { bg: '#dbeafe', text: '#1a6cf5', border: '#1a1008' },
  epic: { bg: '#f3e8ff', text: '#9333ea', border: '#1a1008' },
  legendary: { bg: '#fef3c7', text: '#d97706', border: '#1a1008' },
};

export default function ShopView() {
  const coins = useGameStore((state) => state.coins);
  const inventory = useGameStore((state) => state.inventory);
  const equippedCharacter = useGameStore((state) => state.equippedCharacter);
  const equippedGear = useGameStore((state) => state.equippedGear);

  const buyItem = useGameStore((state) => state.buyItem);
  const equipItem = useGameStore((state) => state.equipItem);
  const addCoins = useGameStore((state) => state.addCoins);

  const [activeTab, setActiveTab] = useState<'all' | ItemCategory>('all');
  const [modalFeedback, setModalFeedback] = useState<{
    visible: boolean;
    title: string;
    message: string;
    success: boolean;
  }>({
    visible: false,
    title: '',
    message: '',
    success: false,
  });

  const filteredItems = SHOP_ITEMS.filter((item) => {
    if (activeTab === 'all') return true;
    return item.category === activeTab;
  });

  const handleBuy = (item: ShopItem) => {
    const result = buyItem(item.id);
    setModalFeedback({
      visible: true,
      title: result.success ? '🎉 ITEM UNLOCKED!' : '⚠️ TRANSACTION FAILED',
      message: result.message,
      success: result.success,
    });
  };

  const handleEquip = (item: ShopItem) => {
    equipItem(item.id);
  };

  const renderItemCard = ({ item }: { item: ShopItem }) => {
    const isOwned = inventory.includes(item.id);

    let isEquipped = false;
    if (item.category === 'character') isEquipped = equippedCharacter === item.id;
    else if (item.category === 'gear' || item.category === 'skill') isEquipped = equippedGear === item.id;

    const canAfford = coins >= item.cost;
    const rarityStyle = RARITY_COLORS[item.rarity];

    return (
      <View style={styles.cardWrapper}>
        <View style={styles.cardShadow} />
        <View style={styles.cardContent}>
          {/* Header Row */}
          <View style={styles.cardHeader}>
            {item.image ? (
              <Image source={item.image} style={styles.itemAvatarImage} resizeMode="contain" />
            ) : (
              <Text style={styles.itemIcon}>{item.icon || '🛍️'}</Text>
            )}
            <View style={styles.cardHeaderRight}>
              <View
                style={[
                  styles.rarityBadge,
                  { backgroundColor: rarityStyle.bg, borderColor: rarityStyle.border },
                ]}
              >
                <Text style={[styles.rarityText, { color: rarityStyle.text }]}>
                  {item.rarity.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.categoryTag}>{item.category.toUpperCase()}</Text>
            </View>
          </View>

          {/* Details */}
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemDescription}>{item.description}</Text>

          {/* Item Stats Badges */}
          {item.stats && (
            <View style={styles.statsContainer}>
              {item.stats.attackBonus ? (
                <Text style={styles.statBadge}>⚔️ +{item.stats.attackBonus} ATK</Text>
              ) : null}
              {item.stats.defenseBonus ? (
                <Text style={styles.statBadge}>🛡️ +{item.stats.defenseBonus} DEF</Text>
              ) : null}
              {item.stats.cooldownReduction ? (
                <Text style={styles.statBadge}>⚡ -{item.stats.cooldownReduction}% CD</Text>
              ) : null}
              {item.stats.extraTimeSeconds ? (
                <Text style={styles.statBadge}>⏳ +{item.stats.extraTimeSeconds}s / Q</Text>
              ) : null}
              {item.stats.scoreBonusPercent ? (
                <Text style={styles.statBadge}>🎯 +{item.stats.scoreBonusPercent}% SCORE</Text>
              ) : null}
              {item.stats.xpMultiplier ? (
                <Text style={styles.statBadge}>
                  ⭐ {item.stats.xpMultiplier}x XP BOOST
                </Text>
              ) : null}
            </View>
          )}

          {/* Dynamic Action Button Area */}
          <View style={styles.cardFooter}>
            {isEquipped ? (
              <TouchableOpacity
                style={styles.equippedBadgeBtn}
                onPress={() => handleEquip(item)}
                activeOpacity={0.8}
              >
                <Text style={styles.equippedBadgeText}>✓ EQUIPPED</Text>
              </TouchableOpacity>
            ) : isOwned ? (
              <NeoButton
                style={styles.equipBtn}
                shadowStyle={styles.equipBtnShadow}
                onPress={() => handleEquip(item)}
              >
                <Text style={styles.equipBtnText}>EQUIP</Text>
              </NeoButton>
            ) : canAfford ? (
              <NeoButton
                style={styles.buyBtn}
                shadowStyle={styles.buyBtnShadow}
                onPress={() => handleBuy(item)}
              >
                <Text style={styles.buyBtnText}>BUY 🪙 {item.cost}</Text>
              </NeoButton>
            ) : (
              <View style={styles.unaffordableBadge}>
                <Text style={styles.unaffordableText}>
                  NEED 🪙 {item.cost - coins} MORE
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Floating Background Symbols */}
      <Text style={[styles.bgSymbol, { top: '3%', left: '8%', transform: [{ rotate: '-10deg' }] }]}>-</Text>
      <Text style={[styles.bgSymbol, { top: '22%', right: '12%', transform: [{ rotate: '20deg' }] }]}>x²</Text>
      <Text style={[styles.bgSymbol, { bottom: '25%', left: '15%', transform: [{ rotate: '-15deg' }] }]}>+</Text>
      <Text style={[styles.bgSymbol, { bottom: '5%', right: '10%', transform: [{ rotate: '10deg' }] }]}>÷</Text>

      {/* ── Balance Header ── */}
      <View style={styles.cardWrapper}>
        <View style={styles.cardShadow} />
        <View style={styles.balanceCardContent}>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>CURRENT COIN BALANCE</Text>
            <View style={styles.coinBadge}>
              <Text style={styles.coinIcon}>🪙</Text>
              <Text style={styles.coinText}>{coins}</Text>
            </View>
          </View>

          {/* Add Test Coins Button */}
          <TouchableOpacity
            style={styles.addCoinBtn}
            onPress={() => addCoins(100)}
            activeOpacity={0.8}
          >
            <Text style={styles.addCoinText}>+100 🪙</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Category Filter Tabs ── */}
      <View style={styles.tabsWrapper}>
        <View style={styles.tabsShadow} />
        <View style={styles.tabsContainer}>
          {(['all', 'gear', 'skill', 'character'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.tabText, activeTab === tab && styles.activeTabText]}
              >
                {tab === 'all'
                  ? 'ALL'
                  : tab === 'gear'
                    ? 'GEARS'
                    : tab === 'skill'
                      ? 'SKILLS'
                      : 'CHARACTERS'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Item Grid / List ── */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItemCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* ── Purchase Feedback Modal ── */}
      <Modal
        visible={modalFeedback.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalFeedback({ ...modalFeedback, visible: false })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.cardWrapper}>
            <View style={styles.cardShadow} />
            <View
              style={[
                styles.modalContent,
                modalFeedback.success ? styles.modalSuccess : styles.modalError,
              ]}
            >
              <Text style={styles.modalTitle}>{modalFeedback.title}</Text>
              <Text style={styles.modalMessage}>{modalFeedback.message}</Text>
              <NeoButton
                style={styles.modalBtn}
                shadowStyle={styles.modalBtnShadow}
                onPress={() => setModalFeedback({ ...modalFeedback, visible: false })}
              >
                <Text style={styles.modalBtnText}>GOT IT</Text>
              </NeoButton>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff9f0',
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  bgSymbol: {
    position: 'absolute',
    fontSize: 60,
    fontWeight: '900',
    color: '#e5d9c4',
    opacity: 0.35,
    zIndex: 0,
  },
  cardWrapper: {
    width: '100%',
    marginBottom: 16,
    position: 'relative',
    zIndex: 5,
  },
  cardShadow: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 16,
  },
  cardContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#1a1008',
    padding: 16,
  },
  balanceCardContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#1a1008',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceInfo: {
    flexDirection: 'column',
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#7a6a55',
    letterSpacing: 1,
    marginBottom: 2,
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinIcon: {
    fontSize: 24,
    marginRight: 6,
  },
  coinText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1a1008',
  },
  addCoinBtn: {
    backgroundColor: '#f5a623',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1a1008',
  },
  addCoinText: {
    color: '#1a1008',
    fontWeight: '900',
    fontSize: 14,
  },
  tabsWrapper: {
    width: '100%',
    marginBottom: 16,
    position: 'relative',
    zIndex: 5,
  },
  tabsShadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 14,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#1a1008',
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#f5a623',
    borderWidth: 2,
    borderColor: '#1a1008',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#7a6a55',
  },
  activeTabText: {
    color: '#1a1008',
  },
  listContent: {
    paddingBottom: 32,
    zIndex: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemIcon: {
    fontSize: 36,
  },
  itemAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1a1008',
  },
  cardHeaderRight: {
    alignItems: 'flex-end',
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 2,
    marginBottom: 4,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '900',
  },
  categoryTag: {
    fontSize: 10,
    fontWeight: '900',
    color: '#7a6a55',
  },
  itemName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1a1008',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7a6a55',
    lineHeight: 18,
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  statBadge: {
    backgroundColor: '#fff9f0',
    color: '#1a1008',
    fontSize: 12,
    fontWeight: '900',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1a1008',
    overflow: 'hidden',
  },
  cardFooter: {
    marginTop: 4,
  },
  equippedBadgeBtn: {
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#1a1008',
    alignItems: 'center',
    justifyContent: 'center',
  },
  equippedBadgeText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 1,
  },
  unaffordableBadge: {
    backgroundColor: '#e2e8f0',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unaffordableText: {
    color: '#64748b',
    fontWeight: '900',
    fontSize: 13,
  },
  buyBtn: {
    backgroundColor: '#f5a623',
    borderWidth: 3,
    borderColor: '#1a1008',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buyBtnShadow: {
    backgroundColor: '#1a1008',
    borderRadius: 12,
  },
  buyBtnText: {
    color: '#1a1008',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  equipBtn: {
    backgroundColor: '#1a6cf5',
    borderWidth: 3,
    borderColor: '#1a1008',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  equipBtnShadow: {
    backgroundColor: '#1a1008',
    borderRadius: 12,
  },
  equipBtnText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.5,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26,16,8,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#1a1008',
  },
  modalSuccess: {
    borderLeftWidth: 8,
    borderLeftColor: '#22c55e',
  },
  modalError: {
    borderLeftWidth: 8,
    borderLeftColor: '#ef4444',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1a1008',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7a6a55',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  modalBtn: {
    backgroundColor: '#1a6cf5',
    borderWidth: 3,
    borderColor: '#1a1008',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  modalBtnShadow: {
    backgroundColor: '#1a1008',
    borderRadius: 12,
  },
  modalBtnText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 16,
  },
});
