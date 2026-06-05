import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../theme/colors';

interface NetworkScreenProps {
  isLandscape: boolean;
  onRefresh: () => void;
  isLoading: boolean;
  onBack: () => void;
}

export default function NetworkScreen({
  isLandscape,
  onRefresh,
  isLoading,
  onBack,
}: NetworkScreenProps) {
  return (
    <View style={styles.container}>
      {/* Ambient Background Blur Decoration */}
      <View style={styles.ambientBlobContainer}>
        <View style={styles.ambientBlobLeft} />
        <View style={styles.ambientBlobRight} />
      </View>

      {/* Top App Bar */}
      <View style={styles.topAppBar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Đăng ký CMS</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: isLandscape ? 110 : 130 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.networkContentWrapper}>
          {/* Header Title Section */}
          <View style={[styles.screenHeader, isLandscape && styles.screenHeaderLandscape]}>
            <Text style={[styles.screenMainTitle, isLandscape && styles.screenMainTitleLandscape]}>Mạng & Thiết bị</Text>
            <Text style={[styles.screenSubTitle, isLandscape && styles.screenSubTitleLandscape]}>
              Kiểm tra trạng thái kết nối và thông số kỹ thuật.
            </Text>
          </View>

          {/* Glassmorphic List Card */}
          <View style={styles.glassListCard}>
            {/* Status Row 1: Network Status */}
            <View style={[styles.listRow, isLandscape && styles.listRowLandscape]}>
              <View style={styles.listRowLeft}>
                <Text style={styles.listRowIcon}>📶</Text>
                <Text style={styles.listLabel}>Trạng thái mạng</Text>
              </View>
              <Text style={styles.listValue}>Wi-Fi</Text>
            </View>

            {/* Status Row 2: Local IP */}
            <View style={[styles.listRow, isLandscape && styles.listRowLandscape]}>
              <View style={styles.listRowLeft}>
                <Text style={styles.listRowIcon}>💻</Text>
                <Text style={styles.listLabel}>IP Cục bộ</Text>
              </View>
              <Text style={styles.listValue}>192.168.1.105</Text>
            </View>

            {/* Status Row 3: Network Type */}
            <View style={[styles.listRow, isLandscape && styles.listRowLandscape]}>
              <View style={styles.listRowLeft}>
                <Text style={styles.listRowIcon}>🔌</Text>
                <Text style={styles.listLabel}>Mạng</Text>
              </View>
              <Text style={styles.listValue}>Cáp quang</Text>
            </View>

            {/* Status Row 4: Server Connection */}
            <View style={[styles.listRow, isLandscape && styles.listRowLandscape]}>
              <View style={styles.listRowLeft}>
                <Text style={styles.listRowIcon}>🌐</Text>
                <Text style={styles.listLabel}>Kết nối Máy chủ</Text>
              </View>
              <View style={styles.statusIndicatorRow}>
                <View style={styles.statusIndicatorDot} />
                <Text style={styles.listValueGreen}>Đã kết nối</Text>
              </View>
            </View>

            {/* Status Row 5: XMPP Status */}
            <View style={[styles.listRow, isLandscape && styles.listRowLandscape, { borderBottomWidth: 0 }]}>
              <View style={styles.listRowLeft}>
                <Text style={styles.listRowIcon}>⚙️</Text>
                <Text style={styles.listLabel}>Dịch vụ XMPP</Text>
              </View>
              <Text style={styles.listValue}>Hoạt động</Text>
            </View>
          </View>

          {/* Refresh Action Button */}
          <TouchableOpacity
            style={[styles.btnRefresh, isLandscape && styles.btnRefreshLandscape]}
            activeOpacity={0.7}
            onPress={onRefresh}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.secondary} size="small" />
            ) : (
              <>
                <Text style={styles.btnRefreshIcon}>🔄</Text>
                <Text style={styles.btnRefreshText}>Làm mới dữ liệu</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  topAppBar: {
    height: 64,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15, 23, 42, 0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.03)',
  },
  backButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: -2,
  },
  appBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  scrollContainer: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  networkContentWrapper: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  screenHeader: {
    width: '100%',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  screenMainTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  screenSubTitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 6,
    lineHeight: 18,
  },
  glassListCard: {
    width: '100%',
    backgroundColor: colors.glassBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 4,
    overflow: 'hidden',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15, 23, 42, 0.05)',
  },
  listRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listRowIcon: {
    fontSize: 18,
    color: colors.textMuted,
  },
  listLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  listValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  listValueGreen: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.success,
  },
  statusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 3,
  },
  btnRefresh: {
    marginTop: 24,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 100,
    backgroundColor: 'rgba(116, 90, 54, 0.06)',
  },
  btnRefreshIcon: {
    fontSize: 14,
  },
  btnRefreshText: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: '700',
  },
  screenHeaderLandscape: {
    marginBottom: 10,
  },
  screenMainTitleLandscape: {
    fontSize: 20,
  },
  screenSubTitleLandscape: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 14,
  },
  listRowLandscape: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  btnRefreshLandscape: {
    marginTop: 12,
    paddingVertical: 8,
  },
});
