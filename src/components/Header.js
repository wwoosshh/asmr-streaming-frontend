import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="container">
        <Link to="/" className="logo">
          <h1>ASMR Stream</h1>
        </Link>
        <nav className="nav">
          <Link to="/" className="nav-link">홈</Link>
          <Link to="/login" className="nav-link">로그인</Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;