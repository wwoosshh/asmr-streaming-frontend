import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../config/api';
import AudioPlayer from '../components/AudioPlayer';
import ImageGallery from '../components/ImageGallery';

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
      console.log('컨텐츠 상세 요청:', id);
      // 업데이트된 API 라우트 사용
      const response = await api.get(`/api/contents/detail/${id}`);
      console.log('컨텐츠 상세 응답:', response.data);
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
      <div className="container">
        <div style={{ textAlign: 'center', padding: '50px' }}>컨텐츠 로딩 중...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div style={{ color: '#dc3545', marginBottom: '20px' }}>{error}</div>
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
  
  if (!content) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div style={{ color: '#dc3545', marginBottom: '20px' }}>컨텐츠 데이터가 없습니다.</div>
          <button onClick={() => navigate('/')}>홈으로 돌아가기</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <button 
        onClick={() => navigate('/')} 
        style={{
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        ← 돌아가기
      </button>
      
      <div style={{ display: 'flex', gap: '30px', marginBottom: '30px' }}>
        {/* 이미지 갤러리 영역 */}
        <div style={{ flexShrink: 0, width: '350px' }}>
          <ImageGallery contentId={content.id} />
        </div>
        
        {/* 컨텐츠 정보 영역 */}
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>{content.title}</h1>
          <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '20px' }}>
            {content.description}
          </p>
          
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', marginBottom: '8px' }}>
              <span style={{ fontWeight: 'bold', marginRight: '10px', minWidth: '80px' }}>재생시간:</span>
              <span>{Math.floor(content.duration_minutes / 60)}시간 {content.duration_minutes % 60}분</span>
            </div>
            <div style={{ display: 'flex', marginBottom: '8px' }}>
              <span style={{ fontWeight: 'bold', marginRight: '10px', minWidth: '80px' }}>수위:</span>
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
            <div style={{ display: 'flex', marginBottom: '8px' }}>
              <span style={{ fontWeight: 'bold', marginRight: '10px', minWidth: '80px' }}>파일 수:</span>
              <span>{content.total_files}개</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '20px', fontSize: '16px' }}>
            <span>👁️ {content.view_count?.toLocaleString() || 0} 조회</span>
            <span>❤️ {content.like_count?.toLocaleString() || 0} 좋아요</span>
          </div>
        </div>
      </div>

      {/* 음성 플레이어 */}
      <div style={{ marginBottom: '30px' }}>
        <h3>재생</h3>
        <AudioPlayer contentId={content.id} totalFiles={content.total_files} />
      </div>

      {/* 태그 표시 */}
      {content.tags && content.tags.length > 0 && (
        <div>
          <h3>태그</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {content.tags.map((tag, index) => (
              <span 
                key={index} 
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontSize: '14px'
                }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentDetail;