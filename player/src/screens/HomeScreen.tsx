import React from 'react';
import { StyleSheet, Text, View, Image, Dimensions, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const logoImage = require('../../assets/Logo-CDM-transparent.png');

interface HomeScreenProps {
  isLandscape: boolean;
  deviceId: string | null;
  deviceName: string;
  serverIp: string;
  serverPort: string;
}

export default function HomeScreen({ 
  isLandscape, 
  deviceId, 
  deviceName, 
  serverIp, 
  serverPort 
}: HomeScreenProps) {
  const isLinked = !!deviceId;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Ambient Background Decoration */}
      <View style={styles.ambientBlobContainer}>
        <View style={styles.ambientBlobLeft} />
        <View style={styles.ambientBlobRight} />
      </View>

      {/* Top Bar Logo Row */}
      <View style={[styles.headerRow, { top: isLandscape ? 12 : 36 }]}>
        <View style={styles.headerLeft}>
          <Image source={logoImage} style={styles.headerLogo} resizeMode="contain" />
          <Text style={styles.headerTitle}>
            CDM <Text style={styles.headerTitleAccent}>PREMIUM</Text>
          </Text>
        </View>
        <View style={[styles.statusPill, isLinked ? styles.statusPillLinked : styles.statusPillUnlinked]}>
          <View style={isLinked ? styles.statusDotGreen : styles.statusDotOrange} />
          <Text style={styles.statusText}>
            {isLinked ? 'Đang hoạt động' : 'Chưa liên kết'}
          </Text>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={[styles.middleContainer, isLandscape && styles.middleContainerLandscape]}>
        {isLinked ? (
          /* LINKED STATE: Active Welcome Screen */
          <View style={[styles.guideCard, isLandscape && styles.guideCardLandscape]}>
            <View style={styles.logoContainer}>
              <Image source={logoImage} style={styles.logoImage} resizeMode="contain" />
            </View>
            
            <Text style={styles.welcomeText}>Chào mừng bạn đến với</Text>
            <Text style={styles.brandTitle}>
              CDM <Text style={styles.brandTitleAccent}>SIGNAGE</Text>
            </Text>

            <View style={styles.activeStatusContainer}>
              <Text style={styles.activeStatusIcon}>✓</Text>
              <Text style={styles.activeStatusText}>
                Thiết bị đã được kích hoạt thành công. Đang kết nối trực tuyến và sẵn sàng nhận nội dung phát từ Web Dashboard.
              </Text>
            </View>
          </View>
        ) : (
          /* UNLINKED STATE: Guide/Instructions Card */
          <View style={[styles.guideCard, isLandscape && styles.guideCardLandscape]}>
            <View style={styles.logoContainer}>
              <Image source={logoImage} style={styles.logoImage} resizeMode="contain" />
            </View>
            
            <Text style={styles.welcomeText}>Chào mừng bạn đến với</Text>
            <Text style={styles.brandTitle}>
              CDM <Text style={styles.brandTitleAccent}>SIGNAGE</Text>
            </Text>

            <View style={styles.instructionContainer}>
              <Text style={styles.instructionIcon}>ℹ️</Text>
              <Text style={styles.instructionText}>
                Thiết bị này chưa được kích hoạt. Hãy bấm vào nút <Text style={{ fontWeight: 'bold', color: '#00b894' }}>REGISTER</Text> ở thanh menu bên dưới để kết nối màn hình với tài khoản CMS của bạn.
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070b13', // Deep premium dark background
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
  headerLogo: {
    width: 60,
    height: 20,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1,
  },
  headerTitleAccent: {
    color: '#00b894', // Emerald Green matching CDM logo
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 100,
    paddingVertical: 5,
    paddingHorizontal: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
  },
  statusPillLinked: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusPillUnlinked: {
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  statusDotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  statusDotOrange: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f59e0b',
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#a0aec0',
  },
  middleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    width: '100%',
    paddingHorizontal: 24,
  },
  middleContainerLandscape: {
    paddingHorizontal: 48,
  },
  
  /* LINKED UI STYLES */
  activeStatusContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(16, 185, 129, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginTop: 28,
    alignItems: 'flex-start',
    gap: 12,
  },
  activeStatusIcon: {
    fontSize: 18,
    color: '#10b981',
    fontWeight: 'bold',
  },
  activeStatusText: {
    flex: 1,
    fontSize: 12,
    color: '#8a99ad',
    lineHeight: 18,
  },

  /* UNLINKED UI STYLES */
  guideCard: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 480,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  guideCardLandscape: {
    maxWidth: 600,
    paddingVertical: 28,
  },
  logoContainer: {
    width: 240,
    height: 90,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    shadowColor: '#00b894',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  logoImage: {
    width: '90%',
    height: '90%',
  },
  welcomeText: {
    fontSize: 13,
    color: '#718096',
    marginTop: 24,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 6,
    letterSpacing: 2,
  },
  brandTitleAccent: {
    color: '#00b894',
  },
  instructionContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(245, 158, 11, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 28,
    alignItems: 'flex-start',
    gap: 12,
  },
  instructionIcon: {
    fontSize: 18,
    marginTop: 1,
  },
  instructionText: {
    flex: 1,
    fontSize: 12,
    color: '#8a99ad',
    lineHeight: 18,
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
    top: '10%',
    left: '-20%',
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(0, 184, 148, 0.08)',
  },
  ambientBlobRight: {
    position: 'absolute',
    top: '25%',
    right: '-25%',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(0, 206, 201, 0.06)',
  },
});
