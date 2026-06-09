import React, { useState, useEffect } from 'react';
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
  Dimensions,
} from 'react-native';
import { getHardwareId } from '../utils/deviceInfo';

interface RegisterScreenProps {
  isLandscape: boolean;
  onSuccess: (deviceId: string, apiKey: string, deviceName: string) => void;
  formIp: string;
  setFormIp: (ip: string) => void;
  formPort: string;
  setFormPort: (port: string) => void;
  onBack: () => void;
  deviceId: string | null;
  deviceName: string;
  onDisconnect: () => void;
}

export default function RegisterScreen({
  isLandscape,
  onSuccess,
  formIp,
  setFormIp,
  formPort,
  setFormPort,
  onBack,
  deviceId,
  deviceName,
  onDisconnect,
}: RegisterScreenProps) {
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [localIp, setLocalIp] = useState(formIp);
  const [localPort, setLocalPort] = useState(formPort);

  // Sync inputs with form state props
  useEffect(() => {
    setLocalIp(formIp);
    setLocalPort(formPort);
  }, [formIp, formPort]);
  
  // Pairing Code States
  const [pairingCode, setPairingCode] = useState<string>('');
  const [tempDeviceId, setTempDeviceId] = useState<string>('');
  const [expireAt, setExpireAt] = useState<number>(0);
  const [pairingStatus, setPairingStatus] = useState<'idle' | 'loading' | 'pending' | 'linked' | 'error' | 'expired'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');


  const fetchPairingCode = async (targetIp = localIp, targetPort = localPort) => {
    if (!targetIp || !targetPort) {
      setPairingStatus('idle');
      return;
    }
    
    setPairingStatus('loading');
    setErrorMsg('');
    
    try {
      const hardwareId = await getHardwareId();
      console.log('Using Hardware ID (macAddress):', hardwareId);

      const response = await fetch(`http://${targetIp}:${targetPort}/api/player/pairing-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          macAddress: hardwareId,
          screenResolution: `${Math.round(Dimensions.get('window').width)}x${Math.round(Dimensions.get('window').height)}`,
          osVersion: Platform.OS + ' ' + Platform.Version,
          appVersion: '1.0.0',
        }),
      });

      if (!response.ok) {
        throw new Error(`Server trả về lỗi: ${response.status}`);
      }

      const data = await response.json();
      setPairingCode(data.pairingCode);
      setTempDeviceId(data.tempDeviceId);
      setExpireAt(data.expireAt);
      setPairingStatus('pending');
    } catch (err: any) {
      console.error('Lỗi khi lấy pairing code:', err);
      setPairingStatus('error');
      setErrorMsg(err.message || 'Không thể kết nối đến máy chủ CMS');
    }
  };

  // Tự động lấy pairing code một lần khi mount
  useEffect(() => {
    if (formIp && formPort) {
      fetchPairingCode(formIp, formPort);
    }
  }, []);

  const handleConnect = () => {
    setFormIp(localIp);
    setFormPort(localPort);
    fetchPairingCode(localIp, localPort);
  };

  // Polling check status
  useEffect(() => {
    let interval: any = null;
    
    if (pairingStatus === 'pending' && tempDeviceId) {
      interval = setInterval(async () => {
        // Kiểm tra xem mã đã hết hạn chưa
        if (Date.now() > expireAt) {
          setPairingStatus('expired');
          clearInterval(interval);
          return;
        }
        
        try {
          const response = await fetch(`http://${formIp}:${formPort}/api/player/pairing-status/${tempDeviceId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.status === 'linked') {
              clearInterval(interval);
              setPairingStatus('linked');
              onSuccess(data.deviceId, data.apiKey, data.deviceName || 'Màn hình CDM');
            }
          }
        } catch (err) {
          console.warn('Lỗi polling status:', err);
        }
      }, 3000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pairingStatus, tempDeviceId, expireAt]);

  const renderPairingArea = () => {
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
            <TouchableOpacity style={styles.btnRetry} onPress={() => fetchPairingCode()}>
              <Text style={styles.btnRetryText}>Lấy mã mới</Text>
            </TouchableOpacity>
          </View>
        );
      case 'error':
        return (
          <View style={styles.statusArea}>
            <Text style={styles.errorText}>{errorMsg}</Text>
            <TouchableOpacity style={styles.btnRetry} onPress={() => fetchPairingCode()}>
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
            { paddingBottom: isLandscape ? 110 : 130 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.registerContentWrapper}>
            {deviceId ? (
              /* PREMIUM DEVICE DASHBOARD (ĐÃ LIÊN KẾT) */
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
            ) : (
              /* FORM LIÊN KẾT THIẾT BỊ (CHƯA LIÊN KẾT) */
              <>
                {/* Header Title Section */}
                <View style={[styles.screenHeader, isLandscape && styles.screenHeaderLandscape]}>
                  <Text style={[styles.screenMainTitle, isLandscape && styles.screenMainTitleLandscape]}>Liên kết thiết bị</Text>
                  <Text style={[styles.screenSubTitle, isLandscape && styles.screenSubTitleLandscape]}>
                    Kết nối màn hình này vào Dashboard tài khoản CMS của bạn.
                  </Text>
                </View>

                {/* Glassmorphic Form Card */}
                <View style={[styles.glassFormCard, isLandscape && styles.glassFormCardLandscape]}>
                  {/* Server Connection Inputs */}
                  <View style={styles.serverConfigRow}>
                    {/* IP Address Field */}
                    <View style={[styles.inputGroup, { flex: 2, marginRight: 12, marginBottom: isLandscape ? 12 : 22 }]}>
                      <Text style={[styles.inputLabel, focusedInput === 'ip' && styles.inputLabelFocused]}>
                        Server IP
                      </Text>
                      <TextInput
                        style={[styles.textInput, focusedInput === 'ip' && styles.textInputFocused]}
                        onFocus={() => setFocusedInput('ip')}
                        onBlur={() => setFocusedInput(null)}
                        value={localIp}
                        onChangeText={setLocalIp}
                        placeholder="192.168.2.229"
                        placeholderTextColor="rgba(255, 255, 255, 0.2)"
                      />
                    </View>

                    {/* Port Field */}
                    <View style={[styles.inputGroup, { flex: 1, marginBottom: isLandscape ? 12 : 22 }]}>
                      <Text style={[styles.inputLabel, focusedInput === 'port' && styles.inputLabelFocused]}>
                        Port
                      </Text>
                      <TextInput
                        style={[styles.textInput, focusedInput === 'port' && styles.textInputFocused]}
                        onFocus={() => setFocusedInput('port')}
                        onBlur={() => setFocusedInput(null)}
                        value={localPort}
                        onChangeText={setLocalPort}
                        placeholder="3000"
                        placeholderTextColor="rgba(255, 255, 255, 0.2)"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.btnConnect, pairingStatus === 'loading' && styles.btnDisabled]}
                    onPress={handleConnect}
                    disabled={pairingStatus === 'loading'}
                    activeOpacity={0.8}
                  >
                    {pairingStatus === 'loading' ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.btnConnectText}>Kết nối đến máy chủ</Text>
                    )}
                  </TouchableOpacity>

                  {/* Pairing Code & Status Area */}
                  <View style={[styles.divider, isLandscape && styles.dividerLandscape]} />
                  
                  {renderPairingArea()}
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070b13', // Deep premium dark background
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
    backgroundColor: 'rgba(0, 184, 148, 0.08)', // Soft Emerald Glow
  },
  ambientBlobRight: {
    position: 'absolute',
    top: '30%',
    right: '-25%',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(0, 206, 201, 0.06)', // Soft Mint/Teal Glow
  },
  topAppBar: {
    height: 64,
    backgroundColor: 'rgba(10, 15, 29, 0.85)', // Dark glassmorphic header
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  backButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: -2,
  },
  appBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
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
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  screenSubTitle: {
    fontSize: 13,
    color: '#8a99ad',
    marginTop: 6,
    lineHeight: 18,
  },
  glassFormCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)', // Dark glassmorphism
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#00b894',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
  },
  serverConfigRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 24,
  },
  statusArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  statusSubText: {
    color: '#8a99ad',
    fontSize: 13,
    marginTop: 12,
  },
  infoText: {
    color: '#8a99ad',
    fontSize: 14,
    textAlign: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  successIcon: {
    fontSize: 48,
    color: '#00b894',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  successText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  btnRetry: {
    backgroundColor: '#00b894',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    shadowColor: '#00b894',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  btnRetryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  pairingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pairingCodeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00b894',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  codeWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
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
    shadowColor: '#00b894',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  codeCharText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
  },
  instructionText: {
    fontSize: 13,
    color: '#8a99ad',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
    marginBottom: 24,
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
  waitingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00b894',
  },
  inputGroup: {
    marginBottom: 22,
    position: 'relative',
  },
  inputLabel: {
    position: 'absolute',
    left: 12,
    top: -9,
    backgroundColor: '#070b13', // Match background color for input border overlap
    paddingHorizontal: 6,
    zIndex: 10,
    fontSize: 10,
    fontWeight: '700',
    color: '#8a99ad',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  inputLabelFocused: {
    color: '#00b894', // Emerald green focus
  },
  textInput: {
    width: '100%',
    height: 52,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#ffffff',
  },
  textInputFocused: {
    borderColor: '#00b894', // Emerald green border on focus
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#00b894',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
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
  infoGrid: {
    gap: 16,
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
    color: '#38bdf8', // Soft Sky Blue
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
  screenHeaderLandscape: {
    marginBottom: 10,
  },
  screenMainTitleLandscape: {
    fontSize: 20,
  },
  screenSubTitleLandscape: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 14,
  },
  glassFormCardLandscape: {
    padding: 16,
  },
  dividerLandscape: {
    marginVertical: 12,
  },
  pairingCodeLabelLandscape: {
    fontSize: 10,
    marginBottom: 8,
  },
  codeWrapperLandscape: {
    marginBottom: 10,
    gap: 6,
  },
  codeCharBoxLandscape: {
    width: 38,
    height: 46,
    borderRadius: 8,
  },
  codeCharTextLandscape: {
    fontSize: 22,
  },
  instructionTextLandscape: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  waitingContainerLandscape: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cardDividerLandscape: {
    marginVertical: 10,
  },
  infoGridLandscape: {
    gap: 10,
  },
  waitingFooterLandscape: {
    marginTop: 14,
    paddingVertical: 6,
  },
  btnConnect: {
    width: '100%',
    height: 48,
    backgroundColor: '#00b894',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#00b894',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  btnConnectText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  btnDisabled: {
    backgroundColor: 'rgba(0, 184, 148, 0.5)',
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
