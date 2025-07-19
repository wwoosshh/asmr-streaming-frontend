import axios from 'axios';

// 환경변수를 제대로 사용하도록 수정
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? (process.env.REACT_APP_LOCAL_API_URL || 'https://localhost:5159')
  : (process.env.REACT_APP_PROD_API_URL || 'https://58.233.102.165:5159');

console.log('🔧 API Configuration:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('API_BASE_URL:', API_BASE_URL);
console.log('Environment Variables:', {
  REACT_APP_LOCAL_API_URL: process.env.REACT_APP_LOCAL_API_URL,
  REACT_APP_PROD_API_URL: process.env.REACT_APP_PROD_API_URL
});

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30초로 증가 (네트워크 지연 고려)
  // HTTPS 인증서 문제 해결을 위한 설정
  headers: {
    'Content-Type': 'application/json',
  }
});

// 요청 인터셉터 (토큰 자동 추가)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 요청 로깅 (디버그용)
    console.log('🚀 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`
    });
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 (에러 처리)
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      status: error.response?.status,
      message: error.message,
      url: error.config?.url,
      fullURL: `${error.config?.baseURL}${error.config?.url}`,
      data: error.response?.data
    });
    
    if (error.response?.status === 401) {
      // 토큰 만료 시 로그아웃 처리
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // HTTPS 인증서 오류 특별 처리
    if (error.code === 'ERR_CERT_AUTHORITY_INVALID' || error.message.includes('certificate')) {
      console.error('🔒 HTTPS Certificate Error - Check if server certificate is valid');
    }
    
    // CORS 오류 특별 처리
    if (error.message.includes('CORS') || error.code === 'ERR_NETWORK') {
      console.error('🌐 Network/CORS Error - Check server CORS settings and network connectivity');
    }
    
    return Promise.reject(error);
  }
);

export { API_BASE_URL };
export default api;