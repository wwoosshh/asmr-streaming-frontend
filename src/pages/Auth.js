import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // 입력 시 에러 메시지 클리어
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isLogin) {
        // 로그인
        const response = await api.post('/api/auth/login', {
          email: formData.email,
          password: formData.password
        });
        
        // 토큰과 사용자 정보 저장
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        alert('로그인 성공!');
        navigate('/');
      } else {
        // 회원가입
        await api.post('/api/auth/register', {
          username: formData.username,
          email: formData.email,
          password: formData.password
        });
        
        alert('회원가입이 완료되었습니다. 로그인해주세요.');
        setIsLogin(true);
        setFormData({ username: '', email: '', password: '' });
      }
    } catch (error) {
      console.error('인증 오류:', error);
      setError(error.response?.data?.error || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({ username: '', email: '', password: '' });
    setError('');
  };

  return (
    <div className="auth">
      <div className="container">
        <div className="auth-form">
          <h2>{isLogin ? '로그인' : '회원가입'}</h2>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="form-group">
                <label>사용자명:</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            )}
            
            <div className="form-group">
              <label>이메일:</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label>비밀번호:</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            
            <button type="submit" disabled={loading}>
              {loading ? '처리 중...' : (isLogin ? '로그인' : '회원가입')}
            </button>
          </form>
          
          <div className="auth-toggle">
            <button type="button" onClick={toggleMode} className="toggle-btn">
              {isLogin ? '회원가입하기' : '로그인하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;