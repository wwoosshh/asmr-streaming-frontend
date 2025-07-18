import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // 로그인 상태 확인
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('사용자 데이터 파싱 오류:', error);
        handleLogout();
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  return (
    <header style={{
      backgroundColor: '#2c3e50',
      padding: '1rem 0',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
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
              <span style={{ color: '#fff' }}>
                안녕하세요, {user.username}님!
              </span>
              <button
                onClick={handleLogout}
                style={{
                  color: '#fff',
                  backgroundColor: 'transparent',
                  border: '1px solid #fff',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#34495e'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link 
              to="/auth" 
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
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;