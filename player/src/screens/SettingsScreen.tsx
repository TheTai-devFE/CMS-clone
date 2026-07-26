import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { colors } from '../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import ConfirmationModal from '../components/ConfirmationModal';
import { SettingsSections } from '../components/SettingsSections';

interface SettingsScreenProps {
  isLandscape: boolean;
  formIp: string;
  formPort: string;
  formName: string;
  onBack: () => void;
  onLogout: () => void;
  onClearProgram: () => Promise<void>;
}

export default function SettingsScreen({
  isLandscape,
  formIp,
  formPort,
  formName,
  onBack,
  onLogout,
  onClearProgram,
}: SettingsScreenProps) {
  // Settings States
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
  
  // Custom Confirmation States
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Load settings from AsyncStorage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
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

  const performClear = async () => {
    try {
      // Kiểm tra xem FileSystem có được hỗ trợ trên môi trường hiện tại không (ví dụ: Web)
      if (FileSystem.documentDirectory) {
        const mediaDir = FileSystem.documentDirectory + 'media/';
        await FileSystem.deleteAsync(mediaDir, { idempotent: true });
        await FileSystem.makeDirectoryAsync(mediaDir, { intermediates: true });
      }
      
      if (FileSystem.cacheDirectory) {
        const files = await FileSystem.readDirectoryAsync(FileSystem.cacheDirectory);
        for (const file of files) {
          await FileSystem.deleteAsync(FileSystem.cacheDirectory + file, { idempotent: true });
        }
      }
      
      if (onClearProgram) {
        await onClearProgram();
      }
      
      if (Platform.OS === 'web') {
        window.alert('Đã dừng chương trình và dọn dẹp bộ nhớ đệm!');
      } else {
        Alert.alert('Thành công', 'Đã dừng chương trình và dọn dẹp bộ nhớ đệm!');
      }
    } catch (err) {
      console.error('Lỗi khi dọn dẹp:', err);
      if (Platform.OS === 'web') {
        window.alert('Có lỗi xảy ra khi dọn dẹp hệ thống.');
      } else {
        Alert.alert('Lỗi', 'Có lỗi xảy ra khi dọn dẹp hệ thống.');
      }
    }
  };

  const handleLogoutWithConfirmation = () => {
    setShowConfirmLogout(true);
  };

  const handleClearProgramAndCache = () => {
    setShowConfirmClear(true);
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

          <SettingsSections
            isLandscape={isLandscape}
            storageLocation={storageLocation}
            breakpointEnabled={breakpointEnabled}
            usbOfflineFallback={usbOfflineFallback}
            usbPath={usbPath}
            sleepScheduleEnabled={sleepScheduleEnabled}
            sleepStartTime={sleepStartTime}
            sleepEndTime={sleepEndTime}
            securityUsePass={securityUsePass}
            securityPassVal={securityPassVal}
            onStorageChange={handleStorageChange}
            onBreakpointChange={handleBreakpointChange}
            onUsbFallbackChange={handleUsbFallbackChange}
            onUsbPathChange={handleUsbPathChange}
            onClearProgramAndCache={handleClearProgramAndCache}
            CustomSwitch={CustomSwitch}
          />

          {/* Section 7: Action Panel */}
          <View style={styles.dangerZoneContainer}>
            <TouchableOpacity
              style={styles.btnLogout}
              onPress={handleLogoutWithConfirmation}
              activeOpacity={0.8}
            >
              <Text style={styles.btnLogoutIcon}>🚪</Text>
              <Text style={styles.btnLogoutText}>Đăng xuất tài khoản thiết bị</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <ConfirmationModal
        visible={showConfirmLogout}
        title="Xác nhận đăng xuất"
        description="Bạn có chắc chắn muốn đăng xuất tài khoản thiết bị này không? Hành động này sẽ yêu cầu liên kết lại thiết bị."
        confirmText="ĐĂNG XUẤT"
        icon="🚪"
        onConfirm={() => {
          setShowConfirmLogout(false);
          onLogout();
        }}
        onCancel={() => setShowConfirmLogout(false)}
      />

      <ConfirmationModal
        visible={showConfirmClear}
        title="Xác nhận xóa"
        description="Bạn có chắc chắn muốn xóa toàn bộ chương trình đang phát, dọn dẹp bộ nhớ đệm và quay về màn hình chờ không?"
        confirmText="XÓA SẠCH"
        icon="🗑️"
        onConfirm={() => {
          setShowConfirmClear(false);
          performClear();
        }}
        onCancel={() => setShowConfirmClear(false)}
      />
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
