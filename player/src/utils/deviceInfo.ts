import * as Application from 'expo-application';
import * as Device from 'expo-device';
import * as Network from 'expo-network';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getHardwareId = async (): Promise<string> => {
  try {
    if (Platform.OS === 'android') {
      const androidId = Application.getAndroidId();
      if (androidId) {
        return androidId.substring(0, 17);
      }
    } else if (Platform.OS === 'ios') {
      let hardwareId = await AsyncStorage.getItem('hardware_id_ios');
      if (!hardwareId) {
        const vendorId = await Application.getIosIdForVendorAsync();
        if (vendorId) {
          hardwareId = vendorId.replace(/-/g, '').toLowerCase().substring(0, 16);
        } else {
          const chars = '0123456789abcdef';
          let randomPart = '';
          for (let i = 0; i < 16; i++) {
            randomPart += chars[Math.floor(Math.random() * chars.length)];
          }
          hardwareId = randomPart;
        }
        await AsyncStorage.setItem('hardware_id_ios', hardwareId);
      }
      return hardwareId;
    }
    
    let fallbackId = await AsyncStorage.getItem('hardware_id_fallback');
    if (!fallbackId) {
      const chars = '0123456789abcdef';
      let randomPart = '';
      for (let i = 0; i < 16; i++) {
        randomPart += chars[Math.floor(Math.random() * chars.length)];
      }
      fallbackId = randomPart;
      await AsyncStorage.setItem('hardware_id_fallback', fallbackId);
    }
    return fallbackId;
  } catch (err) {
    console.error('Error getting hardware ID:', err);
    return '0200000000000000';
  }
};

export const getIpAddress = async (): Promise<string> => {
  try {
    const ip = await Network.getIpAddressAsync();
    return ip || '127.0.0.1';
  } catch (err) {
    console.error('Error getting IP Address:', err);
    return '127.0.0.1';
  }
};
