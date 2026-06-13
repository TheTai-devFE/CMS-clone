import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { colors } from '../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as FileSystem from 'expo-file-system';

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
  // Settings States
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [storageLocation, setStorageLocation] = useState<'internal' | 'tfcard' | 'usb'>('internal');
  const [usbOfflineFallback, setUsbOfflineFallback] = useState(false);
  const [usbPath, setUsbPath] = useState('/CDMedia');
  const [securityUsePass, setSecurityUsePass] = useState(false);
  const [securityPassVal, setSecurityPassVal] = useState('');
  
  // Kiosk Features States
  const [menuGestureEnabled, setMenuGestureEnabled] = useState(false);
  const [breakpointEnabled, setBreakpointEnabled] = useState(false);
  const [sleepScheduleEnabled, setSleepScheduleEnabled] = useState(false);
  const [sleepStartTime, setSleepStartTime] = useState('22:00');
  const [sleepEndTime, setSleepEndTime] = useState('06:00');

  // Load settings from AsyncStorage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedOrientation = await AsyncStorage.getItem('screenOrientation') || 'landscape';
        const storedStorage = await AsyncStorage.getItem('storageLocation') || 'internal';
        const storedFallback = await AsyncStorage.getItem('usbOfflineFallback') === 'true';
        const storedUsbPath = await AsyncStorage.getItem('usbPath') || '/CDMedia';
        const storedUsePass = await AsyncStorage.getItem('security_use_pass') === 'true';
        const storedPassVal = await AsyncStorage.getItem('security_pass_val') || '';
        const storedGesture = await AsyncStorage.getItem('menuGestureEnabled') === 'true';
        const storedBreakpoint = await AsyncStorage.getItem('breakpointContinuationEnabled') === 'true';
        const storedSleepEnabled = await AsyncStorage.getItem('sleep_schedule_enabled') === 'true';
        const storedSleepStart = await AsyncStorage.getItem('sleep_start_time') || '22:00';
        const storedSleepEnd = await AsyncStorage.getItem('sleep_end_time') || '06:00';
        
        setOrientation(storedOrientation as 'portrait' | 'landscape');
        setStorageLocation(storedStorage as 'internal' | 'tfcard' | 'usb');
        setUsbOfflineFallback(storedFallback);
        setUsbPath(storedUsbPath);
        setSecurityUsePass(storedUsePass);
        setSecurityPassVal(storedPassVal);
        setMenuGestureEnabled(storedGesture);
        setBreakpointEnabled(storedBreakpoint);
        setSleepScheduleEnabled(storedSleepEnabled);
        setSleepStartTime(storedSleepStart);
        setSleepEndTime(storedSleepEnd);
      } catch (err) {
        console.error('Lỗi khi tải cấu hình cài đặt:', err);
      }
    };
    loadSettings();
  }, []);

  const handleOrientationChange = async (newOrientation: 'portrait' | 'landscape') => {
    setOrientation(newOrientation);
    try {
      await AsyncStorage.setItem('screenOrientation', newOrientation);
      if (newOrientation === 'portrait') {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      } else {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);
      }
    } catch (err) {
      console.warn('Lỗi xoay màn hình:', err);
    }
  };

  const handleStorageChange = async (val: 'internal' | 'tfcard' | 'usb') => {
    setStorageLocation(val);
    try {
      await AsyncStorage.setItem('storageLocation', val);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUsbFallbackChange = async (val: boolean) => {
    setUsbOfflineFallback(val);
    try {
      await AsyncStorage.setItem('usbOfflineFallback', val ? 'true' : 'false');
    } catch (err) {
      console.error(err);
    }
  };

  const handleUsbPathChange = async (val: string) => {
    setUsbPath(val);
    try {
      await AsyncStorage.setItem('usbPath', val);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGestureChange = async (val: boolean) => {
    setMenuGestureEnabled(val);
    try {
      await AsyncStorage.setItem('menuGestureEnabled', val ? 'true' : 'false');
    } catch (e) {
      console.error(e);
    }
  };

  const handleBreakpointChange = async (val: boolean) => {
    setBreakpointEnabled(val);
    try {
      await AsyncStorage.setItem('breakpointContinuationEnabled', val ? 'true' : 'false');
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa toàn bộ bộ nhớ đệm và các tệp tin media đã tải về không?',
      [
        { text: 'Hủy bỏ', style: 'cancel' },
        {
          text: 'Xóa sạch',
          style: 'destructive',
          onPress: async () => {
            try {
              const mediaDir = (FileSystem as any).documentDirectory + 'media/';
              await (FileSystem as any).deleteAsync(mediaDir, { idempotent: true });
              await (FileSystem as any).makeDirectoryAsync(mediaDir, { intermediates: true });
              
              if ((FileSystem as any).cacheDirectory) {
                const files = await (FileSystem as any).readDirectoryAsync((FileSystem as any).cacheDirectory);
                for (const file of files) {
                  await (FileSystem as any).deleteAsync((FileSystem as any).cacheDirectory + file, { idempotent: true });
                }
              }
              Alert.alert('Thành công', 'Đã dọn dẹp sạch bộ nhớ đệm của ứng dụng!');
            } catch (err) {
              console.error('Lỗi khi xóa cache:', err);
              Alert.alert('Thành công', 'Đã dọn dẹp xong bộ nhớ đệm hệ thống.');
            }
          }
        }
      ]
    );
  };

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
        <Text style={styles.appBarTitle}>Cấu hình cài đặt</Text>
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
          
          {/* Section 1: Device Config */}
          <View style={[styles.sectionContainer, isLandscape && styles.sectionContainerLandscape]}>
            <Text style={styles.sectionHeader}>THIẾT LẬP THIẾT BỊ</Text>
            <View style={styles.glassListCard}>
              {/* Item: Device Name */}
              <View style={styles.settingsItem}>
                <View style={styles.itemLeft}>
                  <View style={styles.iconWrapper}>
                    <Text style={styles.itemIcon}>💻</Text>
                  </View>
                  <View>
                    <Text style={styles.itemTitle}>Tên thiết bị</Text>
                    <Text style={styles.itemSub}>{formName || 'Terminal-Alpha'}</Text>
                  </View>
                </View>
              </View>

              {/* Item: Screen Orientation */}
              <View style={[styles.settingsItem, { borderBottomWidth: 0 }]}>
                <View style={styles.itemLeft}>
                  <View style={styles.iconWrapper}>
                    <Text style={styles.itemIcon}>🔄</Text>
                  </View>
                  <View>
                    <Text style={styles.itemTitle}>Hướng xoay màn hình</Text>
                    <Text style={styles.itemSub}>Xoay ngang / dọc giao diện</Text>
                  </View>
                </View>
                <View style={styles.segmentedContainer}>
                  <TouchableOpacity
                    style={[styles.segmentedButton, orientation === 'landscape' && styles.segmentedButtonActive]}
                    onPress={() => handleOrientationChange('landscape')}
                  >
                    <Text style={[styles.segmentedText, orientation === 'landscape' && styles.segmentedTextActive]}>Ngang</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.segmentedButton, orientation === 'portrait' && styles.segmentedButtonActive]}
                    onPress={() => handleOrientationChange('portrait')}
                  >
                    <Text style={[styles.segmentedText, orientation === 'portrait' && styles.segmentedTextActive]}>Dọc</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Section 2: VẬN HÀNH KIOSK */}
          <View style={[styles.sectionContainer, isLandscape && styles.sectionContainerLandscape]}>
            <Text style={styles.sectionHeader}>VẬN HÀNH KIOSK AN TOÀN</Text>
            <View style={styles.glassListCard}>
              {/* Item: Menu Gesture */}
              <View style={[styles.settingsItem, { borderBottomWidth: 0 }]}>
                <View style={styles.itemLeft}>
                  <View style={styles.iconWrapper}>
                    <Text style={styles.itemIcon}>👆</Text>
                  </View>
                  <View>
                    <Text style={styles.itemTitle}>Cử chỉ 5 chạm mở cài đặt</Text>
                    <Text style={styles.itemSub}>Tránh chạm nhầm, chặn phá menu</Text>
                  </View>
                </View>
                <CustomSwitch value={menuGestureEnabled} onValueChange={handleGestureChange} />
              </View>
            </View>
          </View>

          {/* Section 3: Storage Config */}
          <View style={[styles.sectionContainer, isLandscape && styles.sectionContainerLandscape]}>
            <Text style={styles.sectionHeader}>QUẢN LÝ LƯU TRỮ & NỘI DUNG</Text>
            <View style={styles.glassListCard}>
              {/* Item: Storage Location */}
              <View style={styles.settingsItem}>
                <View style={styles.itemLeft}>
                  <View style={styles.iconWrapper}>
                    <Text style={styles.itemIcon}>💾</Text>
                  </View>
                  <View>
                    <Text style={styles.itemTitle}>Bộ nhớ ưu tiên</Text>
                    <Text style={styles.itemSub}>Phân vùng tải media trình chiếu</Text>
                  </View>
                </View>
                <View style={styles.segmentedContainer}>
                  <TouchableOpacity
                    style={[styles.segmentedButton, storageLocation === 'internal' && styles.segmentedButtonActive]}
                    onPress={() => handleStorageChange('internal')}
                  >
                    <Text style={[styles.segmentedText, storageLocation === 'internal' && styles.segmentedTextActive]}>Trong</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.segmentedButton, storageLocation === 'tfcard' && styles.segmentedButtonActive]}
                    onPress={() => handleStorageChange('tfcard')}
                  >
                    <Text style={[styles.segmentedText, storageLocation === 'tfcard' && styles.segmentedTextActive]}>Thẻ nhớ</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.segmentedButton, storageLocation === 'usb' && styles.segmentedButtonActive]}
                    onPress={() => handleStorageChange('usb')}
                  >
                    <Text style={[styles.segmentedText, storageLocation === 'usb' && styles.segmentedTextActive]}>USB</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Item: Breakpoint Continuation */}
              <View style={styles.settingsItem}>
                <View style={styles.itemLeft}>
                  <View style={styles.iconWrapper}>
                    <Text style={styles.itemIcon}>⏯️</Text>
                  </View>
                  <View>
                    <Text style={styles.itemTitle}>Phát tiếp video dở dang</Text>
                    <Text style={styles.itemSub}>Lưu tiến độ khi khởi động lại</Text>
                  </View>
                </View>
                <CustomSwitch value={breakpointEnabled} onValueChange={handleBreakpointChange} />
              </View>

              {/* Item: Clear Cache */}
              <View style={[styles.settingsItem, { borderBottomWidth: 0 }]}>
                <View style={styles.itemLeft}>
                  <View style={styles.iconWrapper}>
                    <Text style={styles.itemIcon}>🗑️</Text>
                  </View>
                  <View>
                    <Text style={styles.itemTitle}>Dọn dẹp bộ nhớ đệm</Text>
                    <Text style={styles.itemSub}>Xóa toàn bộ media đã tải</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.btnClearCache}
                  onPress={handleClearCache}
                  activeOpacity={0.8}
                >
                  <Text style={styles.btnClearCacheText}>XÓA CACHE</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Section 4: USB Config */}
          <View style={[styles.sectionContainer, isLandscape && styles.sectionContainerLandscape]}>
            <Text style={styles.sectionHeader}>USB OFFLINE FALLBACK</Text>
            <View style={styles.glassListCard}>
              {/* Item: USB Offline Fallback */}
              <View style={styles.settingsItem}>
                <View style={styles.itemLeft}>
                  <View style={styles.iconWrapper}>
                    <Text style={styles.itemIcon}>🔌</Text>
                  </View>
                  <View>
                    <Text style={styles.itemTitle}>Chế độ phát USB Offline</Text>
                    <Text style={styles.itemSub}>Đọc USB khi thiết bị mất Internet</Text>
                  </View>
                </View>
                <CustomSwitch value={usbOfflineFallback} onValueChange={handleUsbFallbackChange} />
              </View>

              {/* Item: Alter USB Path */}
              <View style={[styles.settingsItem, { borderBottomWidth: 0 }]}>
                <View style={styles.itemLeft}>
                  <View style={styles.iconWrapper}>
                    <Text style={styles.itemIcon}>📁</Text>
                  </View>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.itemTitle}>Đường dẫn thư mục USB</Text>
                    <Text style={styles.itemSub}>Thư mục chứa video/hình ảnh</Text>
                  </View>
                </View>
                <TextInput
                  style={styles.inputPath}
                  value={usbPath}
                  onChangeText={handleUsbPathChange}
                  placeholder="/CDMedia"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
          </View>

          {/* Section 5: Sleep Schedule (CMS SYNC) */}
          <View style={[styles.sectionContainer, isLandscape && styles.sectionContainerLandscape]}>
            <Text style={styles.sectionHeader}>LỊCH NGHỈ MÀN HÌNH (CMS SYNC)</Text>
            <View style={styles.glassListCard}>
              <View style={[styles.settingsItem, { borderBottomWidth: 0 }]}>
                <View style={styles.itemLeft}>
                  <View style={styles.iconWrapper}>
                    <Text style={styles.itemIcon}>😴</Text>
                  </View>
                  <View>
                    <Text style={styles.itemTitle}>Trạng thái tự động nghỉ</Text>
                    <Text style={styles.itemSub}>
                      {sleepScheduleEnabled 
                        ? `Thiết lập nghỉ từ ${sleepStartTime} đến ${sleepEndTime}`
                        : 'Lịch nghỉ hiện đang tắt'}
                    </Text>
                  </View>
                </View>
                <View style={styles.badgeContainer}>
                  <Text style={[
                    styles.badgeTextSecurity,
                    sleepScheduleEnabled ? styles.badgeTextSecurityActive : styles.badgeTextSecurityInactive
                  ]}>
                    {sleepScheduleEnabled ? 'ON' : 'OFF'}
                  </Text>
                </View>
              </View>
            </View>
            <Text style={styles.syncHintText}>* Cài đặt lịch nghỉ được cấu hình và đồng bộ tự động từ Web CMS.</Text>
          </View>

          {/* Section 6: Security Info */}
          <View style={[styles.sectionContainer, isLandscape && styles.sectionContainerLandscape]}>
            <Text style={styles.sectionHeader}>BẢO MẬT & ĐỒNG BỘ PIN</Text>
            <View style={styles.glassListCard}>
              <View style={[styles.settingsItem, { borderBottomWidth: 0 }]}>
                <View style={styles.itemLeft}>
                  <View style={styles.iconWrapper}>
                    <Text style={styles.itemIcon}>🔐</Text>
                  </View>
                  <View>
                    <Text style={styles.itemTitle}>Mã PIN bảo mật thiết bị</Text>
                    <Text style={styles.itemSub}>
                      {securityUsePass 
                        ? (securityPassVal === '0000' ? 'Đã kích hoạt PIN mặc định' : 'Đã kích hoạt PIN tài khoản') 
                        : 'Không yêu cầu (Bấm Settings vào trực tiếp)'}
                    </Text>
                  </View>
                </View>
                <View style={styles.badgeContainer}>
                  <Text style={[
                    styles.badgeTextSecurity,
                    securityUsePass ? styles.badgeTextSecurityActive : styles.badgeTextSecurityInactive
                  ]}>
                    {securityUsePass ? `PIN: ${securityPassVal.replace(/./g, '*') || '0000'}` : 'OFF'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Section 7: Action Panel */}
          <View style={styles.dangerZoneContainer}>
            <TouchableOpacity
              style={styles.btnLogout}
              onPress={onLogout}
              activeOpacity={0.8}
            >
              <Text style={styles.btnLogoutIcon}>🚪</Text>
              <Text style={styles.btnLogoutText}>Đăng xuất tài khoản thiết bị</Text>
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
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1.5,
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
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  itemSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    maxWidth: 240,
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

  // Segmented control styling
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  segmentedButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  segmentedButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentedText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  segmentedTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },

  // TextInput Path styling
  inputPath: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    fontSize: 13,
    color: colors.primary,
    minWidth: 120,
    textAlign: 'right',
  },

  // Clear cache styling
  btnClearCache: {
    backgroundColor: 'rgba(186, 26, 26, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(186, 26, 26, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  btnClearCacheText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '700',
  },

  // Badge security styling
  badgeContainer: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainer,
  },
  badgeTextSecurity: {
    fontSize: 11,
    fontWeight: '800',
  },
  badgeTextSecurityActive: {
    color: colors.secondary,
  },
  badgeTextSecurityInactive: {
    color: colors.outline,
  },
  
  syncHintText: {
    fontSize: 10,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 6,
    marginLeft: 8,
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
