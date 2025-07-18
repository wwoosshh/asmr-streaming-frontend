import React, { useState, useRef, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

const AudioPlayer = ({ contentId, totalFiles }) => {
  const [playMode, setPlayMode] = useState('full');
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
    ? `${API_BASE_URL}/api/audio/${contentId}/full`
    : `${API_BASE_URL}/api/audio/${contentId}/${currentPart}`;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      console.log('오디오 메타데이터 로드됨');
      setDuration(audio.duration || 0);
      setLoading(false);
      setError(null);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const handleLoadStart = () => {
      console.log('오디오 로딩 시작:', currentAudioUrl);
      setLoading(true);
      setError(null);
    };

    const handleCanPlay = () => {
      console.log('오디오 재생 준비됨');
      setLoading(false);
    };

    const handleError = (e) => {
      console.error('오디오 에러:', e);
      console.error('오디오 URL:', currentAudioUrl);
      setLoading(false);
      setError(`오디오를 로드할 수 없습니다. (${playMode === 'full' ? '전체' : `파트 ${currentPart}`})`);
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      // 파트 모드에서 자동으로 다음 파트 재생
      if (playMode === 'part' && currentPart < totalFiles) {
        setCurrentPart(prev => prev + 1);
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentAudioUrl, playMode, currentPart, totalFiles]);

  // 파일 변경 시 오디오 리로드
  useEffect(() => {
    if (audioRef.current) {
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setError(null);
      audioRef.current.load();
    }
  }, [playMode, currentPart]);

  // 재생/일시정지
  const togglePlayPause = async () => {
    if (!audioRef.current || loading) return;
    
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

  // 진행바 클릭
  const handleSeek = (e) => {
    if (!duration || !audioRef.current) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * duration;
    audioRef.current.currentTime = newTime;
  };

  // 볼륨 조절
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // 시간 포맷팅
  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', background: '#f9f9f9' }}>
      <audio ref={audioRef} preload="metadata">
        <source src={currentAudioUrl} type="audio/mp4" />
        <source src={currentAudioUrl} type="audio/mpeg" />
        브라우저가 오디오를 지원하지 않습니다.
      </audio>
      
      {/* 디버그 정보 */}
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
        <div>URL: {currentAudioUrl}</div>
        <div>상태: {loading ? '로딩 중' : error ? '에러' : '준비됨'}</div>
      </div>
      
      {/* 재생 모드 선택 */}
      <div style={{ marginBottom: '15px' }}>
        <button 
          onClick={switchToFullMode}
          style={{ 
            marginRight: '10px', 
            padding: '5px 10px',
            backgroundColor: playMode === 'full' ? '#007bff' : '#f8f9fa',
            color: playMode === 'full' ? 'white' : 'black',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        >
          전체 재생
        </button>
        
        <span style={{ marginRight: '10px' }}>파트별:</span>
        {Array.from({ length: totalFiles }, (_, i) => i + 1).map(partNum => (
          <button
            key={partNum}
            onClick={() => switchToPartMode(partNum)}
            style={{
              margin: '0 2px',
              padding: '5px 8px',
              backgroundColor: playMode === 'part' && currentPart === partNum ? '#dc3545' : '#f8f9fa',
              color: playMode === 'part' && currentPart === partNum ? 'white' : 'black',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          >
            {partNum}
          </button>
        ))}
      </div>

      {/* 현재 재생 정보 */}
      <div style={{ textAlign: 'center', marginBottom: '10px', fontWeight: 'bold' }}>
        {playMode === 'full' ? '전체 파일' : `파트 ${currentPart}/${totalFiles}`}
        {loading && <span style={{ color: '#007bff', marginLeft: '10px' }}>로딩 중...</span>}
        {error && <div style={{ color: '#dc3545', fontSize: '14px' }}>{error}</div>}
      </div>

      {/* 컨트롤 버튼 */}
      <div style={{ textAlign: 'center', marginBottom: '15px' }}>
        <button 
          onClick={togglePlayPause}
          disabled={loading}
          style={{
            fontSize: '24px',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: '#007bff',
            color: 'white',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '⏳' : (isPlaying ? '⏸️' : '▶️')}
        </button>
      </div>

      {/* 진행바 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <span style={{ fontSize: '14px', minWidth: '40px' }}>{formatTime(currentTime)}</span>
        <div 
          onClick={handleSeek}
          style={{ 
            flex: 1, 
            height: '6px', 
            backgroundColor: '#ddd', 
            borderRadius: '3px', 
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          <div 
            style={{ 
              width: `${duration ? (currentTime / duration) * 100 : 0}%`,
              height: '100%',
              backgroundColor: '#007bff',
              borderRadius: '3px'
            }}
          />
        </div>
        <span style={{ fontSize: '14px', minWidth: '40px' }}>{formatTime(duration)}</span>
      </div>

      {/* 볼륨 조절 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
        <span>🔊</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={handleVolumeChange}
          style={{ width: '100px' }}
        />
        <span style={{ fontSize: '14px' }}>{Math.round(volume * 100)}%</span>
      </div>
    </div>
  );
};

export default AudioPlayer;