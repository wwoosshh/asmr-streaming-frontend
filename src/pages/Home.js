import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Home = () => {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    try {
      const response = await axios.get('http://localhost:5159/api/contents');
      setContents(response.data);
    } catch (error) {
      console.error('컨텐츠 로딩 중 오류:', error);
      setContents([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div className="home">
      <div className="container">
        <h2>ASMR 컨텐츠</h2>
        <div className="content-grid">
          {contents.length === 0 ? (
            <p>아직 등록된 컨텐츠가 없습니다.</p>
          ) : (
            contents.map(content => (
              <Link key={content.id} to={`/content/${content.id}`} className="content-link">
                <div className="content-card">
                  <img 
                    src={`http://localhost:5159${content.profile_image_url}`}
                    alt={content.title}
                    className="content-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className="content-info">
                    <h3>{content.title}</h3>
                    <p className="content-description">{content.description}</p>
                    <div className="content-meta">
                      <span className="duration">
                        {Math.floor(content.duration_minutes / 60)}시간 {content.duration_minutes % 60}분
                      </span>
                      <span className="rating">{content.content_rating}</span>
                    </div>
                    <div className="content-stats">
                      <span>👁️ {content.view_count}</span>
                      <span>❤️ {content.like_count}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;