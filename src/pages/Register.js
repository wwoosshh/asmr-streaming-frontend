import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // 입력 시 에러 메시지 제거
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 간단한 유효성 검사
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:5159/api/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password
      });

      console.log('회원가입 성공:', response.data);
      alert('회원가입이 완료되었습니다. 로그인해주세요.');
      navigate('/login');

    } catch (error) {
      console.error('회원가입 오류:', error);
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError('회원가입 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register">
      <div className="container">
        <h2>회원가입</h2>
        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div style={{ color: 'red', marginBottom: '15px', textAlign: 'center' }}>
              {error}
            </div>
          )}
          
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
          
          <div className="form-group">
            <label>비밀번호 확인:</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? '처리 중...' : '회원가입'}
          </button>
          
          <div style={{ textAlign: 'center', marginTop: '15px' }}>
            <Link to="/login">이미 계정이 있나요? 로그인</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;