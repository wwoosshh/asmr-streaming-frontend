import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../config/api';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'login';
  const [isLogin, setIsLogin] = useState(mode === 'login');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // URL 파라미터가 변경될 때 모드 업데이트
  useEffect(() => {
    setIsLogin(mode === 'login');
    setError('');
    setSuccess('');
    setFormData({ username: '', email: '', password: '', confirmPassword: '' });
  }, [mode]);

  // 이미 로그인된 사용자는 홈으로 리다이렉트
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (isLogin) {
      if (!formData.email || !formData.password) {
        setError('이메일과 비밀번호를 입력해주세요.');
        return false;
      }
    } else {
      if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
        setError('모든 필드를 입력해주세요.');
        return false;
      }
      
      if (formData.username.length < 2 || formData.username.length > 20) {
        setError('사용자명은 2-20자 사이여야 합니다.');
        return false;
      }
      
      if (formData.password !== formData.confirmPassword) {
        setError('비밀번호가 일치하지 않습니다.');
        return false;
      }
      
      if (formData.password.length < 6) {
        setError('비밀번호는 6자 이상이어야 합니다.');
        return false;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('유효하지 않은 이메일 형식입니다.');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      if (isLogin) {
        // 로그인
        console.log('로그인 시도:', { email: formData.email });
        const response = await api.post('/api/auth/login', {
          email: formData.email,
          password: formData.password
        });
        
        console.log('로그인 응답:', response.data);
        
        // 토큰과 사용자 정보 저장
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        setSuccess('로그인 성공!');
        
        // 권한에 따라 리다이렉트
        if (response.data.user.role === 'admin') {
          setTimeout(() => navigate('/admin'), 1000);
        } else {
          setTimeout(() => navigate('/'), 1000);
        }
      } else {
        // 회원가입
        console.log('회원가입 시도:', { 
          username: formData.username, 
          email: formData.email 
        });
        
        await api.post('/api/auth/register', {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        });
        
        setSuccess('회원가입이 완료되었습니다! 로그인해주세요.');
        // URL을 로그인 모드로 변경
        navigate('/auth?mode=login');
      }
    } catch (error) {
      console.error('인증 오류:', error);
      
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.response?.status === 401) {
        setError('이메일 또는 비밀번호가 잘못되었습니다.');
      } else if (error.response?.status >= 500) {
        setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      } else {
        setError('오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    const newMode = isLogin ? 'register' : 'login';
    navigate(`/auth?mode=${newMode}`);
  };

  return (
    <div className="auth">
      <div className="container">
        <div className="auth-form">
          <h2>{isLogin ? '로그인' : '회원가입'}</h2>
          
          {error && (
            <div className="error-message" style={{
              backgroundColor: '#f8d7da',
              color: '#721c24',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '20px',
              border: '1px solid #f5c6cb'
            }}>
              {error}
            </div>
          )}
          
          {success && (
            <div style={{
              backgroundColor: '#d4edda',
              color: '#155724',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '20px',
              border: '1px solid #c3e6cb'
            }}>
              {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="form-group">
                <label>사용자명 *</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="2-20자 사이로 입력해주세요"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px',
                    backgroundColor: loading ? '#f5f5f5' : 'white'
                  }}
                />
              </div>
            )}
            
            <div className="form-group">
              <label>이메일 *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@email.com"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                  backgroundColor: loading ? '#f5f5f5' : 'white'
                }}
              />
            </div>
            
            <div className="form-group">
              <label>비밀번호 *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={isLogin ? "비밀번호" : "6자 이상 입력해주세요"}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                  backgroundColor: loading ? '#f5f5f5' : 'white'
                }}
              />
            </div>
            
            {!isLogin && (
              <div className="form-group">
                <label>비밀번호 확인 *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="비밀번호를 다시 입력해주세요"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px',
                    backgroundColor: loading ? '#f5f5f5' : 'white'
                  }}
                />
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: loading ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '10px'
              }}
            >
              {loading ? '처리 중...' : (isLogin ? '로그인' : '회원가입')}
            </button>
          </form>
          
          <div className="auth-toggle" style={{ textAlign: 'center', marginTop: '20px' }}>
            <button 
              type="button" 
              onClick={toggleMode} 
              className="toggle-btn"
              disabled={loading}
              style={{
                background: 'none',
                border: 'none',
                color: '#007bff',
                textDecoration: 'underline',
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {isLogin ? '계정이 없으신가요? 회원가입하기' : '이미 계정이 있으신가요? 로그인하기'}
            </button>
          </div>
          
          {!isLogin && (
            <div style={{
              marginTop: '20px',
              padding: '12px',
              backgroundColor: '#e7f3ff',
              borderRadius: '4px',
              fontSize: '14px',
              color: '#0c5460'
            }}>
              <strong>회원 권한 안내:</strong><br />
              • 기본 회원: 댓글 작성, 문의 등 일반 서비스 이용<br />
              • 관리자 권한은 별도로 부여됩니다
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;