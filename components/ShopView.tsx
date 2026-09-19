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
import { Feather } from '@expo/vector-icons';
import { SHOP_ITEMS } from '../constants/shopItems';
import { GameFonts } from '../constants/theme';
import { useGameStore } from '../hooks/useGameStore';
import { ItemCategory, ItemRarity, ShopItem } from '../types/shop';
import NeoButton from './NeoButton';
import SketchBorder from './SketchBorder';

const LOCK_IMAGE = require('../assets/icons/UI_icons/lock.png');

const SHOP_TABS: { id: 'all' | ItemCategory; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { id: 'all', label: 'ALL', icon: 'grid' },
  { id: 'gear', label: 'GEARS', icon: 'tool' },
  { id: 'skill', label: 'SKILLS', icon: 'zap' },
  { id: 'character', label: 'CHARACTERS', icon: 'user' },
];

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
  const skillStocks = useGameStore((state) => state.skillStocks);
  const unlockedLevel = useGameStore((state) => state.unlockedLevel || 1);

  const buyItem = useGameStore((state) => state.buyItem);
  const equipItem = useGameStore((state) => state.equipItem);

  const [activeTab, setActiveTab] = useState<'all' | ItemCategory>('all');
  const [modalFeedback, setModalFeedback] = useState<{
    visible: boolean;
    title: string;
    message: string;
    success: boolean;
    isLocked?: boolean;
  }>({
    visible: false,
    title: '',
    message: '',
    success: false,
    isLocked: false,
  });

  const filteredItems = SHOP_ITEMS.filter((item) => {
    // Exclude free default items (given, not purchasable)
    if (item.cost === 0) return false;
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
      isLocked: false,
    });
  };

  const handleLockedPress = (item: ShopItem) => {
    const reqLevel = item.unlockLevel ?? 1;
    setModalFeedback({
      visible: true,
      title: 'ITEM LOCKED',
      message: `Reach Level ${reqLevel} in Adventure Mode to unlock ${item.name} for purchase! (Your current level: Level ${unlockedLevel}).`,
      success: false,
      isLocked: true,
    });
  };

  const handleEquip = (item: ShopItem) => {
    equipItem(item.id);
  };

  const renderItemCard = ({ item }: { item: ShopItem }) => {
    const isOwned = inventory.includes(item.id);
    const isConsumableSkill = item.category === 'skill' && !!item.isConsumable;
    const skillStock = isConsumableSkill ? (skillStocks[item.id] ?? 0) : 0;
    const reqLevel = item.unlockLevel ?? 1;
    const isLevelLocked = !isOwned && unlockedLevel < reqLevel;
    const isLocked = isConsumableSkill ? unlockedLevel < reqLevel : isLevelLocked;

    let isEquipped = false;
    if (item.category === 'character') isEquipped = equippedCharacter === item.id;
    else if (item.category === 'gear') isEquipped = equippedGear === item.id;

    const canAfford = coins >= item.cost;
    const rarityStyle = RARITY_COLORS[item.rarity];

    return (
      <View style={styles.cardWrapper}>
        <SketchBorder style={[styles.cardContent, isLocked && styles.cardContentLocked]}>
          {/* Header Row */}
          <View style={styles.cardHeader}>
            <View style={styles.imageContainer}>
              {item.image ? (
                <Image
                  source={item.image}
                  style={[styles.itemAvatarImage, isLocked && styles.imageLocked]}
                  resizeMode="contain"
                />
              ) : (
                <Text style={[styles.itemIcon, isLocked && styles.imageLocked]}>
                  {item.icon || '🛍️'}
                </Text>
              )}
              {isLocked && (
                <Image
                  source={LOCK_IMAGE}
                  style={styles.lockOverlayImage}
                  resizeMode="contain"
                />
              )}
            </View>

            <View style={styles.cardHeaderRight}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
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

                {/* Level Requirement Badge */}
                {isOwned ? (
                  <View style={styles.ownedBadge}>
                    <Text style={styles.ownedBadgeText}>✓ UNLOCKED</Text>
                  </View>
                ) : isLocked ? (
                  <View style={styles.levelReqBadgeLocked}>
                    <Text style={styles.levelReqTextLocked}>LVL {reqLevel}</Text>
                  </View>
                ) : (
                  <View style={styles.levelReqBadgeUnlocked}>
                    <Feather name="check" size={9} color="#16a34a" />
                    <Text style={styles.levelReqTextUnlocked}>LVL {reqLevel}</Text>
                  </View>
                )}

                {isConsumableSkill && isOwned && (
                  <View style={[
                    styles.rarityBadge,
                    {
                      backgroundColor: skillStock > 0 ? '#dcfce7' : '#fee2e2',
                      borderColor: '#1a1008',
                    },
                  ]}>
                    <Text style={[
                      styles.rarityText,
                      { color: skillStock > 0 ? '#16a34a' : '#dc2626' },
                    ]}>
                      {`STOCK: ${skillStock} 🎯`}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.categoryTag}>{item.category.toUpperCase()}</Text>
            </View>
          </View>

          {/* Details */}
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemDescription}>{item.description}</Text>

          {/* Consumable indicator */}
          {isConsumableSkill && (
            <Text style={{
              fontFamily: GameFonts.hud,
              fontSize: 11,
              color: '#7a6a55',
              marginBottom: 8,
              fontStyle: 'italic',
            }}>
              ⚔️ Consumable • 1 use per purchase
            </Text>
          )}

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
            {isConsumableSkill ? (
              // Consumable skill buttons
              isLocked ? (
                <TouchableOpacity
                  style={styles.lockedBtn}
                  onPress={() => handleLockedPress(item)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.lockedBtnText}>UNLOCKS AT LEVEL {reqLevel}</Text>
                </TouchableOpacity>
              ) : canAfford ? (
                <NeoButton
                  style={styles.buyBtn}
                  shadowStyle={styles.buyBtnShadow}
                  onPress={() => handleBuy(item)}
                >
                  <Text style={styles.buyBtnText}>
                    {isOwned ? `BUY MORE 🪙 ${item.cost}` : `BUY 🪙 ${item.cost}`}
                  </Text>
                </NeoButton>
              ) : (
                <View style={styles.unaffordableBadge}>
                  <Text style={styles.unaffordableText}>
                    NEED 🪙 {item.cost - coins} MORE
                  </Text>
                </View>
              )
            ) : isEquipped ? (
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
            ) : isLocked ? (
              // Gear & Characters: Locked and unpurchasable if level requirements are not met
              <TouchableOpacity
                style={styles.lockedBtn}
                onPress={() => handleLockedPress(item)}
                activeOpacity={0.8}
              >
                <Text style={styles.lockedBtnText}>UNLOCKS AT LEVEL {reqLevel}</Text>
              </TouchableOpacity>
            ) : canAfford ? (
              // Gear becomes purchasable only when meeting BOTH level AND coin requirements!
              <NeoButton
                style={styles.buyBtn}
                shadowStyle={styles.buyBtnShadow}
                onPress={() => handleBuy(item)}
              >
                <Text style={styles.buyBtnText}>BUY 🪙 {item.cost}</Text>
              </NeoButton>
            ) : (
              // Meets level requirement, but needs more coins
              <View style={styles.unaffordableBadge}>
                <Text style={styles.unaffordableText}>
                  NEED 🪙 {item.cost - coins} MORE
                </Text>
              </View>
            )}
          </View>
        </SketchBorder>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        {/* Floating Background Symbols */}
        <Text style={[styles.bgSymbol, { top: '3%', left: '8%', transform: [{ rotate: '-10deg' }] }]}>-</Text>
        <Text style={[styles.bgSymbol, { top: '22%', right: '12%', transform: [{ rotate: '20deg' }] }]}>x²</Text>
        <Text style={[styles.bgSymbol, { bottom: '25%', left: '15%', transform: [{ rotate: '-15deg' }] }]}>+</Text>
        <Text style={[styles.bgSymbol, { bottom: '5%', right: '10%', transform: [{ rotate: '10deg' }] }]}>÷</Text>


        {/* ── Item Grid / List ── */}
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItemCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          style={styles.flatList}
        />
      </View>

      {/* ── Secondary Sub-Navigation Layer — Docked immediately above Bottom Navigation Bar ── */}
      <View style={styles.subnavDock}>
        {SHOP_TABS.map((tab) => {
          const isSelected = activeTab === tab.id;
          const isGear = tab.id === 'gear';
          const isSkill = tab.id === 'skill';

          return (
            <View
              key={tab.id}
              style={[
                styles.subTabWrapper,
                isGear && styles.subTabWrapperMiddle1,
                isSkill && styles.subTabWrapperMiddle2,
              ]}
            >
              <View
                style={[
                  styles.subTabShadow,
                  isGear && styles.curveBottomRight,
                  isSkill && styles.curveBottomLeft,
                ]}
              />
              <TouchableOpacity
                style={[
                  styles.subTabBtn,
                  isSelected ? styles.subTabBtnActive : styles.subTabBtnInactive,
                  isGear && styles.curveBottomRight,
                  isSkill && styles.curveBottomLeft,
                ]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.subTabLabel,
                    isSelected ? styles.subTabLabelActive : styles.subTabLabelInactive,
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

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
              {modalFeedback.isLocked && (
                <Image source={LOCK_IMAGE} style={styles.modalLockImage} resizeMode="contain" />
              )}
              <Text
                style={[
                  styles.modalTitle,
                  modalFeedback.isLocked
                    ? styles.modalTitleLocked
                    : modalFeedback.success
                    ? styles.modalTitleSuccess
                    : styles.modalTitleError,
                ]}
              >
                {modalFeedback.title}
              </Text>
              {/* Type indicator divider */}
              <View
                style={[
                  styles.modalDivider,
                  modalFeedback.isLocked
                    ? styles.modalDividerLocked
                    : modalFeedback.success
                    ? styles.modalDividerSuccess
                    : styles.modalDividerError,
                ]}
              />
              <Text style={styles.modalMessage}>{modalFeedback.message}</Text>
              <View style={styles.modalBtnWrapper}>
                <View style={styles.modalBtnShadow} />
                <TouchableOpacity
                  style={styles.modalBtn}
                  activeOpacity={0.8}
                  onPress={() => setModalFeedback({ ...modalFeedback, visible: false })}
                >
                  <Text style={styles.modalBtnText}>GOT IT</Text>
                </TouchableOpacity>
              </View>
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
    position: 'relative',
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  flatList: {
    flex: 1,
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
    top: 3,
    left: 3,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 16,
  },
  cardContent: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 16,
  },
  cardContentLocked: {
    backgroundColor: '#faf8f5',
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
  imageContainer: {
    position: 'relative',
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemAvatarImage: {
    width: 44,
    height: 44,
  },
  imageLocked: {
    opacity: 0.35,
  },
  lockOverlayImage: {
    position: 'absolute',
    width: 26,
    height: 26,
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
  levelReqBadgeLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#1a1008',
    backgroundColor: '#fee2e2',
  },
  badgeLockImage: {
    width: 12,
    height: 12,
  },
  levelReqTextLocked: {
    fontFamily: GameFonts.hud,
    fontSize: 10,
    fontWeight: '700',
    color: '#dc2626',
    letterSpacing: 0.5,
  },
  levelReqBadgeUnlocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#1a1008',
    backgroundColor: '#dcfce7',
  },
  levelReqTextUnlocked: {
    fontFamily: GameFonts.hud,
    fontSize: 10,
    fontWeight: '700',
    color: '#16a34a',
    letterSpacing: 0.5,
  },
  ownedBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#1a1008',
    backgroundColor: '#fef3c7',
  },
  ownedBadgeText: {
    fontFamily: GameFonts.hud,
    fontSize: 10,
    fontWeight: '700',
    color: '#b45309',
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
  lockedBtn: {
    backgroundColor: '#f1f5f9',
    borderWidth: 2.5,
    borderColor: '#94a3b8',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedBtnText: {
    fontFamily: GameFonts.brawl,
    color: '#64748b',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  btnLockImage: {
    width: 17,
    height: 17,
    marginRight: 6,
  },
  modalLockImage: {
    width: 54,
    height: 54,
    marginBottom: 12,
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
  subnavDock: {
    backgroundColor: '#fff9f0',
    borderTopWidth: 2,
    borderTopColor: '#1a1008',
    paddingHorizontal: 10,
    paddingTop: 5,
    paddingBottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subTabWrapper: {
    flex: 1,
    position: 'relative',
  },
  subTabWrapperMiddle1: {
    marginRight: 8,
  },
  subTabWrapperMiddle2: {
    marginLeft: 8,
  },
  curveBottomRight: {
    borderBottomRightRadius: 20,
  },
  curveBottomLeft: {
    borderBottomLeftRadius: 20,
  },
  subTabShadow: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 8,
  },
  subTabBtn: {
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#1a1008',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTabBtnActive: {
    backgroundColor: '#e8302a',
  },
  subTabBtnInactive: {
    backgroundColor: '#ffffff',
  },
  subTabLabel: {
    fontFamily: GameFonts.brawl,
    fontSize: 8,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  subTabLabelActive: {
    color: '#ffffff',
  },
  subTabLabelInactive: {
    color: '#7a6a55',
  },
  listContent: {
    paddingBottom: 24,
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
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  modalTitleSuccess: {
    color: '#16a34a',
  },
  modalTitleError: {
    color: '#e8302a',
  },
  modalTitleLocked: {
    color: '#b45309',
  },
  modalDivider: {
    width: 48,
    height: 4,
    borderRadius: 2,
    marginBottom: 14,
  },
  modalDividerSuccess: {
    backgroundColor: '#22c55e',
  },
  modalDividerError: {
    backgroundColor: '#e8302a',
  },
  modalDividerLocked: {
    backgroundColor: '#f5a623',
  },
  modalMessage: {
    fontFamily: GameFonts.hud,
    fontSize: 14,
    color: '#7a6a55',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalBtnWrapper: {
    position: 'relative',
    alignSelf: 'stretch',
  },
  modalBtnShadow: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: -2,
    bottom: -2,
    backgroundColor: '#1a1008',
    borderRadius: 12,
  },
  modalBtn: {
    backgroundColor: '#1a6cf5',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalBtnText: {
    fontFamily: GameFonts.brawl,
    color: '#ffffff',
    fontSize: 14,
    letterSpacing: 1,
  },
});
