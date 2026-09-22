import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import AdventureView from '../../components/dungeon/AdventureView';
import OneVOneView from '../../components/dungeon/OneVOneView';
import RankView from '../../components/dungeon/RankView';
import VersusView from '../../components/dungeon/VersusView';
import TopBar from '../../components/TopBar';
import TouchableOpacity from '../../components/TouchableOpacity';
import { GameFonts } from '../../constants/theme';
import { soundService } from '../../services/soundService';

type DungeonTab = 'adventure' | 'versus' | 'rank' | '1v1';

interface SubTabItem {
  id: DungeonTab;
  label: string;
}

const SUB_TABS: SubTabItem[] = [
  { id: 'adventure', label: 'Adventure' },
  { id: 'versus', label: 'Versus' },
  { id: 'rank', label: 'Rank' },
  { id: '1v1', label: '1v1' },
];

export default function DungeonScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<DungeonTab>('adventure');

  useEffect(() => {
    if (params.tab && ['adventure', 'versus', 'rank', '1v1'].includes(params.tab)) {
      setActiveTab(params.tab as DungeonTab);
    }
  }, [params.tab]);

  // Handle hardware back to mirror TopBar back:
  // if in a subtab (versus, rank, 1v1), return to adventure; if in adventure, return to home
  useEffect(() => {
    const onHardwareBack = () => {
      if (activeTab !== 'adventure') {
        setActiveTab('adventure');
      } else {
        router.replace('/' as any);
      }
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [activeTab]);

  const handleTabPress = (tabId: DungeonTab) => {
    soundService.playSound('click');
    if (tabId !== activeTab) {
      setActiveTab(tabId);
    }
  };

  const handleTopBarBack = () => {
    if (activeTab !== 'adventure') {
      setActiveTab('adventure');
    } else {
      router.replace('/' as any);
    }
  };

  const getScreenTitle = () => {
    switch (activeTab) {
      case 'adventure':
        return 'ADVENTURE MAP';
      case 'versus':
        return 'VERSUS ARENA';
      case 'rank':
        return 'RANKED MATCH';
      case '1v1':
        return 'DIRECT 1V1';
      default:
        return 'DUNGEON';
    }
  };

  return (
    <View style={styles.container}>
      <TopBar title={getScreenTitle()} onBack={handleTopBarBack} />

      {/* Sub-view Content fills available space */}
      <View style={styles.contentContainer}>
        {activeTab === 'adventure' && <AdventureView />}
        {activeTab === 'versus' && <VersusView />}
        {activeTab === 'rank' && <RankView />}
        {activeTab === '1v1' && <OneVOneView />}
      </View>

      {/* Secondary Sub-Navigation Layer — Docked immediately above Bottom Navigation Bar */}
      <View style={styles.subnavDock}>
        {SUB_TABS.map((tab) => {
          const isSelected = activeTab === tab.id;

          return (
            <View key={tab.id} style={styles.subTabWrapper}>
              <View style={styles.subTabShadow} />
              <TouchableOpacity
                style={[
                  styles.subTabBtn,
                  isSelected ? styles.subTabBtnActive : styles.subTabBtnInactive,
                ]}
                onPress={() => handleTabPress(tab.id)}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff9f0',
  },
  contentContainer: {
    flex: 1,
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
    fontSize: 8.5,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  subTabLabelActive: {
    color: '#ffffff',
  },
  subTabLabelInactive: {
    color: '#7a6a55',
  },
});
