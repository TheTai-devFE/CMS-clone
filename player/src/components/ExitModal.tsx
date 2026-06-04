import React from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';

interface ExitModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ExitModal({ visible, onCancel, onConfirm }: ExitModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.exitModalCard}>
          <View style={styles.exitIconCircle}>
            <Text style={styles.exitIconText}>🚪</Text>
          </View>
          <Text style={styles.exitModalTitle}>ĐÓNG CHẾ ĐỘ KIOSK</Text>
          <Text style={styles.exitModalDescription}>
            Bạn có muốn đóng chế độ Kiosk Mode và thoát ứng dụng phát quảng cáo không?
          </Text>

          <View style={styles.exitButtonsRow}>
            <TouchableOpacity
              style={styles.btnExitCancel}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.btnExitCancelText}>HỦY BỎ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnExitConfirm}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.btnExitConfirmText}>THOÁT RA</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.glassOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  exitModalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.glassBackground,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 10,
  },
  exitIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.errorContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  exitIconText: {
    fontSize: 28,
  },
  exitModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  exitModalDescription: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  exitButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btnExitCancel: {
    flex: 1,
    height: 48,
    backgroundColor: 'rgba(15, 23, 42, 0.03)',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnExitCancelText: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 13,
  },
  btnExitConfirm: {
    flex: 1,
    height: 48,
    backgroundColor: colors.error,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnExitConfirmText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
});
