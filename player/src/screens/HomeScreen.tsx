import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

interface HomeScreenProps {
  isLandscape: boolean;
}

export default function HomeScreen({ isLandscape }: HomeScreenProps) {
  return (
    <View style={styles.container}>
      {/* Ambient Background Decoration */}
      <View style={styles.ambientBlobContainer}>
        <View style={styles.ambientBlobLeft} />
        <View style={styles.ambientBlobRight} />
      </View>

      {/* Top Bar Logo Row */}
      <View style={[styles.headerRow, { top: isLandscape ? 12 : 36 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.brandCircleMini}>
            <Text style={styles.brandCircleMiniText}>∞</Text>
          </View>
          <Text style={styles.headerTitle}>
            AURA <Text style={styles.headerTitleAccent}>PREMIUM</Text>
          </Text>
        </View>
        <View style={styles.statusPill}>
          <View style={styles.statusDotGreen} />
          <Text style={styles.statusText}>Đang hoạt động</Text>
        </View>
      </View>

      {/* Middle Logo Container (Glassmorphic) */}
      <View style={styles.middleContainer}>
        <View style={styles.logoCircleContainer}>
          <Text style={styles.logoIcon}>∞</Text>
          <Text style={styles.logoText}>AURA</Text>
        </View>
        <Text style={styles.welcomeText}>Welcome to</Text>
        <Text style={styles.brandTitle}>THE ECOSYSTEM</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandCircleMini: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  brandCircleMiniText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: -2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1,
  },
  headerTitleAccent: {
    color: colors.secondary,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 100,
    paddingVertical: 5,
    paddingHorizontal: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
  },
  statusDotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  middleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    paddingHorizontal: 20,
  },
  logoCircleContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 6,
  },
  logoIcon: {
    fontSize: 54,
    color: colors.primary,
    fontWeight: '100',
    marginTop: -5,
  },
  logoText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 4,
    marginTop: -2,
  },
  welcomeText: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: 32,
    letterSpacing: 0.5,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 6,
    letterSpacing: 1.5,
  },
  ambientBlobContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    overflow: 'hidden',
  },
  ambientBlobLeft: {
    position: 'absolute',
    top: '15%',
    left: '-20%',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(254, 221, 179, 0.25)',
  },
  ambientBlobRight: {
    position: 'absolute',
    top: '30%',
    right: '-25%',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(213, 227, 253, 0.25)',
  },
});
