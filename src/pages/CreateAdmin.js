import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';

const CreateAdmin = () => {
  const [formData, setFormData] = useState({
    secretKey: '',
    username: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (!formData.secretKey || !formData.username || !formData.email || !formData.password) {
      setError('모든 필드를 입력해주세요.');
      return false;
    }
    
    if (formData.username.length < 2 || formData.username.length > 20) {
      setError('사용자명은 2-20자 사이여야 합니다.');
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
      const response = await api.post('/api/auth/create-admin', formData);
      
      setSuccess(`관리자 계정이 성공적으로 생성되었습니다!
사용자명: ${response.data.username}
이메일: ${response.data.email}
권한: ${response.data.role}`);
      
      setFormData({
        secretKey: '',
        username: '',
        email: '',
        password: ''
      });
      
    } catch (error) {
      console.error('관리자 계정 생성 오류:', error);
      
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError('관리자 계정 생성 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ marginTop: '20px' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#856404' }}>⚠️ 임시 관리자 계정 생성</h3>
          <p style={{ margin: 0, color: '#856404', fontSize: '14px' }}>
            이 페이지는 개발/테스트 목적으로만 사용하세요.<br />
            프로덕션 환경에서는 보안상 이 기능을 제거해야 합니다.
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px' }}>관리자 계정 생성</h2>
          
          {error && (
            <div style={{
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
              border: '1px solid #c3e6cb',
              whiteSpace: 'pre-line'
            }}>
              {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                보안 키 *
              </label>
              <input
                type="password"
                name="secretKey"
                value={formData.secretKey}
                onChange={handleChange}
                placeholder="create_admin_2024"
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
              <small style={{ color: '#666', fontSize: '12px' }}>
                힌트: create_admin_2024
              </small>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                관리자 사용자명 *
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="admin (2-20자)"
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
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                관리자 이메일 *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@example.com"
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
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                관리자 비밀번호 *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="6자 이상 입력해주세요"
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
            
            <button 
              type="submit" 
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: loading ? '#6c757d' : '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '15px'
              }}
            >
              {loading ? '생성 중...' : '관리자 계정 생성'}
            </button>
          </form>
          
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAdmin;