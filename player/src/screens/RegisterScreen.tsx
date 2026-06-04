import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors } from '../theme/colors';

interface RegisterScreenProps {
  isLandscape: boolean;
  onSubmit: () => void;
  isLoading: boolean;
  formIp: string;
  setFormIp: (ip: string) => void;
  formPort: string;
  setFormPort: (port: string) => void;
  formName: string;
  setFormName: (name: string) => void;
  onBack: () => void;
}

export default function RegisterScreen({
  isLandscape,
  onSubmit,
  isLoading,
  formIp,
  setFormIp,
  formPort,
  setFormPort,
  formName,
  setFormName,
  onBack,
}: RegisterScreenProps) {
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: isLandscape ? 40 : 120 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.registerContentWrapper}>
            {/* Header Title Section */}
            <View style={styles.screenHeader}>
              <Text style={styles.screenMainTitle}>Cấu hình thiết bị</Text>
              <Text style={styles.screenSubTitle}>
                Nhập thông tin hệ thống CMS để hoàn tất đăng ký.
              </Text>
            </View>

            {/* Glassmorphic Form Card */}
            <View style={styles.glassFormCard}>
              {/* Header Inside Form */}
              <View style={styles.formHeaderContainer}>
                <Text style={styles.formHeaderTitle}>Cấu hình kết nối</Text>
                <Text style={styles.formHeaderSub}>
                  Thiết lập các thông số kết nối đến server CMS.
                </Text>
              </View>

              {/* IP Address Field (Floating label style) */}
              <View style={styles.inputGroup}>
                <Text
                  style={[
                    styles.inputLabel,
                    focusedInput === 'ip' && styles.inputLabelFocused,
                  ]}
                >
                  IP Address
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    focusedInput === 'ip' && styles.textInputFocused,
                  ]}
                  onFocus={() => setFocusedInput('ip')}
                  onBlur={() => setFocusedInput(null)}
                  value={formIp}
                  onChangeText={setFormIp}
                  placeholder="VD: 192.168.1.100"
                  placeholderTextColor="rgba(15, 23, 42, 0.3)"
                  keyboardType="numeric"
                />
              </View>

              {/* Port Field (Floating label style) */}
              <View style={styles.inputGroup}>
                <Text
                  style={[
                    styles.inputLabel,
                    focusedInput === 'port' && styles.inputLabelFocused,
                  ]}
                >
                  Server Port
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    focusedInput === 'port' && styles.textInputFocused,
                  ]}
                  onFocus={() => setFocusedInput('port')}
                  onBlur={() => setFocusedInput(null)}
                  value={formPort}
                  onChangeText={setFormPort}
                  placeholder="VD: 3000"
                  placeholderTextColor="rgba(15, 23, 42, 0.3)"
                  keyboardType="numeric"
                />
              </View>

              {/* Device Name Field (Floating label style) */}
              <View style={styles.inputGroup}>
                <Text
                  style={[
                    styles.inputLabel,
                    focusedInput === 'name' && styles.inputLabelFocused,
                  ]}
                >
                  Device Name
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    focusedInput === 'name' && styles.textInputFocused,
                  ]}
                  onFocus={() => setFocusedInput('name')}
                  onBlur={() => setFocusedInput(null)}
                  value={formName}
                  onChangeText={setFormName}
                  placeholder="Nhập tên thiết bị hiển thị"
                  placeholderTextColor="rgba(15, 23, 42, 0.3)"
                />
              </View>

              {/* Submit Action Button */}
              <TouchableOpacity
                style={[styles.btnSubmit, isLoading && styles.btnSubmitDisabled]}
                onPress={onSubmit}
                disabled={isLoading}
                activeOpacity={0.9}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Text style={styles.btnSubmitText}>ĐĂNG KÝ </Text>
                    <Text style={styles.btnSubmitIcon}>➔</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  registerContentWrapper: {
    width: '100%',
    maxWidth: 480,
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
  glassFormCard: {
    width: '100%',
    backgroundColor: colors.glassBackground,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 4,
  },
  formHeaderContainer: {
    marginBottom: 24,
  },
  formHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  formHeaderSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 22,
    position: 'relative',
  },
  inputLabel: {
    position: 'absolute',
    left: 12,
    top: -9,
    backgroundColor: '#ffffff',
    paddingHorizontal: 6,
    zIndex: 10,
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  inputLabelFocused: {
    color: colors.secondary,
  },
  textInput: {
    width: '100%',
    height: 52,
    backgroundColor: 'rgba(15, 23, 42, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.primary,
  },
  textInputFocused: {
    borderColor: colors.secondary,
    backgroundColor: '#ffffff',
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  btnSubmit: {
    marginTop: 8,
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  btnSubmitDisabled: {
    backgroundColor: '#64748b',
    opacity: 0.7,
  },
  btnSubmitText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  btnSubmitIcon: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
