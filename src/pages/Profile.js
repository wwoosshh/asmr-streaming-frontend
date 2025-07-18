import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    fetchUserInfo();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth');
      return;
    }
  };

  const fetchUserInfo = async () => {
    try {
      const response = await api.get('/api/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('사용자 정보 조회 오류:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/auth');
      } else {
        setError('사용자 정보를 불러올 수 없습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordFormChange = (e) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const validatePasswordForm = () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setError('모든 필드를 입력해주세요.');
      return false;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다.');
      return false;
    }

    if (passwordForm.newPassword.length < 6) {
      setError('새 비밀번호는 6자 이상이어야 합니다.');
      return false;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setError('새 비밀번호는 현재 비밀번호와 달라야 합니다.');
      return false;
    }

    return true;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!validatePasswordForm()) {
      return;
    }

    setPasswordLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.patch('/api/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword
      });

      setSuccess('비밀번호가 성공적으로 변경되었습니다.');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);
    } catch (error) {
      console.error('비밀번호 변경 오류:', error);
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError('비밀번호 변경 중 오류가 발생했습니다.');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin':
        return '관리자';
      case 'user':
        return '일반 회원';
      default:
        return role;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return '#dc3545';
      case 'user':
        return '#28a745';
      default:
        return '#6c757d';
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          사용자 정보를 불러오는 중...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div style={{ color: '#dc3545', marginBottom: '20px' }}>
            사용자 정보를 불러올 수 없습니다.
          </div>
          <button onClick={() => navigate('/')} style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer'
          }}>
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ marginTop: '20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h2>내 프로필</h2>
        
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
            border: '1px solid #c3e6cb'
          }}>
            {success}
          </div>
        )}

        {/* 사용자 기본 정보 */}
        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px' }}>기본 정보</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <strong style={{ display: 'inline-block', width: '100px' }}>사용자명:</strong>
            <span>{user.username}</span>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <strong style={{ display: 'inline-block', width: '100px' }}>이메일:</strong>
            <span>{user.email}</span>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <strong style={{ display: 'inline-block', width: '100px' }}>권한:</strong>
            <span style={{
              backgroundColor: getRoleBadgeColor(user.role),
              color: 'white',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '14px'
            }}>
              {getRoleDisplayName(user.role)}
            </span>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <strong style={{ display: 'inline-block', width: '100px' }}>가입일:</strong>
            <span>{new Date(user.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* 비밀번호 변경 섹션 */}
        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px' }}>보안 설정</h3>
          
          {!showPasswordForm ? (
            <button
              onClick={() => setShowPasswordForm(true)}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              비밀번호 변경
            </button>
          ) : (
            <form onSubmit={handlePasswordSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  현재 비밀번호 *
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordFormChange}
                  disabled={passwordLoading}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  새 비밀번호 *
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordFormChange}
                  disabled={passwordLoading}
                  placeholder="6자 이상 입력해주세요"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  새 비밀번호 확인 *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordFormChange}
                  disabled={passwordLoading}
                  placeholder="새 비밀번호를 다시 입력해주세요"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  style={{
                    backgroundColor: passwordLoading ? '#6c757d' : '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    cursor: passwordLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {passwordLoading ? '변경 중...' : '비밀번호 변경'}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordForm({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                    setError('');
                    setSuccess('');
                  }}
                  disabled={passwordLoading}
                  style={{
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    cursor: passwordLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  취소
                </button>
              </div>
            </form>
          )}
        </div>

        {/* 관리자 정보 (관리자인 경우에만 표시) */}
        {user.role === 'admin' && (
          <div style={{
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>👑 관리자 권한</h4>
            <p style={{ margin: 0, color: '#856404' }}>
              관리자 권한으로 사용자 관리, 컨텐츠 업로드 등의 기능을 사용할 수 있습니다.
            </p>
          </div>
        )}

        {/* 돌아가기 버튼 */}
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
  );
};

export default Profile;