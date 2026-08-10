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
import { GameFonts } from '../constants/theme';
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
              {item.stats.extraHearts ? (
                <Text style={styles.statBadge}>❤️ +{item.stats.extraHearts} HEART{item.stats.extraHearts > 1 ? 'S' : ''}</Text>
              ) : null}
              {item.stats.extraTimeSeconds ? (
                <Text style={styles.statBadge}>⏳ +{item.stats.extraTimeSeconds}s / Q</Text>
              ) : null}
              {item.stats.startShield ? (
                <Text style={styles.statBadge}>🛡️ FREE SHIELD</Text>
              ) : null}
              {item.stats.attackBonus ? (
                <Text style={styles.statBadge}>⚔️ +{item.stats.attackBonus} ATK</Text>
              ) : null}
              {item.stats.defenseBonus ? (
                <Text style={styles.statBadge}>🛡️ +{item.stats.defenseBonus} DEF</Text>
              ) : null}
              {item.stats.xpMultiplier ? (
                <Text style={styles.statBadge}>⭐ {item.stats.xpMultiplier}x XP BOOST</Text>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    position: 'relative',
  },
  bgSymbol: {
    fontFamily: GameFonts.impact,
    position: 'absolute',
    fontSize: 60,
    color: '#e5d9c4',
    opacity: 0.3,
    zIndex: 0,
  },
  cardWrapper: {
    position: 'relative',
    marginBottom: 16,
    zIndex: 1,
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
  cardHeader: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 12,
  },
  cardHeaderRight: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
  },
  itemAvatarImage: {
    width: 44,
    height: 44,
  },
  itemIcon: {
    fontFamily: GameFonts.brawl,
    fontSize: 32,
  },
  itemImageWrapper: {
    position: 'relative',
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: '#1a1008',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemImage: {
    width: 48,
    height: 48,
  },
  itemDetails: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1.5,
  },
  rarityText: {
    fontFamily: GameFonts.hud,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  categoryTag: {
    fontFamily: GameFonts.hud,
    fontSize: 10,
    color: '#7a6a55',
    letterSpacing: 1,
  },
  itemName: {
    fontFamily: GameFonts.brawl,
    fontSize: 18,
    color: '#1a1008',
    marginBottom: 4,
  },
  itemDescription: {
    fontFamily: GameFonts.hud,
    fontSize: 13,
    color: '#7a6a55',
    lineHeight: 18,
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  statBadge: {
    fontFamily: GameFonts.brawl,
    fontSize: 12,
    color: '#1a1008',
    backgroundColor: '#fff9f0',
    borderWidth: 2,
    borderColor: '#1a1008',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  cardFooter: {
    marginTop: 4,
  },
  buyBtn: {
    backgroundColor: '#22c55e',
    borderWidth: 3,
    borderColor: '#1a1008',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buyBtnShadow: {
    backgroundColor: '#1a1008',
    borderRadius: 12,
  },
  buyBtnText: {
    fontFamily: GameFonts.brawl,
    color: '#ffffff',
    fontSize: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  equipBtn: {
    backgroundColor: '#1a6cf5',
    borderWidth: 3,
    borderColor: '#1a1008',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  equipBtnShadow: {
    backgroundColor: '#1a1008',
    borderRadius: 12,
  },
  equipBtnText: {
    fontFamily: GameFonts.brawl,
    color: '#ffffff',
    fontSize: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  equippedBadgeBtn: {
    backgroundColor: '#f5a623',
    borderWidth: 3,
    borderColor: '#1a1008',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  equippedBadgeText: {
    fontFamily: GameFonts.brawl,
    color: '#1a1008',
    fontSize: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  unaffordableBadge: {
    backgroundColor: '#e2e8f0',
    borderWidth: 3,
    borderColor: '#94a3b8',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  unaffordableText: {
    fontFamily: GameFonts.brawl,
    color: '#64748b',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceCardContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#1a1008',
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceInfo: {
    gap: 2,
  },
  balanceLabel: {
    fontFamily: GameFonts.hud,
    fontSize: 10,
    color: '#7a6a55',
    letterSpacing: 1,
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coinIcon: {
    fontSize: 24,
  },
  coinText: {
    fontFamily: GameFonts.arcade,
    fontSize: 18,
    color: '#1a1008',
  },
  addCoinBtn: {
    backgroundColor: '#f5a623',
    borderWidth: 2.5,
    borderColor: '#1a1008',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addCoinText: {
    fontFamily: GameFonts.brawl,
    fontSize: 13,
    color: '#1a1008',
  },
  tabsWrapper: {
    position: 'relative',
    marginBottom: 16,
    zIndex: 1,
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
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#1a6cf5',
  },
  tabText: {
    fontFamily: GameFonts.brawl,
    fontSize: 11,
    color: '#7a6a55',
    letterSpacing: 0.5,
  },
  activeTabText: {
    color: '#ffffff',
  },
  listContent: {
    paddingBottom: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 16, 8, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#1a1008',
    padding: 24,
    alignItems: 'center',
    maxWidth: 340,
    width: '100%',
  },
  modalSuccess: {
    backgroundColor: '#ffffff',
  },
  modalError: {
    backgroundColor: '#fff5f5',
  },
  modalTitle: {
    fontFamily: GameFonts.brawl,
    fontSize: 16,
    color: '#1a1008',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontFamily: GameFonts.hud,
    fontSize: 14,
    color: '#7a6a55',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalBtn: {
    backgroundColor: '#1a6cf5',
    borderWidth: 3,
    borderColor: '#1a1008',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBtnShadow: {
    backgroundColor: '#1a1008',
    borderRadius: 12,
  },
  modalBtnText: {
    fontFamily: GameFonts.brawl,
    color: '#ffffff',
    fontSize: 14,
    letterSpacing: 1,
  },
});
