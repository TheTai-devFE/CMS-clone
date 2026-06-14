import React from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText?: string;
  icon?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationModal({
  visible,
  title,
  description,
  confirmText,
  cancelText = 'HỦY BỎ',
  icon = '⚠️',
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>{icon}</Text>
          </View>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalDescription}>{description}</Text>

          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={styles.btnCancel}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.btnCancelText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnConfirm}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.btnConfirmText}>{confirmText}</Text>
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
    backgroundColor: colors.glassOverlay || 'rgba(10, 15, 30, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.glassBackground || 'rgba(30, 41, 59, 0.85)',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder || 'rgba(255, 255, 255, 0.1)',
    shadowColor: colors.primary || '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 10,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.errorContainer || 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 28,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary || '#ffffff',
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  modalDescription: {
    fontSize: 13,
    color: colors.textMuted || '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btnCancel: {
    flex: 1,
    height: 48,
    backgroundColor: 'rgba(15, 23, 42, 0.03)',
    borderWidth: 1,
    borderColor: colors.outlineVariant || 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancelText: {
    color: colors.textMuted || '#94a3b8',
    fontWeight: '700',
    fontSize: 13,
  },
  btnConfirm: {
    flex: 1,
    height: 48,
    backgroundColor: colors.error || '#ef4444',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnConfirmText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
});
