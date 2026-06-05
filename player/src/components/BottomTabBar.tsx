import React from 'react';
import { StyleSheet, Text, Pressable, Animated, View } from 'react-native';
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
      <Pressable
        focusable={true}
        hasTVPreferredFocus={activeTab === 'register' || activeTab === null}
        style={({ focused }) => [
          styles.tabItem,
          focused && styles.tabItemFocused
        ]}
        onPress={() => handlePress('register')}
        onFocus={onInteraction}
      >
        {({ focused }) => (
          <View style={styles.tabItemContent}>
            <Text style={[
              styles.tabIcon, 
              (activeTab === 'register' || focused) && styles.tabIconActive
            ]}>
              👤
            </Text>
            <Text style={[
              styles.tabLabel, 
              (activeTab === 'register' || focused) && styles.tabLabelActive
            ]}>
              Register
            </Text>
            {activeTab === 'register' && <View style={styles.activeTabIndicator} />}
          </View>
        )}
      </Pressable>

      {/* Tab 2: Settings */}
      <Pressable
        focusable={true}
        hasTVPreferredFocus={activeTab === 'settings'}
        style={({ focused }) => [
          styles.tabItem,
          focused && styles.tabItemFocused
        ]}
        onPress={() => handlePress('settings')}
        onFocus={onInteraction}
      >
        {({ focused }) => (
          <View style={styles.tabItemContent}>
            <Text style={[
              styles.tabIcon, 
              (activeTab === 'settings' || focused) && styles.tabIconActive
            ]}>
              ⚙️
            </Text>
            <Text style={[
              styles.tabLabel, 
              (activeTab === 'settings' || focused) && styles.tabLabelActive
            ]}>
              Settings
            </Text>
            {activeTab === 'settings' && <View style={styles.activeTabIndicator} />}
          </View>
        )}
      </Pressable>

      {/* Tab 3: Network */}
      <Pressable
        focusable={true}
        hasTVPreferredFocus={activeTab === 'network'}
        style={({ focused }) => [
          styles.tabItem,
          focused && styles.tabItemFocused
        ]}
        onPress={() => handlePress('network')}
        onFocus={onInteraction}
      >
        {({ focused }) => (
          <View style={styles.tabItemContent}>
            <Text style={[
              styles.tabIcon, 
              (activeTab === 'network' || focused) && styles.tabIconActive
            ]}>
              📶
            </Text>
            <Text style={[
              styles.tabLabel, 
              (activeTab === 'network' || focused) && styles.tabLabelActive
            ]}>
              Network
            </Text>
            {activeTab === 'network' && <View style={styles.activeTabIndicator} />}
          </View>
        )}
      </Pressable>

      {/* Tab 4: Exit */}
      <Pressable
        focusable={true}
        hasTVPreferredFocus={activeTab === 'exit'}
        style={({ focused }) => [
          styles.tabItem,
          focused && styles.tabItemFocused
        ]}
        onPress={() => handlePress('exit')}
        onFocus={onInteraction}
      >
        {({ focused }) => (
          <View style={styles.tabItemContent}>
            <Text style={[
              styles.tabIcon, 
              (activeTab === 'exit' || focused) && styles.tabIconActive
            ]}>
              🚪
            </Text>
            <Text style={[
              styles.tabLabel, 
              (activeTab === 'exit' || focused) && styles.tabLabelActive
            ]}>
              Exit
            </Text>
            {activeTab === 'exit' && <View style={styles.activeTabIndicator} />}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 16,
    left: 24,
    right: 24,
    height: 72,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 15, 29, 0.85)', // Dark glassmorphic background
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 100,
  },
  tabItem: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    marginVertical: 4,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabItemContent: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingBottom: 6,
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.5,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#00b894', // Emerald green to match CDM logo
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 8,
    width: 20,
    height: 3,
    backgroundColor: '#00b894',
    borderRadius: 1.5,
  },
  tabItemFocused: {
    backgroundColor: 'rgba(0, 184, 148, 0.15)', // Sáng lên tông màu xanh lá khi được focus bằng D-Pad
    borderColor: 'rgba(0, 184, 148, 0.4)',
  },
});
