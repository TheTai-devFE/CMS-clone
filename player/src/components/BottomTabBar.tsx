import React from 'react';
import { StyleSheet, Text, TouchableOpacity, Animated, View } from 'react-native';
import { colors } from '../theme/colors';

interface BottomTabBarProps {
  activeTab: 'register' | 'settings' | 'network' | 'exit' | null;
  onTabPress: (tab: 'register' | 'settings' | 'network' | 'exit') => void;
  translateYAnim: Animated.Value;
  onInteraction: () => void;
}

export default function BottomTabBar({
  activeTab,
  onTabPress,
  translateYAnim,
  onInteraction,
}: BottomTabBarProps) {
  
  const handlePress = (tab: 'register' | 'settings' | 'network' | 'exit') => {
    onInteraction();
    onTabPress(tab);
  };

  return (
    <Animated.View
      style={[
        styles.tabBar,
        {
          transform: [{ translateY: translateYAnim }],
        },
      ]}
    >
      {/* Tab 1: Register */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => handlePress('register')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabIcon, activeTab === 'register' && styles.tabIconActive]}>
          👤
        </Text>
        <Text style={[styles.tabLabel, activeTab === 'register' && styles.tabLabelActive]}>
          Register
        </Text>
        {activeTab === 'register' && <View style={styles.activeTabIndicator} />}
      </TouchableOpacity>

      {/* Tab 2: Settings */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => handlePress('settings')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabIcon, activeTab === 'settings' && styles.tabIconActive]}>
          ⚙️
        </Text>
        <Text style={[styles.tabLabel, activeTab === 'settings' && styles.tabLabelActive]}>
          Settings
        </Text>
        {activeTab === 'settings' && <View style={styles.activeTabIndicator} />}
      </TouchableOpacity>

      {/* Tab 3: Network */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => handlePress('network')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabIcon, activeTab === 'network' && styles.tabIconActive]}>
          📶
        </Text>
        <Text style={[styles.tabLabel, activeTab === 'network' && styles.tabLabelActive]}>
          Network
        </Text>
        {activeTab === 'network' && <View style={styles.activeTabIndicator} />}
      </TouchableOpacity>

      {/* Tab 4: Exit */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => handlePress('exit')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabIcon, activeTab === 'exit' && styles.tabIconActive]}>
          🚪
        </Text>
        <Text style={[styles.tabLabel, activeTab === 'exit' && styles.tabLabelActive]}>
          Exit
        </Text>
        {activeTab === 'exit' && <View style={styles.activeTabIndicator} />}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 84,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.glassBackground,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    paddingHorizontal: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.03,
    shadowRadius: 24,
    elevation: 8,
    zIndex: 100,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
    paddingBottom: 6,
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.6,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  tabLabelActive: {
    color: colors.secondary,
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 12,
    width: 16,
    height: 2,
    backgroundColor: colors.secondary,
    borderRadius: 1,
  },
});
