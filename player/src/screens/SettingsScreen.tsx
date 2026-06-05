import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors } from '../theme/colors';

interface SettingsScreenProps {
  isLandscape: boolean;
  formIp: string;
  formPort: string;
  formName: string;
  onBack: () => void;
  onLogout: () => void;
}

export default function SettingsScreen({
  isLandscape,
  formIp,
  formPort,
  formName,
  onBack,
  onLogout,
}: SettingsScreenProps) {
  // Switch states
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [updateEnabled, setUpdateEnabled] = useState(false);

  // Custom Toggle Switch Component
  const CustomSwitch = ({
    value,
    onValueChange,
  }: {
    value: boolean;
    onValueChange: (v: boolean) => void;
  }) => (
    <TouchableOpacity
      style={[
        styles.switchTrack,
        value ? styles.switchTrackActive : styles.switchTrackInactive,
      ]}
      onPress={() => onValueChange(!value)}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.switchKnob,
          value ? styles.switchKnobActive : styles.switchKnobInactive,
        ]}
      />
    </TouchableOpacity>
  );

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
        <Text style={styles.appBarTitle}>Cài đặt</Text>
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
        <View style={styles.settingsContentWrapper}>
          {/* Section: General */}
          <View style={[styles.sectionContainer, isLandscape && styles.sectionContainerLandscape]}>
            <Text style={styles.sectionHeader}>HỆ THỐNG</Text>
            <View style={styles.glassListCard}>
              {/* Item: IP Address */}
              <View style={styles.settingsItem}>
                <View style={styles.itemLeft}>
                  <View style={styles.iconWrapper}>
                    <Text style={styles.itemIcon}>🌐</Text>
                  </View>
                  <View>
                    <Text style={styles.itemTitle}>Địa chỉ IP</Text>
                    <Text style={styles.itemSub}>{formIp || '192.168.2.229'}</Text>
                  </View>
                </View>
                <Text style={styles.arrowIcon}>➔</Text>
              </View>

              {/* Item: Server */}
              <View style={styles.settingsItem}>
                <View style={styles.itemLeft}>
                  <View style={styles.iconWrapper}>
                    <Text style={styles.itemIcon}>🗄️</Text>
                  </View>
                  <View>
                    <Text style={styles.itemTitle}>Máy chủ</Text>
                    <Text style={styles.itemSub}>
                      {formIp ? `cms.cloud.net:${formPort}` : 'cms.cloud.net:3000'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.arrowIcon}>➔</Text>
              </View>

              {/* Item: Device Name */}
              <View style={[styles.settingsItem, { borderBottomWidth: 0 }]}>
                <View style={styles.itemLeft}>
                  <View style={styles.iconWrapper}>
                    <Text style={styles.itemIcon}>💻</Text>
                  </View>
                  <View>
                    <Text style={styles.itemTitle}>Tên thiết bị</Text>
                    <Text style={styles.itemSub}>{formName || 'Terminal-Alpha'}</Text>
                  </View>
                </View>
                <Text style={styles.arrowIcon}>➔</Text>
              </View>
            </View>
          </View>

          {/* Section: Function Settings */}
          <View style={[styles.sectionContainer, isLandscape && styles.sectionContainerLandscape]}>
            <Text style={styles.sectionHeader}>CHỨC NĂNG</Text>
            <View style={styles.glassListCard}>
              {/* Item: Background Sync */}
              <View style={styles.settingsItem}>
                <View style={styles.itemLeft}>
                  <View style={styles.iconWrapper}>
                    <Text style={styles.itemIcon}>🔄</Text>
                  </View>
                  <Text style={styles.itemTitle}>Đồng bộ nền</Text>
                </View>
                <CustomSwitch value={syncEnabled} onValueChange={setSyncEnabled} />
              </View>

              {/* Item: Notifications */}
              <View style={styles.settingsItem}>
                <View style={styles.itemLeft}>
                  <View style={styles.iconWrapper}>
                    <Text style={styles.itemIcon}>🔔</Text>
                  </View>
                  <Text style={styles.itemTitle}>Thông báo đẩy</Text>
                </View>
                <CustomSwitch value={notifEnabled} onValueChange={setNotifEnabled} />
              </View>

              {/* Item: Auto Update */}
              <View style={styles.settingsItem}>
                <View style={styles.itemLeft}>
                  <View style={styles.iconWrapper}>
                    <Text style={styles.itemIcon}>🚀</Text>
                  </View>
                  <Text style={styles.itemTitle}>Tự động cập nhật</Text>
                </View>
                <CustomSwitch value={updateEnabled} onValueChange={setUpdateEnabled} />
              </View>

              {/* Item: Diagnostics */}
              <View style={[styles.settingsItem, { borderBottomWidth: 0 }]}>
                <View style={styles.itemLeft}>
                  <View style={styles.iconWrapper}>
                    <Text style={styles.itemIcon}>🐛</Text>
                  </View>
                  <Text style={styles.itemTitle}>Gửi báo cáo lỗi</Text>
                </View>
                <Text style={styles.arrowIcon}>➔</Text>
              </View>
            </View>
          </View>

          {/* Danger Zone */}
          <View style={styles.dangerZoneContainer}>
            <TouchableOpacity
              style={styles.btnLogout}
              onPress={onLogout}
              activeOpacity={0.8}
            >
              <Text style={styles.btnLogoutIcon}>🚪</Text>
              <Text style={styles.btnLogoutText}>Đăng xuất tài khoản</Text>
            </TouchableOpacity>
          </View>
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
  settingsContentWrapper: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  sectionContainer: {
    marginBottom: 28,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.2,
    marginLeft: 8,
    marginBottom: 8,
  },
  glassListCard: {
    width: '100%',
    backgroundColor: colors.glassBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 4,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15, 23, 42, 0.05)',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIcon: {
    fontSize: 16,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  itemSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  arrowIcon: {
    fontSize: 14,
    color: colors.outline,
    opacity: 0.5,
  },
  
  // Custom Switch styling
  switchTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  switchTrackActive: {
    backgroundColor: colors.secondary,
  },
  switchTrackInactive: {
    backgroundColor: '#e0e3e5',
  },
  switchKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  switchKnobActive: {
    alignSelf: 'flex-end',
  },
  switchKnobInactive: {
    alignSelf: 'flex-start',
  },

  // Danger zone
  dangerZoneContainer: {
    marginTop: 8,
    marginBottom: 20,
  },
  btnLogout: {
    width: '100%',
    height: 52,
    backgroundColor: colors.errorContainer,
    borderWidth: 1,
    borderColor: 'rgba(186, 26, 26, 0.15)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnLogoutIcon: {
    fontSize: 16,
  },
  btnLogoutText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '700',
  },
  sectionContainerLandscape: {
    marginBottom: 14,
  },
});
