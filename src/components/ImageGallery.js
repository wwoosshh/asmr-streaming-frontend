import React, { useState, useEffect } from 'react';
import api, { API_BASE_URL } from '../config/api';

const ImageGallery = ({ contentId }) => {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (contentId) {
      fetchImages();
    }
  }, [contentId]);

  const fetchImages = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('이미지 목록 요청:', contentId);
      const response = await api.get(`/api/audio/images/${contentId}`);
      console.log('이미지 목록 응답:', response.data);
      
      if (response.data.images && response.data.images.length > 0) {
        setImages(response.data.images);
        setCurrentIndex(0);
      } else {
        setError('이미지를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('이미지 목록 로딩 오류:', error);
      setError('이미지를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const goToImage = (index) => {
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        이미지 로딩 중...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: '#dc3545' }}>
        {error}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        이미지가 없습니다.
      </div>
    );
  }

  const currentImage = images[currentIndex];

  return (
    <div style={{ 
      backgroundColor: 'white', 
      borderRadius: '8px', 
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      {/* 메인 이미지 영역 */}
      <div style={{ 
        position: 'relative', 
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <img 
          src={`${API_BASE_URL}${currentImage.url}`}
          alt={`이미지 ${currentIndex + 1}`}
          style={{
            maxWidth: '100%',
            maxHeight: '500px',
            objectFit: 'contain',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
          onError={(e) => {
            console.log('이미지 로딩 실패:', e.target.src);
            e.target.style.display = 'none';
          }}
        />
        
        {/* 이전/다음 버튼 (이미지가 2개 이상일 때만 표시) */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(0,0,0,0.5)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                fontSize: '18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ‹
            </button>
            
            <button
              onClick={goToNext}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(0,0,0,0.5)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                fontSize: '18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ›
            </button>
          </>
        )}
        
        {/* 이미지 인덱스 표시 */}
        {images.length > 1 && (
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '14px'
          }}>
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* 썸네일 목록 (이미지가 2개 이상일 때만 표시) */}
      {images.length > 1 && (
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
              style={{
                border: index === currentIndex ? '2px solid #007bff' : '2px solid transparent',
                borderRadius: '4px',
                padding: '2px',
                cursor: 'pointer',
                backgroundColor: 'transparent'
              }}
            >
              <img 
                src={`${API_BASE_URL}${image.url}`}
                alt={`썸네일 ${index + 1}`}
                style={{
                  width: '60px',
                  height: '60px',
                  objectFit: 'cover',
                  borderRadius: '2px',
                  opacity: index === currentIndex ? 1 : 0.7
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </button>
          ))}
        </div>
      )}

      {/* 이미지 정보 */}
      <div style={{ 
        marginTop: '15px', 
        textAlign: 'center',
        fontSize: '14px',
        color: '#666'
      }}>
        {currentImage.isMain ? (
          <span style={{ 
            backgroundColor: '#28a745', 
            color: 'white', 
            padding: '2px 8px', 
            borderRadius: '12px',
            fontSize: '12px'
          }}>
            메인 이미지
          </span>
        ) : (
          <span>추가 이미지 #{currentImage.index}</span>
        )}
      </div>
    </div>
  );
};

export default ImageGallery;