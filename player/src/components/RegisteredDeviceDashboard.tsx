import React from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';

interface RegisteredDeviceDashboardProps {
  deviceName?: string;
  formIp: string;
  formPort: string;
  deviceId: string;
  isLandscape?: boolean;
  onDisconnect: () => void;
}

export const RegisteredDeviceDashboard: React.FC<RegisteredDeviceDashboardProps> = ({
  deviceName,
  formIp,
  formPort,
  deviceId,
  isLandscape,
  onDisconnect,
}) => {
  return (
    <View style={[styles.dashboardCard, isLandscape && styles.dashboardCardLandscape]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>🖥️</Text>
        <View>
          <Text style={styles.cardTitle}>THIẾT BỊ ĐÃ KÍCH HOẠT</Text>
          <Text style={styles.cardSubtitle}>Màn hình quảng cáo sẵn sàng hoạt động</Text>
        </View>
      </View>

      <View style={[styles.cardDivider, isLandscape && styles.cardDividerLandscape]} />

      <View style={[styles.infoGrid, isLandscape && styles.infoGridLandscape]}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>TÊN MÀN HÌNH</Text>
          <Text style={styles.infoValue}>{deviceName || 'Màn hình CDM'}</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>ĐỊA CHỈ MÁY CHỦ</Text>
          <Text style={styles.infoValueMono}>{formIp}:{formPort}</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>MÃ THIẾT BỊ (UUID)</Text>
          <Text style={styles.infoValueMono} numberOfLines={1} ellipsizeMode="middle">
            {deviceId}
          </Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>TRẠNG THÁI LẬP LỊCH</Text>
          <Text style={styles.infoValueActive}>Chờ truyền tải danh sách phát...</Text>
        </View>
      </View>

      <View style={[styles.waitingFooter, isLandscape && styles.waitingFooterLandscape]}>
        <View style={styles.pulseDot} />
        <Text style={styles.footerText}>
          Đang lắng nghe tín hiệu từ Web Dashboard...
        </Text>
      </View>

      <TouchableOpacity
        style={styles.btnDisconnect}
        onPress={onDisconnect}
        activeOpacity={0.8}
      >
        <Text style={styles.btnDisconnectText}>Hủy liên kết thiết bị này</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  dashboardCard: {
    width: '100%',
    maxWidth: 580,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 24,
    shadowColor: '#00b894',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 6,
  },
  dashboardCardLandscape: {
    maxWidth: 720,
    padding: 28,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cardIcon: {
    fontSize: 32,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#00b894',
    letterSpacing: 1.5,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#8a99ad',
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 20,
  },
  cardDividerLandscape: {
    marginVertical: 10,
  },
  infoGrid: {
    gap: 16,
  },
  infoGridLandscape: {
    gap: 10,
  },
  infoItem: {
    flexDirection: 'column',
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 4,
  },
  infoValueMono: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#cbd5e1',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  infoValueActive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#38bdf8',
    marginTop: 4,
  },
  waitingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 184, 148, 0.03)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 184, 148, 0.08)',
  },
  waitingFooterLandscape: {
    marginTop: 14,
    paddingVertical: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00b894',
    marginRight: 10,
    opacity: 0.8,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8a99ad',
  },
  btnDisconnect: {
    marginTop: 16,
    width: '100%',
    height: 48,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisconnectText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
  },
});
