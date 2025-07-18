// 📱 프론트엔드: src/components/ContentDescription.js (새 파일 생성)

import React from 'react';

const ContentDescription = ({ description }) => {
  // 이미지 URL을 감지하는 정규표현식
  const imageUrlRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|bmp)(?:\?[^\s]*)?)/gi;
  
  // 텍스트를 처리하는 함수
  const processDescription = (text) => {
    if (!text) return null;
    
    // 1. 개행 문자를 기준으로 분할
    const lines = text.split('\n');
    
    return lines.map((line, lineIndex) => {
      // 2. 각 줄에서 이미지 URL 찾기
      const parts = line.split(imageUrlRegex);
      
      return (
        <div key={lineIndex} style={{ marginBottom: '8px' }}>
          {parts.map((part, partIndex) => {
            // 3. 이미지 URL인지 확인
            if (imageUrlRegex.test(part)) {
              return (
                <div key={partIndex} style={{ margin: '10px 0' }}>
                  <img 
                    src={part}
                    alt="컨텐츠 이미지"
                    style={{
                      maxWidth: '100%',
                      height: 'auto',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      cursor: 'pointer'
                    }}
                    onError={(e) => {
                      // 이미지 로딩 실패 시 링크로 표시
                      e.target.style.display = 'none';
                      const linkElement = document.createElement('a');
                      linkElement.href = part;
                      linkElement.target = '_blank';
                      linkElement.rel = 'noopener noreferrer';
                      linkElement.textContent = '🖼️ 이미지 링크 (로딩 실패)';
                      linkElement.style.color = '#007bff';
                      linkElement.style.textDecoration = 'underline';
                      e.target.parentNode.appendChild(linkElement);
                    }}
                    onClick={(e) => {
                      // 이미지 클릭 시 새 탭에서 열기
                      window.open(part, '_blank', 'noopener,noreferrer');
                    }}
                  />
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    📷 <a href={part} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff' }}>
                      원본 이미지 보기
                    </a>
                  </div>
                </div>
              );
            } else {
              // 4. 일반 텍스트는 그대로 출력
              return <span key={partIndex}>{part}</span>;
            }
          })}
        </div>
      );
    });
  };

  return (
    <div style={{ 
      lineHeight: '1.6', 
      whiteSpace: 'pre-wrap',  // 개행 문자 보존
      wordBreak: 'break-word'  // 긴 URL 줄바꿈
    }}>
      {processDescription(description)}
    </div>
  );
};

export default ContentDescription;