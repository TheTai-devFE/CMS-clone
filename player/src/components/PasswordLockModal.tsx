import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, Animated } from 'react-native';
import { colors } from '../theme/colors';

interface PasswordLockModalProps {
  visible: boolean;
  correctPin: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PasswordLockModal({
  visible,
  correctPin,
  onSuccess,
  onCancel,
}: PasswordLockModalProps) {
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const shakeAnimation = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setPin('');
      setErrorMsg('');
    }
  }, [visible]);

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleKeyPress = (num: string) => {
    if (pin.length >= 4) return;
    setErrorMsg('');
    const newPin = pin + num;
    setPin(newPin);

    if (newPin.length === 4) {
      // Auto submit and verify
      setTimeout(() => {
        if (newPin === correctPin) {
          onSuccess();
        } else {
          setErrorMsg('Mã PIN không chính xác');
          setPin('');
          triggerShake();
        }
      }, 200);
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
  };

  const renderDot = (index: number) => {
    const isActive = pin.length > index;
    return (
      <View
        key={index}
        style={[
          styles.dot,
          isActive ? styles.dotActive : null,
          errorMsg ? styles.dotError : null,
        ]}
      />
    );
  };

  const renderKey = (val: string, index: number) => {
    if (val === 'empty') {
      return <View key={`empty-${index}`} style={styles.keyContainerEmpty} />;
    }

    if (val === 'delete') {
      return (
        <TouchableOpacity
          key="delete"
          style={styles.keyContainer}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Text style={styles.keyTextDelete}>⌫</Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={val}
        style={styles.keyContainer}
        onPress={() => handleKeyPress(val)}
        activeOpacity={0.7}
      >
        <Text style={styles.keyText}>{val}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.lockCard,
            { transform: [{ translateX: shakeAnimation }] },
          ]}
        >
          <View style={styles.lockIconCircle}>
            <Text style={styles.lockIconText}>🔒</Text>
          </View>
          <Text style={styles.lockTitle}>YÊU CẦU MÃ PIN</Text>
          <Text style={styles.lockDescription}>
            Vui lòng nhập mã PIN bảo mật để truy cập cấu hình cài đặt.
          </Text>

          {/* Dots container */}
          <View style={styles.dotsRow}>
            {[0, 1, 2, 3].map((i) => renderDot(i))}
          </View>

          {/* Error Message */}
          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          {/* Keypad Grid */}
          <View style={styles.keypadGrid}>
            {[
              ['1', '2', '3'],
              ['4', '5', '6'],
              ['7', '8', '9'],
              ['empty', '0', 'delete'],
            ].map((row, rIdx) => (
              <View key={rIdx} style={styles.keypadRow}>
                {row.map((val, kIdx) => renderKey(val, kIdx))}
              </View>
            ))}
          </View>

          {/* Cancel button */}
          <TouchableOpacity
            style={styles.btnCancel}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.btnCancelText}>HỦY BỎ</Text>
          </TouchableOpacity>
        </Animated.View>
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
  lockCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.glassBackground,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 10,
  },
  lockIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(116, 90, 54, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  lockIconText: {
    fontSize: 24,
  },
  lockTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: 6,
  },
  lockDescription: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    height: 20,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(15, 23, 42, 0.1)',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  dotActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  dotError: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 16,
  },
  keypadGrid: {
    width: '100%',
    gap: 8,
    marginBottom: 20,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  keyContainer: {
    flex: 1,
    height: 52,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.05)',
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  keyContainerEmpty: {
    flex: 1,
    height: 52,
  },
  keyText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  keyTextDelete: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textMuted,
  },
  btnCancel: {
    width: '100%',
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.03)',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  btnCancelText: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
