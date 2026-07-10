import { cookieStorage } from './cookie';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface RequestOptions extends RequestInit {
  useMultipart?: boolean;
}

export const api = {
  request: async (endpoint: string, options: RequestOptions = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Thiết lập headers mặc định
    const headers = new Headers(options.headers || {});
    
    // Tự động chèn AccessToken nếu có
    const token = cookieStorage.getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    // Nếu không phải gửi file multipart, mặc định là application/json
    if (!options.useMultipart && !headers.has('Content-Type') && options.body) {
      headers.set('Content-Type', 'application/json');
    }

    const { useMultipart, ...restOptions } = options;
    const config: RequestInit = {
      ...restOptions,
      headers,
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        if (endpoint === '/api/auth/login') {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Thông tin đăng nhập không chính xác.');
        }

        // Nếu token hết hạn hoặc không hợp lệ, xóa session và reload/redirect sang login
        if (typeof window !== 'undefined') {
          cookieStorage.clearAll();
          // Chỉ redirect khi không phải đang ở trang login
          if (!window.location.pathname.startsWith('/login')) {
            window.location.href = '/login';
          }
        }
        throw new Error('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
      }


      // Xử lý lỗi trả về từ NestJS (thường có format: { statusCode, message, error })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Lỗi hệ thống (${response.status})`);
      }

      // Đọc phản hồi dưới dạng text để xử lý an toàn trường hợp body rỗng
      const text = await response.text();
      if (!text) {
        return null;
      }
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    } catch (error: unknown) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  },

  get: (endpoint: string, options: RequestOptions = {}) => {
    return api.request(endpoint, { ...options, method: 'GET' });
  },

  post: (endpoint: string, body: unknown, options: RequestOptions = {}) => {
    return api.request(endpoint, {
      ...options,
      method: 'POST',
      body: options.useMultipart ? (body as BodyInit) : JSON.stringify(body),
    });
  },

  put: (endpoint: string, body: unknown, options: RequestOptions = {}) => {
    return api.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  delete: (endpoint: string, options: RequestOptions = {}) => {
    return api.request(endpoint, { ...options, method: 'DELETE' });
  },
};

export const getFileUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${API_BASE_URL}${url}`;
};

