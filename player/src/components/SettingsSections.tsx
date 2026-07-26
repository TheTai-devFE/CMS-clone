import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';

interface SettingsSectionsProps {
  isLandscape?: boolean;
  storageLocation: 'internal' | 'tfcard' | 'usb';
  breakpointEnabled: boolean;
  usbOfflineFallback: boolean;
  usbPath: string;
  sleepScheduleEnabled: boolean;
  sleepStartTime: string;
  sleepEndTime: string;
  securityUsePass: boolean;
  securityPassVal: string;
  onStorageChange: (val: 'internal' | 'tfcard' | 'usb') => void;
  onBreakpointChange: (val: boolean) => void;
  onUsbFallbackChange: (val: boolean) => void;
  onUsbPathChange: (val: string) => void;
  onClearProgramAndCache: () => void;
  CustomSwitch: React.FC<{ value: boolean; onValueChange: (v: boolean) => void }>;
}

export const SettingsSections: React.FC<SettingsSectionsProps> = ({
  isLandscape,
  storageLocation,
  breakpointEnabled,
  usbOfflineFallback,
  usbPath,
  sleepScheduleEnabled,
  sleepStartTime,
  sleepEndTime,
  securityUsePass,
  securityPassVal,
  onStorageChange,
  onBreakpointChange,
  onUsbFallbackChange,
  onUsbPathChange,
  onClearProgramAndCache,
  CustomSwitch,
}) => {
  return (
    <>
      {/* Storage Section */}
      <View style={[styles.sectionContainer, isLandscape && styles.sectionContainerLandscape]}>
        <Text style={styles.sectionHeader}>QUẢN LÝ LƯU TRỮ & NỘI DUNG</Text>
        <View style={styles.glassListCard}>
          <View style={styles.settingsItem}>
            <View style={styles.itemLeft}>
              <View style={styles.iconWrapper}><Text style={styles.itemIcon}>💾</Text></View>
              <View>
                <Text style={styles.itemTitle}>Bộ nhớ ưu tiên</Text>
                <Text style={styles.itemSub}>Phân vùng tải media trình chiếu</Text>
              </View>
            </View>
            <View style={styles.segmentedContainer}>
              {(['internal', 'tfcard', 'usb'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.segmentedButton, storageLocation === type && styles.segmentedButtonActive]}
                  onPress={() => onStorageChange(type)}
                >
                  <Text style={[styles.segmentedText, storageLocation === type && styles.segmentedTextActive]}>
                    {type === 'internal' ? 'Trong' : type === 'tfcard' ? 'Thẻ nhớ' : 'USB'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.settingsItem}>
            <View style={styles.itemLeft}>
              <View style={styles.iconWrapper}><Text style={styles.itemIcon}>⏯️</Text></View>
              <View>
                <Text style={styles.itemTitle}>Phát tiếp video dở dang</Text>
                <Text style={styles.itemSub}>Lưu tiến độ khi khởi động lại</Text>
              </View>
            </View>
            <CustomSwitch value={breakpointEnabled} onValueChange={onBreakpointChange} />
          </View>

          <View style={[styles.settingsItem, { borderBottomWidth: 0 }]}>
            <View style={styles.itemLeft}>
              <View style={styles.iconWrapper}><Text style={styles.itemIcon}>🗑️</Text></View>
              <View>
                <Text style={styles.itemTitle}>Xóa chương trình phát</Text>
                <Text style={styles.itemSub}>Dọn sạch media & dừng trình chiếu</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.btnClearCache} onPress={onClearProgramAndCache} activeOpacity={0.8}>
              <Text style={styles.btnClearCacheText}>XÓA CHƯƠNG TRÌNH</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* USB Section */}
      <View style={[styles.sectionContainer, isLandscape && styles.sectionContainerLandscape]}>
        <Text style={styles.sectionHeader}>USB OFFLINE FALLBACK</Text>
        <View style={styles.glassListCard}>
          <View style={styles.settingsItem}>
            <View style={styles.itemLeft}>
              <View style={styles.iconWrapper}><Text style={styles.itemIcon}>🔌</Text></View>
              <View>
                <Text style={styles.itemTitle}>Chế độ phát USB Offline</Text>
                <Text style={styles.itemSub}>Đọc USB khi thiết bị mất Internet</Text>
              </View>
            </View>
            <CustomSwitch value={usbOfflineFallback} onValueChange={onUsbFallbackChange} />
          </View>

          <View style={[styles.settingsItem, { borderBottomWidth: 0 }]}>
            <View style={styles.itemLeft}>
              <View style={styles.iconWrapper}><Text style={styles.itemIcon}>📁</Text></View>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.itemTitle}>Đường dẫn thư mục USB</Text>
                <Text style={styles.itemSub}>Thư mục chứa video/hình ảnh</Text>
              </View>
            </View>
            <TextInput
              style={styles.inputPath}
              value={usbPath}
              onChangeText={onUsbPathChange}
              placeholder="/CDMedia"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>
      </View>

      {/* Sleep Schedule Section */}
      <View style={[styles.sectionContainer, isLandscape && styles.sectionContainerLandscape]}>
        <Text style={styles.sectionHeader}>LỊCH NGHỈ MÀN HÌNH (CMS SYNC)</Text>
        <View style={styles.glassListCard}>
          <View style={[styles.settingsItem, { borderBottomWidth: 0 }]}>
            <View style={styles.itemLeft}>
              <View style={styles.iconWrapper}><Text style={styles.itemIcon}>😴</Text></View>
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
              <Text style={[styles.badgeTextSecurity, sleepScheduleEnabled ? styles.badgeTextSecurityActive : styles.badgeTextSecurityInactive]}>
                {sleepScheduleEnabled ? 'ON' : 'OFF'}
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles.syncHintText}>* Cài đặt lịch nghỉ được cấu hình và đồng bộ tự động từ Web CMS.</Text>
      </View>

      {/* Security Section */}
      <View style={[styles.sectionContainer, isLandscape && styles.sectionContainerLandscape]}>
        <Text style={styles.sectionHeader}>BẢO MẬT & ĐỒNG BỘ PIN</Text>
        <View style={styles.glassListCard}>
          <View style={[styles.settingsItem, { borderBottomWidth: 0 }]}>
            <View style={styles.itemLeft}>
              <View style={styles.iconWrapper}><Text style={styles.itemIcon}>🔐</Text></View>
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
              <Text style={[styles.badgeTextSecurity, securityUsePass ? styles.badgeTextSecurityActive : styles.badgeTextSecurityInactive]}>
                {securityUsePass ? `PIN: ${securityPassVal.replace(/./g, '*') || '0000'}` : 'OFF'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 24,
  },
  sectionContainerLandscape: {
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00b894',
    letterSpacing: 1.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  glassListCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.025)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  itemIcon: {
    fontSize: 18,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  itemSub: {
    fontSize: 12,
    color: '#8a99ad',
    marginTop: 2,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    padding: 3,
  },
  segmentedButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  segmentedButtonActive: {
    backgroundColor: '#00b894',
  },
  segmentedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8a99ad',
  },
  segmentedTextActive: {
    color: '#ffffff',
  },
  btnClearCache: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 8,
  },
  btnClearCacheText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ef4444',
  },
  inputPath: {
    width: 130,
    height: 38,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    fontSize: 12,
    color: '#ffffff',
  },
  syncHintText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 6,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  badgeContainer: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  badgeTextSecurity: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextSecurityActive: {
    color: '#00b894',
  },
  badgeTextSecurityInactive: {
    color: '#8a99ad',
  },
});
