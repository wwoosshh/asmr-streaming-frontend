import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header = () => {
  const [user, setUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error('사용자 데이터 파싱 오류:', error);
        handleLogout();
      }
    } else {
      setUser(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setShowProfileMenu(false);
    navigate('/');
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  return (
    <header style={{
      backgroundColor: '#2c3e50',
      padding: '1rem 0',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      position: 'relative'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Link 
          to="/" 
          style={{ textDecoration: 'none' }}
        >
          <h1 style={{ color: '#fff', margin: 0 }}>ASMR Stream</h1>
        </Link>
        
        <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link 
            to="/" 
            style={{
              color: '#fff',
              textDecoration: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              transition: 'background-color 0.3s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#34495e'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            홈
          </Link>
          
          {user ? (
            <>
              {/* 관리자에게만 관리자 패널 링크 표시 */}
              {user.role === 'admin' && (
                <Link 
                  to="/admin" 
                  style={{
                    color: '#fff',
                    textDecoration: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    backgroundColor: '#e74c3c',
                    transition: 'background-color 0.3s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#c0392b'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#e74c3c'}
                >
                  관리자
                </Link>
              )}
              
              {/* 사용자 프로필 드롭다운 */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={toggleProfileMenu}
                  style={{
                    color: '#fff',
                    backgroundColor: 'transparent',
                    border: '1px solid #fff',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#34495e'}
                  onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  👤 {user.username}
                  {user.role === 'admin' && (
                    <span style={{ 
                      backgroundColor: '#e74c3c', 
                      padding: '2px 6px', 
                      borderRadius: '3px',
                      fontSize: '10px',
                      marginLeft: '4px'
                    }}>
                      관리자
                    </span>
                  )}
                </button>
                
                {/* 프로필 드롭다운 메뉴 */}
                {showProfileMenu && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: '0',
                    backgroundColor: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                    zIndex: 1000,
                    minWidth: '180px',
                    marginTop: '5px'
                  }}>
                    <Link
                      to="/profile"
                      style={{
                        display: 'block',
                        padding: '12px 16px',
                        color: '#333',
                        textDecoration: 'none',
                        borderBottom: '1px solid #eee'
                      }}
                      onClick={() => setShowProfileMenu(false)}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                      onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      👤 내 프로필
                    </Link>
                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        color: '#dc3545',
                        backgroundColor: 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                      onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      🚪 로그아웃
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* 로그인 버튼 */}
              <Link 
                to="/auth?mode=login"
                style={{
                  color: '#fff',
                  textDecoration: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: '1px solid #fff',
                  transition: 'background-color 0.3s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#34495e'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                로그인
              </Link>
              
              {/* 회원가입 버튼 */}
              <Link 
                to="/auth?mode=register"
                style={{
                  color: '#2c3e50',
                  backgroundColor: '#fff',
                  textDecoration: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  transition: 'background-color 0.3s'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#ecf0f1';
                  e.target.style.color = '#2c3e50';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#fff';
                  e.target.style.color = '#2c3e50';
                }}
              >
                회원가입
              </Link>
            </>
          )}
        </nav>
      </div>
      
      {/* 드롭다운 메뉴가 열려있을 때 배경 클릭으로 닫기 */}
      {showProfileMenu && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 999
          }}
          onClick={() => setShowProfileMenu(false)}
        />
      )}
    </header>
  );
};

export default Header;