import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';

interface PairingStatusAreaProps {
  pairingStatus: 'idle' | 'loading' | 'pending' | 'linked' | 'expired' | 'error';
  errorMsg: string;
  pairingCode: string;
  isLandscape?: boolean;
  onRetry: () => void;
}

export const PairingStatusArea: React.FC<PairingStatusAreaProps> = ({
  pairingStatus,
  errorMsg,
  pairingCode,
  isLandscape,
  onRetry,
}) => {
  switch (pairingStatus) {
    case 'loading':
      return (
        <View style={styles.statusArea}>
          <ActivityIndicator size="large" color="#00b894" />
          <Text style={styles.statusSubText}>Đang tạo mã liên kết...</Text>
        </View>
      );
    case 'expired':
      return (
        <View style={styles.statusArea}>
          <Text style={styles.errorText}>Mã liên kết đã hết hạn</Text>
          <TouchableOpacity style={styles.btnRetry} onPress={onRetry}>
            <Text style={styles.btnRetryText}>Lấy mã mới</Text>
          </TouchableOpacity>
        </View>
      );
    case 'error':
      return (
        <View style={styles.statusArea}>
          <Text style={styles.errorText}>{errorMsg}</Text>
          <TouchableOpacity style={styles.btnRetry} onPress={onRetry}>
            <Text style={styles.btnRetryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      );
    case 'linked':
      return (
        <View style={styles.statusArea}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successText}>Đã kết nối thành công!</Text>
        </View>
      );
    case 'pending':
      return (
        <View style={styles.pairingContainer}>
          <Text style={[styles.pairingCodeLabel, isLandscape && styles.pairingCodeLabelLandscape]}>MÃ LIÊN KẾT THIẾT BỊ</Text>
          <View style={[styles.codeWrapper, isLandscape && styles.codeWrapperLandscape]}>
            {pairingCode.split('').map((char, index) => (
              <View key={index} style={[styles.codeCharBox, isLandscape && styles.codeCharBoxLandscape]}>
                <Text style={[styles.codeCharText, isLandscape && styles.codeCharTextLandscape]}>{char}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.instructionText, isLandscape && styles.instructionTextLandscape]}>
            Hãy nhập mã 6 số này vào mục "Thêm thiết bị" trên Web Dashboard để kết nối.
          </Text>
          <View style={[styles.waitingContainer, isLandscape && styles.waitingContainerLandscape]}>
            <ActivityIndicator size="small" color="#00b894" style={{ marginRight: 8 }} />
            <Text style={styles.waitingText}>Đang chờ kích hoạt từ Dashboard...</Text>
          </View>
        </View>
      );
    default:
      return (
        <View style={styles.statusArea}>
          <Text style={styles.infoText}>Vui lòng nhập IP và Port của máy chủ</Text>
        </View>
      );
  }
};

const styles = StyleSheet.create({
  statusArea: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  statusSubText: {
    color: '#8a99ad',
    fontSize: 14,
    marginTop: 12,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  btnRetry: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
  },
  btnRetryText: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 13,
  },
  successIcon: {
    fontSize: 36,
    color: '#00b894',
    marginBottom: 8,
  },
  successText: {
    color: '#00b894',
    fontSize: 16,
    fontWeight: '700',
  },
  infoText: {
    color: '#8a99ad',
    fontSize: 13,
  },
  pairingContainer: {
    alignItems: 'center',
  },
  pairingCodeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00b894',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  pairingCodeLabelLandscape: {
    fontSize: 10,
    marginBottom: 8,
  },
  codeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  codeWrapperLandscape: {
    marginBottom: 10,
    gap: 6,
  },
  codeCharBox: {
    width: 44,
    height: 54,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeCharBoxLandscape: {
    width: 38,
    height: 46,
    borderRadius: 8,
  },
  codeCharText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
  },
  codeCharTextLandscape: {
    fontSize: 22,
  },
  instructionText: {
    fontSize: 13,
    color: '#8a99ad',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  instructionTextLandscape: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 184, 148, 0.05)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(0, 184, 148, 0.1)',
  },
  waitingContainerLandscape: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  waitingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00b894',
  },
});
