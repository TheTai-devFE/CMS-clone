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

// Theme & Custom components
import { colors } from './src/theme/colors';
import BottomTabBar from './src/components/BottomTabBar';
import ExitModal from './src/components/ExitModal';

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

  // Form Configurations
  const [formIp, setFormIp] = useState('192.168.1.100');
  const [formPort, setFormPort] = useState('3000');
  const [formName, setFormName] = useState('Màn hình Phòng khách');

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
    resetHideTimer();
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

  // Submit action in RegisterScreen
  const handleRegisterSubmit = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      triggerToast();
      // Auto switch back to AdPlayer screen after successful registration
      setActiveTab(null);
    }, 1500);
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
              />
            ) : (
              <HomeScreen isLandscape={isLandscape} />
            )
          ) : activeTab === 'register' ? (
            <RegisterScreen
              isLandscape={isLandscape}
              onSubmit={handleRegisterSubmit}
              isLoading={isLoading}
              formIp={formIp}
              setFormIp={setFormIp}
              formPort={formPort}
              setFormPort={setFormPort}
              formName={formName}
              setFormName={setFormName}
              onBack={() => setActiveTab(null)}
            />
          ) : activeTab === 'settings' ? (
            <SettingsScreen
              isLandscape={isLandscape}
              formIp={formIp}
              formPort={formPort}
              formName={formName}
              onBack={() => setActiveTab(null)}
              onLogout={() => {
                setFormIp('');
                setFormPort('');
                setFormName('');
                setActiveTab('register');
              }}
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
            <HomeScreen isLandscape={isLandscape} />
          )}
        </View>

        {/* BOTTOM TAB BAR (Controlled via translateX/translateY sliding animations) */}
        <BottomTabBar
          activeTab={activeTab}
          onTabPress={(tab) => {
            if (tab === 'exit') {
              setShowExitModal(true);
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
});
