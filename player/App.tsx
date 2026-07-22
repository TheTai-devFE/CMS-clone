import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  LogBox,
} from "react-native";

LogBox.ignoreLogs([
  "shadow* style props are deprecated",
  "TouchableWithoutFeedback is deprecated",
  "Animated: `useNativeDriver` is not supported",
]);

// Theme & Custom components
import BottomTabBar from "./src/components/BottomTabBar";
import ExitModal from "./src/components/ExitModal";
import PasswordLockModal from "./src/components/PasswordLockModal";
import { colors } from "./src/theme/colors";

// Screens
import AdPlayerScreen from "./src/screens/AdPlayerScreen";
import HomeScreen from "./src/screens/HomeScreen";
import NetworkScreen from "./src/screens/NetworkScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import { getLocalPlaylist, syncPlaylist } from "./src/utils/syncManager";

export default function App() {
  // activeTab: null means running AdPlayerScreen, else showing configuring screens
  const [activeTab, setActiveTab] = useState<
    "register" | "settings" | "network" | "exit" | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  // Password Lock
  const [isLocked, setIsLocked] = useState(false);
  const [correctPin, setCorrectPin] = useState("");
  const [pendingTab, setPendingTab] = useState<
    "register" | "settings" | "network" | "exit" | null
  >(null);

  // Kiosk Features States
  const [menuGestureEnabled, setMenuGestureEnabled] = useState(false);
  const [touchCount, setTouchCount] = useState(0);
  const [lastTouchTime, setLastTouchTime] = useState(0);

  const [isSleeping, setIsSleeping] = useState(false);
  const [sleepScheduleEnabled, setSleepScheduleEnabled] = useState(false);
  const [sleepStartTime, setSleepStartTime] = useState("22:00");
  const [sleepEndTime, setSleepEndTime] = useState("06:00");

  // Form Configurations
  const [formIp, setFormIp] = useState("192.168.2.229");
  const [formPort, setFormPort] = useState("3000");
  const [formName, setFormName] = useState("Màn hình Phòng khách");

  // Registered Device Credentials
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [registeredDeviceName, setRegisteredDeviceName] = useState<string>("");

  // Playlist sync and caching states
  const [playlist, setPlaylist] = useState<any[]>([]);
  const [isSyncGroup, setIsSyncGroup] = useState(false);
  const [syncLayout, setSyncLayout] = useState<any>(null);
  const [clockOffset, setClockOffset] = useState(0);
  const [syncMode, setSyncMode] = useState<"ntp" | "websocket" | "none">("none");
  const playlistRef = useRef<any[]>([]);

  useEffect(() => {
    playlistRef.current = playlist;
  }, [playlist]);
  // Playlist State & Syncing Ref
  const [syncProgress, setSyncProgress] = useState<number | null>(null);
  const isSyncingRef = useRef(false);
  // Track previous sleeping state to avoid redundant setState
  const prevSleepingRef = useRef(false);

  // Load configuration from AsyncStorage on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        let storedIp = await AsyncStorage.getItem("serverIp");
        let storedPort = await AsyncStorage.getItem("serverPort");
        let storedId = await AsyncStorage.getItem("deviceId");
        let storedKey = await AsyncStorage.getItem("apiKey");
        let storedName = await AsyncStorage.getItem("deviceName");

        // Hỗ trợ ghi đè qua URL query parameter trên Web để giả lập nhiều màn hình
        if (typeof window !== "undefined" && window.location) {
          const urlParams = new URLSearchParams(window.location.search);
          const urlDeviceId = urlParams.get("deviceId") || urlParams.get("deviceid");
          const urlApiKey = urlParams.get("apiKey") || urlParams.get("apikey");
          const urlDeviceName = urlParams.get("deviceName") || urlParams.get("devicename");
          const urlServerIp = urlParams.get("serverIp") || urlParams.get("serverip") || urlParams.get("ip");
          const urlServerPort = urlParams.get("serverPort") || urlParams.get("serverport") || urlParams.get("port");
          const urlSyncMode = urlParams.get("syncMode") || urlParams.get("syncmode");
          
          if (urlDeviceId) {
            storedId = urlDeviceId;
            console.log(`[Web Simulator] Ghi đè deviceId từ URL: ${urlDeviceId}`);
          }
          if (urlApiKey) {
            storedKey = urlApiKey;
            console.log(`[Web Simulator] Ghi đè apiKey từ URL: ${urlApiKey}`);
          }
          if (urlDeviceName) {
            storedName = urlDeviceName;
            console.log(`[Web Simulator] Ghi đè deviceName từ URL: ${urlDeviceName}`);
          }
          if (urlServerIp) {
            storedIp = urlServerIp;
            console.log(`[Web Simulator] Ghi đè serverIp từ URL: ${urlServerIp}`);
          }
          if (urlServerPort) {
            storedPort = urlServerPort;
            console.log(`[Web Simulator] Ghi đè serverPort từ URL: ${urlServerPort}`);
          }
          
          if (urlSyncMode === "websocket") {
            setSyncMode("websocket");
            console.log(`[Web Simulator] Đồng bộ: Sử dụng WebSockets (Master-Slave)`);
          } else if (urlSyncMode === "ntp") {
            setSyncMode("ntp");
            console.log(`[Web Simulator] Đồng bộ: Sử dụng NTP Clock`);
          } else {
            setSyncMode("none");
            console.log(`[Web Simulator] Đồng bộ: ĐÃ TẮT NTP (Chạy độc lập)`);
          }

          // Trên Web, nếu đang chạy local (localhost/127.0.0.1) thì tự động ưu tiên dùng hostname của trình duyệt làm serverIp
          if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
            storedIp = window.location.hostname;
            console.log(`[Web Simulator] Đang chạy localhost, tự động ưu tiên serverIp theo hostname: ${storedIp}`);
          } else if (!storedIp && window.location.hostname) {
            storedIp = window.location.hostname;
            console.log(`[Web Simulator] Tự động cấu hình serverIp theo hostname: ${storedIp}`);
          }
        }

        if (storedIp) setFormIp(storedIp);
        if (storedPort) setFormPort(storedPort);
        if (storedId) setDeviceId(storedId);
        if (storedKey) setApiKey(storedKey);
        if (storedName) {
          setFormName(storedName);
          setRegisteredDeviceName(storedName);
        }

        // Nếu có deviceId nhưng thiếu apiKey, tự động chuyển về màn hình đăng ký để liên kết lại
        if (storedId && !storedKey) {
          console.warn("[Register Check] Phát hiện có deviceId nhưng thiếu apiKey. Tự động chuyển về màn hình đăng ký.");
          setActiveTab("register");
        }

        // Đọc cấu hình Menu Gesture
        const storedGesture =
          (await AsyncStorage.getItem("menuGestureEnabled")) === "true";
        setMenuGestureEnabled(storedGesture);

        // Đọc cấu hình Sleep
        const storedSleepEnabled =
          (await AsyncStorage.getItem("sleep_schedule_enabled")) === "true";
        const storedSleepStart =
          (await AsyncStorage.getItem("sleep_start_time")) || "22:00";
        const storedSleepEnd =
          (await AsyncStorage.getItem("sleep_end_time")) || "06:00";
        setSleepScheduleEnabled(storedSleepEnabled);
        setSleepStartTime(storedSleepStart);
        setSleepEndTime(storedSleepEnd);

        // Đọc playlist cục bộ đã lưu
        const localPl = await getLocalPlaylist();
        setPlaylist(localPl);

        // Load sync group configurations
        const storedIsSync = await AsyncStorage.getItem("is_sync_group");
        setIsSyncGroup(storedIsSync === "true");

        const storedSyncLayout = await AsyncStorage.getItem("sync_layout");
        if (storedSyncLayout) {
          try {
            setSyncLayout(JSON.parse(storedSyncLayout));
          } catch (_) {
            setSyncLayout(null);
          }
        } else {
          setSyncLayout(null);
        }
      } catch (e) {
        console.error(
          "Lỗi khi tải cấu hình từ AsyncStorage hoặc xoay màn hình:",
          e,
        );
      }
    };
    loadConfig();
  }, []);

  // Check Sleep status loop — only call setIsSleeping when value actually changes
  useEffect(() => {
    const checkSleep = () => {
      if (!sleepScheduleEnabled) {
        if (prevSleepingRef.current !== false) {
          prevSleepingRef.current = false;
          setIsSleeping(false);
        }
        return;
      }

      const now = new Date();
      const currentMin = now.getHours() * 60 + now.getMinutes();

      const [startH, startM] = sleepStartTime.split(":").map(Number);
      const [endH, endM] = sleepEndTime.split(":").map(Number);

      const startMin = (startH || 0) * 60 + (startM || 0);
      const endMin = (endH || 0) * 60 + (endM || 0);

      let sleeping = false;
      if (startMin < endMin) {
        sleeping = currentMin >= startMin && currentMin < endMin;
      } else {
        sleeping = currentMin >= startMin || currentMin < endMin;
      }

      // Only trigger re-render when sleeping state actually changes
      if (prevSleepingRef.current !== sleeping) {
        prevSleepingRef.current = sleeping;
        setIsSleeping(sleeping);
      }
    };

    checkSleep();
    const interval = setInterval(checkSleep, 10000);
    return () => clearInterval(interval);
  }, [sleepScheduleEnabled, sleepStartTime, sleepEndTime]);

  // Refresh Menu Gesture when returning from settings
  useEffect(() => {
    if (activeTab === null) {
      const refreshGesture = async () => {
        try {
          const storedGesture =
            (await AsyncStorage.getItem("menuGestureEnabled")) === "true";
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
      await AsyncStorage.removeItem("deviceId");
      await AsyncStorage.removeItem("apiKey");
      await AsyncStorage.removeItem("deviceName");
      setDeviceId(null);
      setApiKey(null);
      setFormName("");
      setRegisteredDeviceName("");
      setActiveTab("register");
    } catch (e) {
      console.error("Lỗi khi xóa cấu hình thiết bị:", e);
    }
  };

  const handleClearProgram = useCallback(async () => {
    try {
      const currentHash =
        (await AsyncStorage.getItem("local_sync_hash")) || "empty";
      if (currentHash !== "empty") {
        await AsyncStorage.setItem("ignored_sync_hash", currentHash);
        console.log(
          `[Sync] Đã lưu ignored_sync_hash: ${currentHash} để chặn đồng bộ lại chương trình vừa xóa.`,
        );
      }
      await AsyncStorage.setItem("local_playlist", JSON.stringify([]));
      await AsyncStorage.setItem("local_sync_hash", "empty");
      setPlaylist([]);
    } catch (e) {
      console.error("Lỗi khi xóa chương trình phát cục bộ:", e);
    }
  }, []);

  // Báo cáo tiến độ đồng bộ về Server realtime
  const reportSyncProgress = useCallback(
    async (progress: number, status: string) => {
      if (!deviceId || !apiKey) return;
      try {
        await fetch(`http://${formIp}:${formPort}/api/player/heartbeat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            deviceId,
            apiKey,
            syncStatus: status,
            syncProgress: progress,
          }),
        });
      } catch (err) {
        console.warn("[Sync] Lỗi báo cáo tiến trình sync lên server:", err);
      }
    },
    [deviceId, apiKey, formIp, formPort],
  );

  // Heartbeat loop when device is registered
  useEffect(() => {
    let interval: any = null;

    const sendHeartbeat = async () => {
      if (!deviceId) return;
      if (!apiKey) {
        console.warn("[Heartbeat] Có deviceId nhưng thiếu apiKey. Chuyển về màn hình đăng ký.");
        setActiveTab("register");
        return;
      }

      try {
        const response = await fetch(
          `http://${formIp}:${formPort}/api/player/heartbeat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              deviceId,
              apiKey,
              cpuUsage: Math.floor(Math.random() * 15) + 5, // Mock CPU 5% - 20%
              freeMemoryMb: Math.floor(Math.random() * 200) + 400, // Mock Free RAM 400MB - 600MB
            }),
          },
        );

        if (!response.ok) {
          console.warn("Gửi heartbeat thất bại, status:", response.status);
          if (response.status === 401) {
            console.error(
              "Thiết bị bị từ chối bởi Server (401). Tiến hành đăng xuất...",
            );
            await handleLogout();
          }
        } else {
          console.log("Gửi heartbeat thành công");
          const data = await response.json();
          if (data) {
            // Đồng bộ tên thiết bị từ Server
            if (data.deviceName) {
              setRegisteredDeviceName(data.deviceName);
              setFormName(data.deviceName);
              await AsyncStorage.setItem("deviceName", data.deviceName);
            }

            await AsyncStorage.setItem(
              "security_use_pass",
              data.useSecurityPassword ? "true" : "false",
            );
            if (data.securityPassword) {
              await AsyncStorage.setItem(
                "security_pass_val",
                data.securityPassword,
              );
            } else if (data.useSecurityPassword) {
              // Fallback mã PIN mặc định là '0000' nếu admin chưa cấu hình PIN trong profile
              await AsyncStorage.setItem("security_pass_val", "0000");
            } else {
              await AsyncStorage.removeItem("security_pass_val");
            }

            // Đồng bộ cấu hình Sleep từ Heartbeat
            const serverSleepEnabled = !!data.sleepScheduleEnabled;
            const serverSleepStart = data.sleepStartTime || "22:00";
            const serverSleepEnd = data.sleepEndTime || "06:00";

            setSleepScheduleEnabled(serverSleepEnabled);
            setSleepStartTime(serverSleepStart);
            setSleepEndTime(serverSleepEnd);

            await AsyncStorage.setItem(
              "sleep_schedule_enabled",
              serverSleepEnabled ? "true" : "false",
            );
            await AsyncStorage.setItem("sleep_start_time", serverSleepStart);
            await AsyncStorage.setItem("sleep_end_time", serverSleepEnd);

            // Xử lý kiểm tra và đồng bộ hóa Playlist dựa trên syncHash
            const serverHash = data.syncHash || "empty";
            const localHash =
              (await AsyncStorage.getItem("local_sync_hash")) || "empty";
            const ignoredHash =
              (await AsyncStorage.getItem("ignored_sync_hash")) || "";

            // Nếu server hash thay đổi khác với ignoredHash, xóa ignoredHash để nhận chương trình mới
            if (
              serverHash !== "empty" &&
              serverHash !== ignoredHash &&
              ignoredHash !== ""
            ) {
              await AsyncStorage.removeItem("ignored_sync_hash");
              console.log(
                `[Sync] Phát hiện syncHash mới từ CMS: ${serverHash}. Đã xóa ignored_sync_hash.`,
              );
            }

            const activeIgnoredHash =
              (await AsyncStorage.getItem("ignored_sync_hash")) || "";

            if (
              serverHash !== localHash &&
              serverHash !== activeIgnoredHash &&
              !isSyncingRef.current
            ) {
              console.log(
                `[Sync] Phát hiện syncHash thay đổi: Server=${serverHash}, Local=${localHash}. Bắt đầu đồng bộ ngầm...`,
              );
              isSyncingRef.current = true;
              setSyncProgress(0);
              reportSyncProgress(0, "syncing");

              // Watchdog: Tự động giải phóng trạng thái sync nếu bị treo quá 3 phút (180s)
              const watchdogTimer = setTimeout(() => {
                if (isSyncingRef.current) {
                  console.warn(
                    "[Sync] Watchdog: Đồng bộ playlist chạy quá 3 phút, tự động giải phóng khóa.",
                  );
                  isSyncingRef.current = false;
                  setSyncProgress(null);
                  reportSyncProgress(0, "error");
                }
              }, 180000);

              try {
                const updatedPl = await syncPlaylist(
                  formIp,
                  formPort,
                  deviceId,
                  apiKey,
                  serverHash,
                  (progress) => {
                    setSyncProgress(progress);
                    if (progress < 100) {
                      reportSyncProgress(progress, "syncing");
                    }
                  },
                );
                if (updatedPl !== null) {
                  setPlaylist(updatedPl.playlist);
                  // Nếu sync group, lưu meta + offset
                  if (updatedPl.syncMeta) {
                    const offset = updatedPl.syncMeta.serverTime - Date.now();
                    setClockOffset(offset);
                  }
                  reportSyncProgress(100, "playing");
                } else {
                  reportSyncProgress(0, "error");
                }
              } catch (syncErr) {
                console.error(
                  "[Sync] Lỗi khi tải và lưu cache playlist:",
                  syncErr,
                );
                reportSyncProgress(0, "error");
              } finally {
                clearTimeout(watchdogTimer);
                isSyncingRef.current = false;
                // Đợi 1 giây để thanh loading đạt 100% hiển thị mượt mà
                setTimeout(() => {
                  setSyncProgress(null);
                }, 1000);
              }
            }
          }
        }
      } catch (err) {
        console.warn("Lỗi kết nối khi gửi heartbeat:", err);
      }
    };

    if (deviceId && apiKey) {
      sendHeartbeat();
      interval = setInterval(sendHeartbeat, 10000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [deviceId, apiKey, formIp, formPort]);

  // 1. NTP Time synchronization loop
  useEffect(() => {
    if (syncMode !== "ntp") {
      setClockOffset(0);
      return;
    }

    let interval: any = null;

    const syncTime = async () => {
      if (!formIp || !formPort || !deviceId) return;
      try {
        const startTime = Date.now();
        const response = await fetch(
          `http://${formIp}:${formPort}/api/player/time`,
        );
        const endTime = Date.now();
        if (response.ok) {
          const data = await response.json();
          const rtt = endTime - startTime;
          const offset =
            data.serverTime - Math.round((endTime + startTime) / 2);
          setClockOffset(offset);
          console.log(
            `[NTP Sync] ServerTime: ${data.serverTime}, LocalTime: ${endTime}, RTT: ${rtt}ms, ClockOffset: ${offset}ms`,
          );
        }
      } catch (err) {
        console.warn("Lỗi kết nối khi đồng bộ thời gian (NTP):", err);
      }
    };

    syncTime();
    // Sync time every 5 minutes (300000ms)
    interval = setInterval(syncTime, 300000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [formIp, formPort, deviceId, syncMode]);

  // NOTE: Playlist sync is handled via Heartbeat-based syncHash detection (above).
  // The heartbeat loop (10s interval) checks if syncHash changed → triggers syncPlaylist()
  // from syncManager.ts which correctly handles Platform.OS, R2 URLs, isSyncGroup, and syncLayout.
  // A separate polling sync loop was removed to eliminate race conditions and duplicate API calls.

  const handleSetFormIp = async (ip: string) => {
    setFormIp(ip);
    try {
      await AsyncStorage.setItem("serverIp", ip);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetFormPort = async (port: string) => {
    setFormPort(port);
    try {
      await AsyncStorage.setItem("serverPort", port);
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
  const handleRegisterSuccess = async (
    id: string,
    key: string,
    name: string,
  ) => {
    try {
      await AsyncStorage.setItem("deviceId", id);
      await AsyncStorage.setItem("apiKey", key);
      await AsyncStorage.setItem("deviceName", name);

      setDeviceId(id);
      setApiKey(key);
      setFormName(name);
      setRegisteredDeviceName(name);

      triggerToast();
      // Không tự động đóng tab Register, hiển thị giao diện kích hoạt ngay tại đây
    } catch (e) {
      console.error("Lỗi lưu thông tin sau đăng ký thành công:", e);
    }
  };

  // Stable callback to avoid re-creating on every render
  const handleRelaunchRequest = useCallback(() => setActiveTab(null), []);

  // Screen orientation/dimensions
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const isLandscape = screenWidth > screenHeight;

  return (
    <TouchableWithoutFeedback onPress={handleScreenTouch}>
      <View style={styles.container}>
        <StatusBar style="dark" />

        {/* Dynamic content rendering based on activeTab */}
        <View style={styles.contentArea}>
          {activeTab === null ? (
            (playlist.length > 0 && deviceId && apiKey) ? (
              <AdPlayerScreen
                isLandscape={isLandscape}
                onRelaunchRequest={handleRelaunchRequest}
                isSleeping={isSleeping}
                playlist={playlist}
                deviceId={deviceId}
                isSyncGroup={isSyncGroup}
                syncLayout={syncLayout}
                clockOffset={clockOffset}
                syncMode={syncMode}
                serverIp={formIp}
                serverPort={formPort}
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
          ) : activeTab === "register" ? (
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
          ) : activeTab === "settings" ? (
            <SettingsScreen
              isLandscape={isLandscape}
              formIp={formIp}
              formPort={formPort}
              formName={formName}
              onBack={() => setActiveTab(null)}
              onLogout={handleLogout}
              onClearProgram={handleClearProgram}
            />
          ) : activeTab === "network" ? (
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
            if (tab === "exit") {
              setShowExitModal(true);
            } else if (tab === "settings" || tab === "network") {
              try {
                const useSecStr =
                  await AsyncStorage.getItem("security_use_pass");
                const secPass = await AsyncStorage.getItem("security_pass_val");
                if (useSecStr === "true" && secPass) {
                  setCorrectPin(secPass);
                  setPendingTab(tab);
                  setIsLocked(true);
                } else {
                  setActiveTab(tab);
                }
              } catch (e) {
                console.error("Lỗi kiểm tra bảo mật tab:", e);
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
            ]}>
            <Text style={styles.toastIcon}>✓</Text>
            <Text style={styles.toastText}>Đăng ký thiết bị thành công!</Text>
          </Animated.View>
        )}

        {/* SLEEP COVER OVERLAY */}
        {isSleeping && (
          <View style={styles.sleepOverlay}>
            <Text style={styles.sleepOverlayText}>
              📺 Đang trong chế độ nghỉ tiết kiệm điện...
            </Text>
          </View>
        )}

        {/* SYNC PROGRESS OVERLAY */}
        {syncProgress !== null && (
          <View style={styles.syncOverlay}>
            <View style={styles.syncBox}>
              <Text style={styles.syncTitle}>
                📥 Đang đồng bộ nội dung mới...
              </Text>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${syncProgress}%` },
                  ]}
                />
              </View>
              <Text style={styles.syncPercent}>{syncProgress}%</Text>
              <Text style={styles.syncSubtitle}>
                Vui lòng giữ thiết bị kết nối mạng
              </Text>
            </View>
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
    position: "absolute",
    bottom: 104,
    alignSelf: "center",
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
    zIndex: 999,
  },
  toastIcon: {
    fontSize: 18,
    color: colors.success,
    fontWeight: "bold",
  },
  toastText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  sleepOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99999,
  },
  sleepOverlayText: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "600",
  },
  syncOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(10, 15, 30, 0.92)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 99999,
  },
  syncBox: {
    width: "80%",
    maxWidth: 420,
    backgroundColor: "rgba(30, 41, 59, 0.75)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
  },
  syncTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  progressBarBg: {
    width: "100%",
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.success,
    borderRadius: 4,
  },
  syncPercent: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 8,
  },
  syncSubtitle: {
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
