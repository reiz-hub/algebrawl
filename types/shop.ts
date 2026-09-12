export type ItemCategory = 'character' | 'gear' | 'skill';

export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface ItemStats {
  attackBonus?: number;
  defenseBonus?: number;
  xpMultiplier?: number;
  cooldownReduction?: number;
  extraTimeSeconds?: number;
  scoreBonusPercent?: number;
  extraHearts?: number;
  startShield?: boolean;
}

export interface ShopItem {
  id: string;
  name: string;
  category: ItemCategory;
  cost: number;
  description: string;
  rarity: ItemRarity;
  icon?: string;
  image?: any;
  stats?: ItemStats;
  /** Whether the item is consumable (consumed upon use in battle, can buy as many as wanted). */
  isConsumable?: boolean;
  /** Minimum player level required to unlock / purchase the item */
  unlockLevel?: number;
}

export interface PurchaseResult {
  success: boolean;
  message: string;
  item?: ShopItem;
}
