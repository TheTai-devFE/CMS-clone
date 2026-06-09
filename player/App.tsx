import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ScreenOrientation from 'expo-screen-orientation';

// Theme & Custom components
import { colors } from './src/theme/colors';
import BottomTabBar from './src/components/BottomTabBar';
import ExitModal from './src/components/ExitModal';
import PasswordLockModal from './src/components/PasswordLockModal';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import AdPlayerScreen, { PLAYLIST } from './src/screens/AdPlayerScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import NetworkScreen from './src/screens/NetworkScreen';

export default function App() {
  // activeTab: null means running AdPlayerScreen, else showing configuring screens
  const [activeTab, setActiveTab] = useState<'register' | 'settings' | 'network' | 'exit' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  // Password Lock
  const [isLocked, setIsLocked] = useState(false);
  const [correctPin, setCorrectPin] = useState('');
  const [pendingTab, setPendingTab] = useState<'register' | 'settings' | 'network' | 'exit' | null>(null);

  // Kiosk Features States
  const [menuGestureEnabled, setMenuGestureEnabled] = useState(false);
  const [touchCount, setTouchCount] = useState(0);
  const [lastTouchTime, setLastTouchTime] = useState(0);

  const [isSleeping, setIsSleeping] = useState(false);
  const [sleepScheduleEnabled, setSleepScheduleEnabled] = useState(false);
  const [sleepStartTime, setSleepStartTime] = useState('22:00');
  const [sleepEndTime, setSleepEndTime] = useState('06:00');

  // Form Configurations
  const [formIp, setFormIp] = useState('192.168.2.229');
  const [formPort, setFormPort] = useState('3000');
  const [formName, setFormName] = useState('Màn hình Phòng khách');

  // Registered Device Credentials
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [registeredDeviceName, setRegisteredDeviceName] = useState<string>('');

  // Load configuration from AsyncStorage on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const storedIp = await AsyncStorage.getItem('serverIp');
        const storedPort = await AsyncStorage.getItem('serverPort');
        const storedId = await AsyncStorage.getItem('deviceId');
        const storedKey = await AsyncStorage.getItem('apiKey');
        const storedName = await AsyncStorage.getItem('deviceName');
        
        if (storedIp) setFormIp(storedIp);
        if (storedPort) setFormPort(storedPort);
        if (storedId) setDeviceId(storedId);
        if (storedKey) setApiKey(storedKey);
        if (storedName) {
          setFormName(storedName);
          setRegisteredDeviceName(storedName);
        }

        // Đọc và thiết lập hướng màn hình lưu trữ ban đầu
        const storedOrientation = await AsyncStorage.getItem('screenOrientation');
        if (storedOrientation === 'portrait') {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        } else if (storedOrientation === 'landscape') {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);
        } else {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT);
        }

        // Đọc cấu hình Menu Gesture
        const storedGesture = await AsyncStorage.getItem('menuGestureEnabled') === 'true';
        setMenuGestureEnabled(storedGesture);

        // Đọc cấu hình Sleep
        const storedSleepEnabled = await AsyncStorage.getItem('sleep_schedule_enabled') === 'true';
        const storedSleepStart = await AsyncStorage.getItem('sleep_start_time') || '22:00';
        const storedSleepEnd = await AsyncStorage.getItem('sleep_end_time') || '06:00';
        setSleepScheduleEnabled(storedSleepEnabled);
        setSleepStartTime(storedSleepStart);
        setSleepEndTime(storedSleepEnd);
      } catch (e) {
        console.error('Lỗi khi tải cấu hình từ AsyncStorage hoặc xoay màn hình:', e);
      }
    };
    loadConfig();
  }, []);

  // Check Sleep status loop
  useEffect(() => {
    const checkSleep = () => {
      if (!sleepScheduleEnabled) {
        setIsSleeping(false);
        return;
      }
      
      const now = new Date();
      const currentMin = now.getHours() * 60 + now.getMinutes();
      
      const [startH, startM] = sleepStartTime.split(':').map(Number);
      const [endH, endM] = sleepEndTime.split(':').map(Number);
      
      const startMin = (startH || 0) * 60 + (startM || 0);
      const endMin = (endH || 0) * 60 + (endM || 0);
      
      let sleeping = false;
      if (startMin < endMin) {
        sleeping = currentMin >= startMin && currentMin < endMin;
      } else {
        sleeping = currentMin >= startMin || currentMin < endMin;
      }
      
      setIsSleeping(sleeping);
    };

    checkSleep();
    const interval = setInterval(checkSleep, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [sleepScheduleEnabled, sleepStartTime, sleepEndTime]);

  // Refresh Menu Gesture when returning from settings
  useEffect(() => {
    if (activeTab === null) {
      const refreshGesture = async () => {
        try {
          const storedGesture = await AsyncStorage.getItem('menuGestureEnabled') === 'true';
          setMenuGestureEnabled(storedGesture);
        } catch (e) {
          console.error(e);
        }
      };
      refreshGesture();
    }
  }, [activeTab]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('deviceId');
      await AsyncStorage.removeItem('apiKey');
      await AsyncStorage.removeItem('deviceName');
      setDeviceId(null);
      setApiKey(null);
      setFormName('');
      setRegisteredDeviceName('');
      setActiveTab('register');
    } catch (e) {
      console.error('Lỗi khi xóa cấu hình thiết bị:', e);
    }
  };

  // Heartbeat loop when device is registered
  useEffect(() => {
    let interval: any = null;

    const sendHeartbeat = async () => {
      if (!deviceId || !apiKey) return;
      
      try {
        const response = await fetch(`http://${formIp}:${formPort}/api/player/heartbeat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            deviceId,
            apiKey,
            cpuUsage: Math.floor(Math.random() * 15) + 5, // Mock CPU 5% - 20%
            freeMemoryMb: Math.floor(Math.random() * 200) + 400, // Mock Free RAM 400MB - 600MB
          }),
        });

        if (!response.ok) {
          console.warn('Gửi heartbeat thất bại, status:', response.status);
          if (response.status === 401) {
            console.error('Thiết bị bị từ chối bởi Server (401). Tiến hành đăng xuất...');
            await handleLogout();
          }
        } else {
          console.log('Gửi heartbeat thành công');
          const data = await response.json();
          if (data) {
            // Đồng bộ tên thiết bị từ Server
            if (data.deviceName) {
              setRegisteredDeviceName(data.deviceName);
              setFormName(data.deviceName);
              await AsyncStorage.setItem('deviceName', data.deviceName);
            }

            await AsyncStorage.setItem('security_use_pass', data.useSecurityPassword ? 'true' : 'false');
            if (data.securityPassword) {
              await AsyncStorage.setItem('security_pass_val', data.securityPassword);
            } else if (data.useSecurityPassword) {
              // Fallback mã PIN mặc định là '0000' nếu admin chưa cấu hình PIN trong profile
              await AsyncStorage.setItem('security_pass_val', '0000');
            } else {
              await AsyncStorage.removeItem('security_pass_val');
            }

            // Đồng bộ cấu hình Sleep từ Heartbeat
            const serverSleepEnabled = !!data.sleepScheduleEnabled;
            const serverSleepStart = data.sleepStartTime || '22:00';
            const serverSleepEnd = data.sleepEndTime || '06:00';

            setSleepScheduleEnabled(serverSleepEnabled);
            setSleepStartTime(serverSleepStart);
            setSleepEndTime(serverSleepEnd);

            await AsyncStorage.setItem('sleep_schedule_enabled', serverSleepEnabled ? 'true' : 'false');
            await AsyncStorage.setItem('sleep_start_time', serverSleepStart);
            await AsyncStorage.setItem('sleep_end_time', serverSleepEnd);
          }
        }
      } catch (err) {
        console.warn('Lỗi kết nối khi gửi heartbeat:', err);
      }
    };

    if (deviceId && apiKey) {
      sendHeartbeat();
      interval = setInterval(sendHeartbeat, 60000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [deviceId, apiKey, formIp, formPort]);

  const handleSetFormIp = async (ip: string) => {
    setFormIp(ip);
    try {
      await AsyncStorage.setItem('serverIp', ip);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetFormPort = async (port: string) => {
    setFormPort(port);
    try {
      await AsyncStorage.setItem('serverPort', port);
    } catch (e) {
      console.error(e);
    }
  };

  // Animation values
  const translateYAnim = useRef(new Animated.Value(0)).current; // Tab bar trượt
  const toastFadeAnim = useRef(new Animated.Value(0)).current;
  const toastSlideAnim = useRef(new Animated.Value(20)).current;

  // Auto-hide navigation timer ref
  const hideTimerRef = useRef<any>(null);

  // Show/Hide animations for Tab Bar
  const showTabBar = () => {
    Animated.timing(translateYAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideTabBar = () => {
    Animated.timing(translateYAnim, {
      toValue: 120, // trượt xuống hẳn dưới màn hình
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Reset the timer to auto-hide Tab Bar (only active when in AdPlayer mode)
  const resetHideTimer = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }

    if (activeTab === null) {
      showTabBar();
      hideTimerRef.current = setTimeout(() => {
        hideTabBar();
      }, 5000); // Hide after 5 seconds of inactivity
    }
  };

  // Handle touch events on the main container
  const handleScreenTouch = () => {
    const now = Date.now();
    if (menuGestureEnabled) {
      if (now - lastTouchTime > 3000) {
        setTouchCount(1);
      } else {
        const newCount = touchCount + 1;
        setTouchCount(newCount);
        if (newCount === 5) {
          resetHideTimer();
          setTouchCount(0);
          return;
        }
      }
      setLastTouchTime(now);
    } else {
      resetHideTimer();
    }
  };

  // Watch activeTab state to handle timer logic
  useEffect(() => {
    if (activeTab === null) {
      resetHideTimer();
    } else {
      // Force show Tab Bar when user is actively configuring
      showTabBar();
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    }

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [activeTab]);

  // Toast Notification triggered on successful register
  const triggerToast = () => {
    setShowToast(true);
    Animated.parallel([
      Animated.timing(toastFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(toastSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastFadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(toastSlideAnim, {
          toValue: 20,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setShowToast(false));
    }, 3000);
  };

  // Success action in RegisterScreen
  const handleRegisterSuccess = async (id: string, key: string, name: string) => {
    try {
      await AsyncStorage.setItem('deviceId', id);
      await AsyncStorage.setItem('apiKey', key);
      await AsyncStorage.setItem('deviceName', name);
      
      setDeviceId(id);
      setApiKey(key);
      setFormName(name);
      setRegisteredDeviceName(name);
      
      triggerToast();
      // Không tự động đóng tab Register, hiển thị giao diện kích hoạt ngay tại đây
    } catch (e) {
      console.error('Lỗi lưu thông tin sau đăng ký thành công:', e);
    }
  };

  // Screen orientation/dimensions
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const isLandscape = screenWidth > screenHeight;

  return (
    <TouchableWithoutFeedback onPress={handleScreenTouch}>
      <View style={styles.container}>
        <StatusBar style="dark" />

        {/* Dynamic content rendering based on activeTab */}
        <View style={styles.contentArea}>
          {activeTab === null ? (
            PLAYLIST.length > 0 ? (
              <AdPlayerScreen
                isLandscape={isLandscape}
                onRelaunchRequest={() => setActiveTab(null)}
                isSleeping={isSleeping}
              />
            ) : (
              <HomeScreen 
                isLandscape={isLandscape}
                deviceId={deviceId}
                deviceName={registeredDeviceName}
                serverIp={formIp}
                serverPort={formPort}
              />
            )
          ) : activeTab === 'register' ? (
            <RegisterScreen
              isLandscape={isLandscape}
              onSuccess={handleRegisterSuccess}
              formIp={formIp}
              setFormIp={handleSetFormIp}
              formPort={formPort}
              setFormPort={handleSetFormPort}
              onBack={() => setActiveTab(null)}
              deviceId={deviceId}
              deviceName={registeredDeviceName}
              onDisconnect={handleLogout}
            />
          ) : activeTab === 'settings' ? (
            <SettingsScreen
              isLandscape={isLandscape}
              formIp={formIp}
              formPort={formPort}
              formName={formName}
              onBack={() => setActiveTab(null)}
              onLogout={handleLogout}
            />
          ) : activeTab === 'network' ? (
            <NetworkScreen
              isLandscape={isLandscape}
              isLoading={isLoading}
              onRefresh={() => {
                setIsLoading(true);
                setTimeout(() => setIsLoading(false), 800);
              }}
              onBack={() => setActiveTab(null)}
            />
          ) : (
            // Placeholder/Fallback to welcome screen if tab is undefined
            <HomeScreen 
              isLandscape={isLandscape}
              deviceId={deviceId}
              deviceName={registeredDeviceName}
              serverIp={formIp}
              serverPort={formPort}
            />
          )}
        </View>

        {/* BOTTOM TAB BAR (Controlled via translateX/translateY sliding animations) */}
        <BottomTabBar
          activeTab={activeTab}
          onTabPress={async (tab) => {
            if (tab === 'exit') {
              setShowExitModal(true);
            } else if (tab === 'settings' || tab === 'network') {
              try {
                const useSecStr = await AsyncStorage.getItem('security_use_pass');
                const secPass = await AsyncStorage.getItem('security_pass_val');
                if (useSecStr === 'true' && secPass) {
                  setCorrectPin(secPass);
                  setPendingTab(tab);
                  setIsLocked(true);
                } else {
                  setActiveTab(tab);
                }
              } catch (e) {
                console.error('Lỗi kiểm tra bảo mật tab:', e);
                setActiveTab(tab);
              }
            } else {
              setActiveTab(tab);
            }
          }}
          translateYAnim={translateYAnim}
          onInteraction={resetHideTimer}
        />

        {/* EXIT DIALOGUE MODAL */}
        <ExitModal
          visible={showExitModal}
          onCancel={() => {
            setShowExitModal(false);
            setActiveTab(null);
          }}
          onConfirm={() => {
            setShowExitModal(false);
            setActiveTab(null);
          }}
        />

        {/* PASSWORD LOCK MODAL */}
        <PasswordLockModal
          visible={isLocked}
          correctPin={correctPin}
          onSuccess={() => {
            setIsLocked(false);
            if (pendingTab) {
              setActiveTab(pendingTab);
              setPendingTab(null);
            }
          }}
          onCancel={() => {
            setIsLocked(false);
            setPendingTab(null);
          }}
        />

        {/* TOAST SUCCESS NOTIFICATION */}
        {showToast && (
          <Animated.View
            style={[
              styles.toastContainer,
              {
                opacity: toastFadeAnim,
                transform: [{ translateY: toastSlideAnim }],
              },
            ]}
          >
            <Text style={styles.toastIcon}>✓</Text>
            <Text style={styles.toastText}>Đăng ký thiết bị thành công!</Text>
          </Animated.View>
        )}

        {/* SLEEP COVER OVERLAY */}
        {isSleeping && (
          <View style={styles.sleepOverlay}>
            <Text style={styles.sleepOverlayText}>📺 Đang trong chế độ nghỉ tiết kiệm điện...</Text>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentArea: {
    flex: 1,
  },
  toastContainer: {
    position: 'absolute',
    bottom: 104,
    alignSelf: 'center',
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
    zIndex: 999,
  },
  toastIcon: {
    fontSize: 18,
    color: colors.success,
    fontWeight: 'bold',
  },
  toastText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  sleepOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
  },
  sleepOverlayText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
});
