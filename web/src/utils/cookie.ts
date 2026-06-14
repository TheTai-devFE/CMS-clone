import Cookies from 'js-cookie';
import { User } from '@/types/dashboard';

const ACCESS_TOKEN_KEY = 'cms_access_token';
const REFRESH_TOKEN_KEY = 'cms_refresh_token';
const USER_INFO_KEY = 'cms_user_info';

export const cookieStorage = {
  getAccessToken: () => Cookies.get(ACCESS_TOKEN_KEY),
  
  setAccessToken: (token: string) => {
    Cookies.set(ACCESS_TOKEN_KEY, token, { 
      expires: 1/24, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'lax' 
    }); // 1 giờ
  },

  getRefreshToken: () => Cookies.get(REFRESH_TOKEN_KEY),

  setRefreshToken: (token: string) => {
    Cookies.set(REFRESH_TOKEN_KEY, token, { 
      expires: 7, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'lax' 
    }); // 7 ngày
  },

  getUserInfo: (): User | null => {
    const info = Cookies.get(USER_INFO_KEY);
    try {
      return info ? JSON.parse(info) : null;
    } catch {
      return null;
    }
  },

  setUserInfo: (user: User) => {
    Cookies.set(USER_INFO_KEY, JSON.stringify(user), { 
      expires: 7, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'lax' 
    });
  },

  clearAll: () => {
    Cookies.remove(ACCESS_TOKEN_KEY);
    Cookies.remove(REFRESH_TOKEN_KEY);
    Cookies.remove(USER_INFO_KEY);
  }
};
