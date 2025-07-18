import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { API_BASE_URL } from '../config/api';
import ContentDescription from '../components/ContentDescription';

const Home = () => {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    try {
      console.log('컨텐츠 목록 요청 중...');
      const response = await api.get('/api/contents');
      console.log('컨텐츠 응답:', response.data);
      setContents(response.data);
      setError(null);
    } catch (error) {
      console.error('컨텐츠 로딩 오류:', error);
      setError('컨텐츠를 불러오는 중 오류가 발생했습니다.');
      setContents([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '50px' }}>로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '50px', color: '#dc3545' }}>
          {error}
          <br />
          <button onClick={fetchContents} style={{ marginTop: '10px' }}>
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h2>ASMR 컨텐츠</h2>
      
      {contents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>등록된 컨텐츠가 없습니다.</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '20px',
          marginTop: '20px'
        }}>
          {contents.map(content => (
            <Link 
              key={content.id} 
              to={`/content/${content.id}`} 
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s'
              }}>
                <img 
                  src={`${API_BASE_URL}/api/audio/image-main/${content.id}`}
                  alt={content.title}
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                    marginBottom: '15px'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                
                <h3 style={{ margin: '0 0 10px 0' }}>{content.title}</h3>
                <div style={{ color: '#666', margin: '10px 0' }}>
                  <ContentDescription description={content.description} />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0', fontSize: '14px' }}>
                  <span>
                    {Math.floor(content.duration_minutes / 60)}시간 {content.duration_minutes % 60}분
                  </span>
                  <span style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}>
                    {content.content_rating}
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: '15px', fontSize: '14px', color: '#666' }}>
                  <span>👁️ {content.view_count?.toLocaleString() || 0}</span>
                  <span>❤️ {content.like_count?.toLocaleString() || 0}</span>
                  <span>📁 {content.total_files}개 파트</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;