import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AudioPlayer from '../components/AudioPlayer';

const ContentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      fetchContent();
    }
  }, [id]);

  const fetchContent = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('컨텐츠 요청:', id);
      const response = await axios.get(`http://localhost:5159/api/contents/${id}`);
      console.log('컨텐츠 응답:', response.data);
      setContent(response.data);
    } catch (error) {
      console.error('컨텐츠 로딩 오류:', error);
      if (error.response?.status === 404) {
        setError('컨텐츠를 찾을 수 없습니다.');
      } else {
        setError('컨텐츠를 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">컨텐츠 로딩 중...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-container">
        <div className="error">{error}</div>
        <button onClick={() => navigate('/')}>홈으로 돌아가기</button>
      </div>
    );
  }
  
  if (!content) {
    return (
      <div className="error-container">
        <div className="error">컨텐츠 데이터가 없습니다.</div>
        <button onClick={() => navigate('/')}>홈으로 돌아가기</button>
      </div>
    );
  }

  return (
    <div className="content-detail">
      <div className="container">
        <button onClick={() => navigate('/')} className="back-button">
          ← 돌아가기
        </button>
        
        <div className="content-header">
          <div className="content-image-container">
            <img 
              src={`http://localhost:5159/api/audio/image/${content.id}`}
              alt={content.title}
              className="content-main-image"
              onError={(e) => {
                console.log('이미지 로딩 실패');
                e.target.style.display = 'none';
              }}
              onLoad={() => {
                console.log('이미지 로딩 성공');
              }}
            />
          </div>
          
          <div className="content-info-detail">
            <h1>{content.title}</h1>
            <p className="content-description-detail">{content.description}</p>
            
            <div className="content-metadata">
              <div className="meta-item">
                <span className="meta-label">재생시간:</span>
                <span>{Math.floor(content.duration_minutes / 60)}시간 {content.duration_minutes % 60}분</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">수위:</span>
                <span className="rating-badge">{content.content_rating}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">파일 수:</span>
                <span>{content.total_files}개</span>
              </div>
            </div>
            
            <div className="content-stats-detail">
              <span>👁️ {content.view_count?.toLocaleString() || 0} 조회</span>
              <span>❤️ {content.like_count?.toLocaleString() || 0} 좋아요</span>
            </div>
          </div>
        </div>

        {/* 음성 플레이어 */}
        <div className="audio-player-section">
          <h3>재생</h3>
          <AudioPlayer contentId={content.id} totalFiles={content.total_files} />
        </div>

        {/* 태그 표시 */}
        {content.tags && content.tags.length > 0 && (
          <div className="tags-section">
            <h3>태그</h3>
            <div className="tags">
              {content.tags.map((tag, index) => (
                <span key={index} className="tag">
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentDetail;