export type ItemCategory = 'character' | 'gear' | 'skill';

export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface ItemStats {
  attackBonus?: number;
  defenseBonus?: number;
  xpMultiplier?: number;
  cooldownReduction?: number;
  extraTimeSeconds?: number;
  scoreBonusPercent?: number;
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
}

export interface PurchaseResult {
  success: boolean;
  message: string;
  item?: ShopItem;
}
