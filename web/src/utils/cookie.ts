import Cookies from 'js-cookie';

const ACCESS_TOKEN_KEY = 'cms_access_token';
const REFRESH_TOKEN_KEY = 'cms_refresh_token';
const USER_INFO_KEY = 'cms_user_info';

export const cookieStorage = {
  getAccessToken: () => Cookies.get(ACCESS_TOKEN_KEY),
  
  setAccessToken: (token: string) => {
    Cookies.set(ACCESS_TOKEN_KEY, token, { expires: 1/24, secure: true, sameSite: 'strict' }); // 1 giờ
  },

  getRefreshToken: () => Cookies.get(REFRESH_TOKEN_KEY),

  setRefreshToken: (token: string) => {
    Cookies.set(REFRESH_TOKEN_KEY, token, { expires: 7, secure: true, sameSite: 'strict' }); // 7 ngày
  },

  getUserInfo: () => {
    const info = Cookies.get(USER_INFO_KEY);
    try {
      return info ? JSON.parse(info) : null;
    } catch {
      return null;
    }
  },

  setUserInfo: (user: any) => {
    Cookies.set(USER_INFO_KEY, JSON.stringify(user), { expires: 7, secure: true, sameSite: 'strict' });
  },

  clearAll: () => {
    Cookies.remove(ACCESS_TOKEN_KEY);
    Cookies.remove(REFRESH_TOKEN_KEY);
    Cookies.remove(USER_INFO_KEY);
  }
};
