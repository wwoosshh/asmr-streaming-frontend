import React, { useState, useRef, useEffect } from 'react';
import './AudioPlayer.css';

const AudioPlayer = ({ contentId, totalFiles }) => {
  const [playMode, setPlayMode] = useState('full'); // 'full' 또는 'part'
  const [currentPart, setCurrentPart] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);

  // 현재 오디오 파일 URL
  const currentAudioUrl = playMode === 'full' 
    ? `http://localhost:5159/api/audio/${contentId}/full`
    : `http://localhost:5159/api/audio/${contentId}/${currentPart}`;

  useEffect(() => {
    const audio = audioRef.current;
    
    const setAudioData = () => {
      setDuration(audio.duration || 0);
      setCurrentTime(audio.currentTime || 0);
      setError(null);
    };

    const setAudioTime = () => setCurrentTime(audio.currentTime || 0);
    
    const handleLoadStart = () => {
      setLoading(true);
      setError(null);
    };
    
    const handleCanPlay = () => {
      setLoading(false);
    };
    
    const handleError = (e) => {
      console.error('오디오 로딩 오류:', e);
      setLoading(false);
      setError('오디오 파일을 재생할 수 없습니다.');
      setIsPlaying(false);
    };

    if (audio) {
      audio.addEventListener('loadeddata', setAudioData);
      audio.addEventListener('timeupdate', setAudioTime);
      audio.addEventListener('loadstart', handleLoadStart);
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('error', handleError);
      
      return () => {
        audio.removeEventListener('loadeddata', setAudioData);
        audio.removeEventListener('timeupdate', setAudioTime);
        audio.removeEventListener('loadstart', handleLoadStart);
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('error', handleError);
      };
    }
  }, [playMode, currentPart]);

  // 파일 변경 시 오디오 리로드
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [playMode, currentPart]);

  // 재생/일시정지
  const togglePlayPause = async () => {
    if (!audioRef.current) return;
    
    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('재생 오류:', error);
      setError('재생 중 오류가 발생했습니다.');
      setIsPlaying(false);
    }
  };

  // 모드 변경
  const switchToFullMode = () => {
    setPlayMode('full');
    setIsPlaying(false);
  };

  const switchToPartMode = (partNumber) => {
    setPlayMode('part');
    setCurrentPart(partNumber);
    setIsPlaying(false);
  };

  // 다음/이전 파트 (파트 모드일 때만)
  const nextPart = () => {
    if (playMode === 'part' && currentPart < totalFiles) {
      setCurrentPart(currentPart + 1);
      setIsPlaying(false);
    }
  };

  const prevPart = () => {
    if (playMode === 'part' && currentPart > 1) {
      setCurrentPart(currentPart - 1);
      setIsPlaying(false);
    }
  };

  // 진행바 클릭
  const handleSeek = (e) => {
    if (!duration) return;
    
    const progressBar = e.currentTarget;
    const clickX = e.nativeEvent.offsetX;
    const width = progressBar.offsetWidth;
    const newTime = (clickX / width) * duration;
    audioRef.current.currentTime = newTime;
  };

  // 볼륨 조절
  const handleVolumeChange = (e) => {
    const newVolume = e.target.value;
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // 시간 포맷팅
  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="audio-player">
      <audio 
        ref={audioRef} 
        preload="metadata"
        onEnded={() => {
          setIsPlaying(false);
          if (playMode === 'part' && currentPart < totalFiles) {
            nextPart();
          }
        }}
      >
        <source src={currentAudioUrl} type="audio/mp4" />
        <source src={currentAudioUrl} type="audio/mpeg" />
        브라우저가 오디오 재생을 지원하지 않습니다.
      </audio>
      
      {/* 재생 모드 선택 */}
      <div className="playback-mode">
        <button 
          onClick={switchToFullMode}
          className={`mode-btn ${playMode === 'full' ? 'active' : ''}`}
        >
          전체 재생
        </button>
        <div className="part-selector">
          <span>파트별 재생:</span>
          <div className="part-buttons">
            {Array.from({ length: totalFiles }, (_, i) => i + 1).map(partNum => (
              <button
                key={partNum}
                onClick={() => switchToPartMode(partNum)}
                className={`part-btn ${playMode === 'part' && currentPart === partNum ? 'active' : ''}`}
              >
                {partNum}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 현재 재생 정보 */}
      <div className="playback-info">
        {playMode === 'full' ? (
          <span>전체 파일 재생 중</span>
        ) : (
          <span>파트 {currentPart} / {totalFiles} 재생 중</span>
        )}
        {loading && <span className="loading-text">로딩 중...</span>}
        {error && <span className="error-text">{error}</span>}
      </div>

      {/* 컨트롤 버튼 */}
      <div className="controls">
        {playMode === 'part' && (
          <button 
            onClick={prevPart} 
            disabled={currentPart === 1 || loading}
            className="control-btn"
          >
            ⏮️
          </button>
        )}
        
        <button 
          onClick={togglePlayPause}
          disabled={loading}
          className="play-pause-btn"
        >
          {loading ? '⏳' : (isPlaying ? '⏸️' : '▶️')}
        </button>
        
        {playMode === 'part' && (
          <button 
            onClick={nextPart} 
            disabled={currentPart === totalFiles || loading}
            className="control-btn"
          >
            ⏭️
          </button>
        )}
      </div>

      {/* 진행바 */}
      <div className="progress-section">
        <span className="time">{formatTime(currentTime)}</span>
        <div className="progress-bar" onClick={handleSeek}>
          <div 
            className="progress-fill"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>
        <span className="time">{formatTime(duration)}</span>
      </div>

      {/* 볼륨 조절 */}
      <div className="volume-section">
        <span>🔊</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={handleVolumeChange}
          className="volume-slider"
        />
      </div>
    </div>
  );
};

export default AudioPlayer;