import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import ContentDetail from './pages/ContentDetail';
import Auth from './pages/Auth';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/content/:id" element={<ContentDetail />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/login" element={<Auth />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;