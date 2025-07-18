import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [connectionError, setConnectionError] = useState(null);
  const navigate = useNavigate();

  // 대시보드 상태
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalContents: 0,
    totalViews: 0,
    totalTags: 0
  });

  // 사용자 관리 상태
  const [users, setUsers] = useState([]);
  const [usersPagination, setUsersPagination] = useState({
    page: 1,
    totalPages: 1
  });

  // 태그 관리 상태
  const [tags, setTags] = useState([]);
  const [selectedLetter, setSelectedLetter] = useState('all');
  const [editingTag, setEditingTag] = useState(null);
  const [newTag, setNewTag] = useState({
    name: ''
  });

  // 컨텐츠 업로드 상태
  const [uploadForm, setUploadForm] = useState({
    customId: '',
    title: '',
    description: '',
    contentRating: 'All',
    contentType: 'Audio',
    durationMinutes: '',
    audioQuality: 'Standard',
    selectedTags: []
  });
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  // 연결 상태 확인
  const checkConnection = useCallback(async () => {
  try {
    console.log('서버 연결 상태 확인 중...');
    
    // 1. 헬스 체크
    const healthResponse = await api.get('/api/health');
    console.log('서버 상태:', healthResponse.data);
    
    // 2. DB 연결 테스트
    const dbResponse = await api.get('/api/debug/db-test');
    console.log('DB 상태:', dbResponse.data);
    
    // 3. DB 구조 확인
    const dbStructure = await api.get('/api/debug/db-structure');
    console.log('DB 구조:', dbStructure.data);
    
    // 4. 태그 테이블 전용 디버그
    const tagDebug = await api.get('/api/debug/tags-debug');
    console.log('태그 디버그:', tagDebug.data);
    
    // 5. 사용자 테이블 전용 디버그 (추가)
    const userDebug = await api.get('/api/debug/users-debug');
    console.log('사용자 디버그:', userDebug.data);
    
    setDebugInfo({
      ...dbStructure.data,
      tag_debug: tagDebug.data,
      user_debug: userDebug.data  // 추가
    });
    setConnectionError(null);
    
    return true;
  } catch (error) {
    console.error('연결 확인 오류:', error);
    
    // 더 상세한 에러 정보
    const errorInfo = {
      message: '서버 또는 데이터베이스 연결 오류',
      status: error.response?.status,
      details: error.response?.data || error.message
    };
    
    // 태그 관련 특별 오류 처리
    if (error.response?.data?.message?.includes('tags')) {
      errorInfo.suggestion = '태그 테이블이 없거나 손상되었을 수 있습니다. DB 마이그레이션을 확인하세요.';
    }
    
    // 사용자 관련 특별 오류 처리 (추가)
    if (error.response?.data?.message?.includes('users')) {
      errorInfo.suggestion = '사용자 테이블이 없거나 손상되었을 수 있습니다. DB 마이그레이션을 확인하세요.';
    }
    
    setConnectionError(errorInfo);
    return false;
  }
}, []);

const diagnoseTagIssues = async () => {
  try {
    console.log('태그 문제 진단 시작...');
    const response = await api.get('/api/debug/tags-debug');
    
    if (response.data.status === 'success') {
      alert(`태그 진단 결과:
- 총 태그 수: ${response.data.total_tags}
- 테이블 상태: 정상
- 최근 태그: ${response.data.recent_tags?.length || 0}개`);
    }
  } catch (error) {
    console.error('태그 진단 오류:', error);
    alert(`태그 진단 실패: ${error.response?.data?.message || error.message}`);
  }
};

  const checkAdminAuth = useCallback(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/auth');
      return;
    }
    
    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'admin') {
        alert('관리자 권한이 필요합니다.');
        navigate('/');
        return;
      }
      setUser(parsedUser);
    } catch (error) {
      console.error('사용자 데이터 파싱 오류:', error);
      navigate('/auth');
    }
  }, [navigate]);

  const fetchStats = useCallback(async () => {
    try {
      console.log('통계 조회 시작...');
      const response = await api.get('/api/admin/stats');
      console.log('통계 응답:', response.data);
      setStats(response.data);
    } catch (error) {
      console.error('통계 조회 오류:', error);
      
      if (error.response?.status === 500) {
        const errorData = error.response.data;
        if (errorData.solution) {
          alert(`데이터베이스 오류: ${errorData.error}\n해결방법: ${errorData.solution}`);
        } else {
          alert('서버 내부 오류가 발생했습니다. 콘솔을 확인해주세요.');
        }
      } else {
        alert('통계를 불러오는데 실패했습니다.');
      }
    }
  }, []);

  const fetchUsers = useCallback(async () => {
  try {
    console.log('사용자 목록 조회 시작...');
    const response = await api.get(`/api/auth/users?page=${usersPagination.page}&limit=10`);
    console.log('사용자 목록 응답:', response.data);
    
    if (response.data && response.data.users) {
      setUsers(response.data.users);
      setUsersPagination(prev => ({
        ...prev,
        totalPages: response.data.pagination.totalPages
      }));
    } else {
      console.error('사용자 데이터 형식 오류:', response.data);
      setUsers([]);
    }
  } catch (error) {
    console.error('사용자 목록 조회 오류:', error);
    setUsers([]);
    
    if (error.response?.status === 500) {
      const errorData = error.response.data;
      let alertMessage = `데이터베이스 오류: ${errorData.error}`;
      
      if (errorData.solution) {
        alertMessage += `\n\n해결방법: ${errorData.solution}`;
      }
      
      if (errorData.details) {
        alertMessage += `\n\n상세정보: ${errorData.details}`;
      }
      
      alert(alertMessage);
      
      // 사용자 디버그 자동 실행
      diagnoseUserIssues();
    } else {
      alert('사용자 목록을 불러오는데 실패했습니다.');
    }
  }
}, [usersPagination.page]);

  const fetchTags = useCallback(async () => {
  try {
    console.log('태그 목록 조회 시작...');
    const response = await api.get('/api/tags');
    console.log('태그 목록 응답:', response.data);
    
    // 안전한 데이터 접근
    if (response.data && response.data.success !== false) {
      setTags(response.data.tags || []);
      setSelectedLetter('all');
    } else {
      console.error('태그 조회 실패:', response.data);
      setTags([]);
      alert('태그 목록을 불러오는데 실패했습니다.');
    }
  } catch (error) {
    console.error('태그 목록 조회 오류:', error);
    setTags([]);
    
    if (error.response?.status === 500) {
      const errorData = error.response.data;
      alert(`데이터베이스 오류: ${errorData.error}\n${errorData.solution || '관리자에게 문의하세요.'}`);
    } else {
      alert('태그 목록을 불러오는데 실패했습니다.');
    }
  }
}, []);

  const fetchTagsByLetter = useCallback(async (letter) => {
  try {
    console.log('알파벳별 태그 조회:', letter);
    
    let url = '/api/tags';
    if (letter && letter !== 'all') {
      url += `?letter=${letter}`;
    }
    
    const response = await api.get(url);
    console.log('알파벳별 태그 응답:', response.data);
    
    // 안전한 데이터 접근
    if (response.data && response.data.success !== false) {
      setTags(response.data.tags || []);
      setSelectedLetter(letter);
    } else {
      console.error('태그 조회 실패:', response.data);
      setTags([]);
      alert('태그를 불러오는데 실패했습니다.');
    }
  } catch (error) {
    console.error('알파벳별 태그 조회 오류:', error);
    setTags([]);
    alert('태그를 불러오는데 실패했습니다.');
  }
}, []);

  useEffect(() => {
    const initializeAdmin = async () => {
      checkAdminAuth();
      
      const isConnected = await checkConnection();
      
      if (isConnected) {
        if (activeTab === 'dashboard') {
          fetchStats();
        } else if (activeTab === 'users') {
          fetchUsers();
        } else if (activeTab === 'tags') {
          fetchTags();
        } else if (activeTab === 'upload') {
          fetchTags();
        }
      }
    };
    
    initializeAdmin();
  }, [activeTab, checkConnection, fetchStats, fetchUsers, fetchTags, checkAdminAuth]);

  const handleUserRoleChange = async (userId, newRole) => {
    if (!window.confirm(`사용자의 권한을 ${newRole}로 변경하시겠습니까?`)) {
      return;
    }
    
    try {
      await api.patch('/api/auth/user-role', { 
        userId: userId, 
        role: newRole 
      });
      alert('권한이 변경되었습니다.');
      fetchUsers();
    } catch (error) {
      console.error('권한 변경 오류:', error);
      alert('권한 변경에 실패했습니다.');
    }
  };

  // 태그 관리 함수들
  const handleCreateTag = async (e) => {
  e.preventDefault();
  
  if (!newTag.name.trim()) {
    alert('태그명을 입력해주세요.');
    return;
  }
  
  try {
    const response = await api.post('/api/tags', { name: newTag.name.trim() });
    
    if (response.data && response.data.success !== false) {
      alert('태그가 생성되었습니다.');
      setNewTag({ name: '' });
      
      // 현재 선택된 필터에 따라 새로고침
      if (selectedLetter === 'all') {
        fetchTags();
      } else {
        fetchTagsByLetter(selectedLetter);
      }
    } else {
      alert(response.data?.error || '태그 생성에 실패했습니다.');
    }
  } catch (error) {
    console.error('태그 생성 오류:', error);
    alert(error.response?.data?.error || '태그 생성에 실패했습니다.');
  }
};

  const handleEditTag = (tag) => {
    setEditingTag({
      id: tag.id,
      name: tag.name,
      originalName: tag.name
    });
  };

  const handleUpdateTag = async () => {
    if (!editingTag.name.trim()) {
      alert('태그명을 입력해주세요.');
      return;
    }
    
    try {
      await api.patch(`/api/tags/${editingTag.id}`, { 
        name: editingTag.name.trim() 
      });
      alert('태그가 수정되었습니다.');
      setEditingTag(null);
      
      if (selectedLetter === 'all') {
        fetchTags();
      } else {
        fetchTagsByLetter(selectedLetter);
      }
    } catch (error) {
      console.error('태그 수정 오류:', error);
      alert(error.response?.data?.error || '태그 수정에 실패했습니다.');
    }
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
  };

  const handleDeleteTag = async (tagId) => {
    if (!window.confirm('정말로 이 태그를 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      await api.delete(`/api/tags/${tagId}`);
      alert('태그가 삭제되었습니다.');
      if (selectedLetter === 'all') {
        fetchTags();
      } else {
        fetchTagsByLetter(selectedLetter);
      }
    } catch (error) {
      console.error('태그 삭제 오류:', error);
      const errorData = error.response?.data;
      
      if (errorData?.requireConfirmation) {
        if (window.confirm(`${errorData.error}\n강제로 삭제하시겠습니까?`)) {
          try {
            await api.delete(`/api/tags/${tagId}/force`);
            alert('태그가 강제 삭제되었습니다.');
            if (selectedLetter === 'all') {
              fetchTags();
            } else {
              fetchTagsByLetter(selectedLetter);
            }
          } catch (forceError) {
            console.error('강제 삭제 오류:', forceError);
            alert('강제 삭제에 실패했습니다.');
          }
        }
      } else {
        alert(errorData?.error || '태그 삭제에 실패했습니다.');
      }
    }
  };

  // useState에 ID 확인 관련 상태 추가
const [idValidation, setIdValidation] = useState({
  checking: false,
  available: null,
  message: '',
  error: ''
});

// ID 확인 함수 추가
const checkIdAvailability = async (id) => {
  if (!id || !id.trim()) {
    setIdValidation({
      checking: false,
      available: null,
      message: '',
      error: ''
    });
    return;
  }
  
  const parsedId = parseInt(id.trim());
  if (isNaN(parsedId) || parsedId <= 0) {
    setIdValidation({
      checking: false,
      available: false,
      message: '',
      error: 'ID는 1 이상의 숫자여야 합니다.'
    });
    return;
  }
  
  setIdValidation(prev => ({ ...prev, checking: true }));
  
  try {
    const response = await api.get(`/api/admin/check-content-id/${parsedId}`);
    
    setIdValidation({
      checking: false,
      available: response.data.available,
      message: response.data.message,
      error: response.data.available ? '' : (response.data.existing_content?.suggestion || '')
    });
  } catch (error) {
    console.error('ID 확인 오류:', error);
    setIdValidation({
      checking: false,
      available: false,
      message: '',
      error: 'ID 확인 중 오류가 발생했습니다.'
    });
  }
};

// ID 제안 함수 추가
const suggestNextId = async () => {
  try {
    const response = await api.get('/api/admin/suggest-content-id');
    
    setUploadForm(prev => ({
      ...prev,
      customId: response.data.suggested_id.toString()
    }));
    
    // 제안된 ID도 확인
    checkIdAvailability(response.data.suggested_id.toString());
    
    alert(`추천 ID: ${response.data.suggested_id}\n${response.data.message}`);
  } catch (error) {
    console.error('ID 제안 오류:', error);
    alert('ID 제안 중 오류가 발생했습니다.');
  }
};

  // 컨텐츠 업로드 함수들
  const handleUploadFormChange = (e) => {
    const { name, value } = e.target;
    setUploadForm({
      ...uploadForm,
      [name]: value
    });
    
    // customId 변경 시 실시간 확인
    if (name === 'customId') {
      checkIdAvailability(value);
    }
  };

  const renderCustomIdSection = () => (
  <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '8px' }}>
    <h5 style={{ margin: '0 0 10px 0' }}>🆔 컨텐츠 ID 설정</h5>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
      <div style={{ flex: 1 }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          사용자 지정 ID (선택사항)
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="text"
            name="customId"
            value={uploadForm.customId}
            onChange={handleUploadFormChange}
            placeholder="예: 12345"
            disabled={uploading}
            style={{ 
              width: '150px', 
              padding: '8px', 
              border: `1px solid ${
                idValidation.available === true ? '#28a745' : 
                idValidation.available === false ? '#dc3545' : '#ddd'
              }`, 
              borderRadius: '4px',
              backgroundColor: 
                idValidation.available === true ? '#f8fff8' : 
                idValidation.available === false ? '#fff8f8' : 'white'
            }}
          />
          
          {idValidation.checking && (
            <span style={{ color: '#007bff', fontSize: '14px' }}>확인 중...</span>
          )}
          
          {idValidation.available === true && (
            <span style={{ color: '#28a745', fontSize: '14px' }}>✅ 사용 가능</span>
          )}
          
          {idValidation.available === false && (
            <span style={{ color: '#dc3545', fontSize: '14px' }}>❌ 사용 불가</span>
          )}
          
          <button
            type="button"
            onClick={suggestNextId}
            disabled={uploading}
            style={{
              padding: '6px 12px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            ID 추천
          </button>
        </div>
        
        <div style={{ marginTop: '5px' }}>
          <small style={{ color: '#666', fontSize: '12px' }}>
            숫자만 입력하세요. 비워두면 자동 생성됩니다.
          </small>
          
          {idValidation.message && (
            <div style={{ 
              color: idValidation.available ? '#28a745' : '#dc3545', 
              fontSize: '12px',
              marginTop: '3px'
            }}>
              {idValidation.message}
            </div>
          )}
          
          {idValidation.error && (
            <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '3px' }}>
              {idValidation.error}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

  const handleTagSelection = (tagId) => {
    const { selectedTags } = uploadForm;
    if (selectedTags.includes(tagId)) {
      setUploadForm({
        ...uploadForm,
        selectedTags: selectedTags.filter(id => id !== tagId)
      });
    } else {
      setUploadForm({
        ...uploadForm,
        selectedTags: [...selectedTags, tagId]
      });
    }
  };

  const handleFileChange = (e) => {
    setUploadFiles(Array.from(e.target.files));
  };

  const validateUploadForm = () => {
    if (!uploadForm.title.trim()) {
      alert('제목을 입력해주세요.');
      return false;
    }
    
    if (!uploadForm.description.trim()) {
      alert('설명을 입력해주세요.');
      return false;
    }
    
    if (uploadFiles.length === 0) {
      alert('최소 하나의 파일을 선택해주세요.');
      return false;
    }
    
    const audioFiles = uploadFiles.filter(file => {
      const ext = file.name.toLowerCase();
      return ext.endsWith('.mp3') || ext.endsWith('.m4a') || 
             ext.endsWith('.wav') || ext.endsWith('.aac');
    });
    
    if (audioFiles.length === 0) {
      alert('최소 하나의 오디오 파일이 필요합니다.');
      return false;
    }
    
    return true;
  };

  const handleUploadSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateUploadForm()) {
    return;
  }
  
  setUploading(true);
  
  try {
    const formData = new FormData();
    
    // customId 추가
    if (uploadForm.customId.trim()) {
      formData.append('customId', uploadForm.customId.trim());
    }
    
    formData.append('title', uploadForm.title);
    formData.append('description', uploadForm.description);
    formData.append('contentRating', uploadForm.contentRating);
    formData.append('contentType', uploadForm.contentType);
    formData.append('durationMinutes', uploadForm.durationMinutes);
    formData.append('audioQuality', uploadForm.audioQuality);
    formData.append('tagIds', uploadForm.selectedTags.join(','));
    
    uploadFiles.forEach(file => {
      formData.append('files', file);
    });
    
    console.log('컨텐츠 업로드 시작');
    
    const response = await api.post('/api/admin/contents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 5 * 60 * 1000
    });
    
    alert(`컨텐츠가 성공적으로 업로드되었습니다! (ID: ${response.data.contentId})`);
    
    // 폼 초기화
    setUploadForm({
      customId: '',  // 추가
      title: '',
      description: '',
      contentRating: 'All',
      contentType: 'Audio',
      durationMinutes: '',
      audioQuality: 'Standard',
      selectedTags: []
    });
    setUploadFiles([]);
    
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = '';
    }
    
    fetchStats();
    
  } catch (error) {
    console.error('업로드 오류:', error);
    if (error.response?.data?.error) {
      alert(`업로드 실패: ${error.response.data.error}`);
    } else {
      alert('업로드 중 오류가 발생했습니다.');
    }
  } finally {
    setUploading(false);
  }
};

  // 연결 오류 표시 컴포넌트
  const renderConnectionError = () => {
    if (!connectionError) return null;
    
    return (
      <div style={{
        backgroundColor: '#f8d7da',
        color: '#721c24',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #f5c6cb'
      }}>
        <h4 style={{ margin: '0 0 10px 0' }}>❌ 연결 오류</h4>
        <p><strong>메시지:</strong> {connectionError.message}</p>
        {connectionError.status && (
          <p><strong>상태 코드:</strong> {connectionError.status}</p>
        )}
        {connectionError.details && (
          <details>
            <summary>상세 정보</summary>
            <pre style={{ background: '#f1f1f1', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
              {JSON.stringify(connectionError.details, null, 2)}
            </pre>
          </details>
        )}
        <button 
          onClick={checkConnection}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          다시 연결 시도
        </button>
      </div>
    );
  };

  // 사용자 관련 오류 시 추가 진단 함수 (누락된 함수)
const diagnoseUserIssues = async () => {
  try {
    console.log('사용자 문제 진단 시작...');
    const response = await api.get('/api/debug/users-debug');
    
    if (response.data.status === 'success') {
      const data = response.data;
      let diagnosisMessage = `사용자 진단 결과:\n`;
      diagnosisMessage += `- 총 사용자 수: ${data.total_users}\n`;
      diagnosisMessage += `- 테이블 상태: 정상\n`;
      diagnosisMessage += `- 최근 사용자: ${data.recent_users?.length || 0}개\n`;
      
      if (data.role_distribution && data.role_distribution.length > 0) {
        diagnosisMessage += `- 권한별 분포:\n`;
        data.role_distribution.forEach(role => {
          diagnosisMessage += `  * ${role.role}: ${role.count}명\n`;
        });
      }
      
      if (data.table_structure && data.table_structure.length > 0) {
        diagnosisMessage += `- 테이블 컬럼: ${data.table_structure.map(col => col.Field).join(', ')}\n`;
      }
      
      alert(diagnosisMessage);
      
      // 진단 결과가 정상이면 사용자 목록 다시 조회
      if (data.total_users > 0) {
        console.log('진단 결과 정상 - 사용자 목록 재조회');
        setTimeout(() => {
          fetchUsers();
        }, 1000);
      }
    }
  } catch (error) {
    console.error('사용자 진단 오류:', error);
    alert(`사용자 진단 실패: ${error.response?.data?.message || error.message}`);
  }
};

  // 디버그 정보 표시 컴포넌트
  const renderDebugInfo = () => {
  if (!debugInfo || activeTab !== 'dashboard') return null;
  
  return (
    <details style={{ marginTop: '20px' }}>
      <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
        🔧 디버그 정보 (개발용)
      </summary>
      <div style={{
        background: '#f8f9fa',
        padding: '15px',
        borderRadius: '4px',
        marginTop: '10px'
      }}>
        <h5>데이터베이스: {debugInfo.database}</h5>
        
        <h6>테이블 목록:</h6>
        <ul>
          {Object.keys(debugInfo.tables || {}).map(tableName => (
            <li key={tableName}>
              <strong>{tableName}</strong>
              {debugInfo.tables[tableName].error ? (
                <span style={{ color: 'red' }}> - 오류: {debugInfo.tables[tableName].error}</span>
              ) : (
                <span style={{ color: 'green' }}> - OK ({debugInfo.tables[tableName].length} 컬럼)</span>
              )}
            </li>
          ))}
        </ul>
        
        {/* 태그 디버그 정보 */}
        {debugInfo.tag_debug && (
          <div style={{ marginTop: '15px' }}>
            <h6>태그 테이블 상세:</h6>
            <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
              <div>총 태그 수: {debugInfo.tag_debug.total_tags}</div>
              <div>테스트 쿼리: {debugInfo.tag_debug.test_query_results?.simple_select}</div>
              <div>그룹바이 쿼리: {debugInfo.tag_debug.test_query_results?.group_by_letter}</div>
            </div>
            
            {debugInfo.tag_debug.recent_tags?.length > 0 && (
              <details style={{ marginTop: '10px' }}>
                <summary>최근 태그 샘플</summary>
                <pre style={{ fontSize: '11px' }}>
                  {JSON.stringify(debugInfo.tag_debug.recent_tags.slice(0, 3), null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}
        
        {/* 사용자 디버그 정보 추가 */}
        {debugInfo.user_debug && (
          <div style={{ marginTop: '15px' }}>
            <h6>사용자 테이블 상세:</h6>
            <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
              <div>총 사용자 수: {debugInfo.user_debug.total_users}</div>
              <div>테스트 쿼리: {debugInfo.user_debug.test_query_results?.simple_select}</div>
              <div>권한별 그룹바이: {debugInfo.user_debug.test_query_results?.group_by_role}</div>
            </div>
            
            {debugInfo.user_debug.role_distribution?.length > 0 && (
              <div style={{ marginTop: '5px' }}>
                권한 분포: {debugInfo.user_debug.role_distribution.map(r => `${r.role}(${r.count})`).join(', ')}
              </div>
            )}
            
            {debugInfo.user_debug.recent_users?.length > 0 && (
              <details style={{ marginTop: '10px' }}>
                <summary>최근 사용자 샘플</summary>
                <pre style={{ fontSize: '11px' }}>
                  {JSON.stringify(debugInfo.user_debug.recent_users.slice(0, 3), null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          <button 
            onClick={diagnoseTagIssues}
            style={{
              padding: '5px 10px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            태그 문제 진단
          </button>
          <button 
            onClick={diagnoseUserIssues}
            style={{
              padding: '5px 10px',
              backgroundColor: '#6f42c1',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            사용자 문제 진단
          </button>
        </div>
      </div>
    </details>
  );
};

  const renderDashboard = () => (
    <div>
      <h3>관리자 대시보드</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', textAlign: 'center' }}>
          <h4>총 사용자</h4>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>{stats.totalUsers}</p>
        </div>
        <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', textAlign: 'center' }}>
          <h4>총 컨텐츠</h4>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>{stats.totalContents}</p>
        </div>
        <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', textAlign: 'center' }}>
          <h4>총 조회수</h4>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>{stats.totalViews}</p>
        </div>
        <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', textAlign: 'center' }}>
          <h4>총 태그</h4>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#6f42c1' }}>{stats.totalTags}</p>
        </div>
      </div>
      <p>환영합니다, {user?.username}님! 관리자 패널입니다.</p>
      {renderDebugInfo()}
    </div>
  );

  const renderUserManagement = () => (
  <div>
    <h3>사용자 관리</h3>
    
    {/* 🔧 디버그 버튼 섹션 */}
    <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '8px' }}>
      <h5 style={{ margin: '0 0 10px 0' }}>🔧 사용자 관리 도구</h5>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          onClick={diagnoseUserIssues}
          style={{
            padding: '8px 16px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          사용자 테이블 진단
        </button>
        <button 
          onClick={fetchUsers}
          style={{
            padding: '8px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          사용자 목록 새로고침
        </button>
      </div>
    </div>
    
    {/* 기존 사용자 테이블 코드는 그대로 유지하세요 */}
    {users.length === 0 ? (
      <div style={{
        textAlign: 'center',
        padding: '40px',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '8px'
      }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#856404' }}>⚠️ 사용자 데이터 없음</h4>
        <p style={{ margin: '0 0 15px 0', color: '#856404' }}>
          사용자 목록을 불러올 수 없습니다.<br />
          데이터베이스 연결이나 테이블 구조에 문제가 있을 수 있습니다.
        </p>
        <button 
          onClick={diagnoseUserIssues}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          문제 진단하기
        </button>
      </div>
    ) : (
      /* 기존 사용자 테이블 렌더링 코드는 그대로 유지 */
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '12px', border: '1px solid #ddd' }}>ID</th>
              <th style={{ padding: '12px', border: '1px solid #ddd' }}>사용자명</th>
              <th style={{ padding: '12px', border: '1px solid #ddd' }}>이메일</th>
              <th style={{ padding: '12px', border: '1px solid #ddd' }}>권한</th>
              <th style={{ padding: '12px', border: '1px solid #ddd' }}>가입일</th>
              <th style={{ padding: '12px', border: '1px solid #ddd' }}>상태</th>
            </tr>
          </thead>
          <tbody>
            {users.map(userData => (
              <tr key={userData.id}>
                <td style={{ padding: '12px', border: '1px solid #ddd' }}>{userData.id}</td>
                <td style={{ padding: '12px', border: '1px solid #ddd' }}>{userData.username}</td>
                <td style={{ padding: '12px', border: '1px solid #ddd' }}>{userData.email}</td>
                <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                  <select 
                    value={userData.role} 
                    onChange={(e) => handleUserRoleChange(userData.id, e.target.value)}
                    style={{ padding: '4px' }}
                  >
                    <option value="user">기본회원</option>
                    <option value="admin">관리자</option>
                  </select>
                </td>
                <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                  {userData.created_at ? new Date(userData.created_at).toLocaleDateString() : '날짜 없음'}
                </td>
                <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    backgroundColor: userData.role === 'admin' ? '#dc3545' : '#28a745',
                    color: 'white'
                  }}>
                    {userData.role === 'admin' ? '관리자' : '일반'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* 페이지네이션 */}
        <div style={{ textAlign: 'center' }}>
          <button 
            onClick={() => setUsersPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            disabled={usersPagination.page === 1}
            style={{ margin: '0 5px', padding: '8px 16px' }}
          >
            이전
          </button>
          <span>{usersPagination.page} / {usersPagination.totalPages}</span>
          <button 
            onClick={() => setUsersPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
            disabled={usersPagination.page === usersPagination.totalPages}
            style={{ margin: '0 5px', padding: '8px 16px' }}
          >
            다음
          </button>
        </div>
      </div>
    )}
  </div>
);

  const renderTagManagement = () => (
    <div>
      <h3>태그 관리</h3>
      
      {/* 알파벳 네비게이션 */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h5 style={{ margin: '0 0 10px 0' }}>알파벳별 태그 보기</h5>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map(letter => (
            <button
              key={letter}
              onClick={() => fetchTagsByLetter(letter.toLowerCase())}
              style={{
                padding: '8px 12px',
                backgroundColor: selectedLetter === letter.toLowerCase() ? '#007bff' : '#fff',
                color: selectedLetter === letter.toLowerCase() ? 'white' : '#007bff',
                border: '1px solid #007bff',
                borderRadius: '4px',
                cursor: 'pointer',
                minWidth: '40px'
              }}
            >
              {letter}
            </button>
          ))}
          <button
            onClick={() => fetchTagsByLetter('0')}
            style={{
              padding: '8px 12px',
              backgroundColor: selectedLetter === '0' ? '#007bff' : '#fff',
              color: selectedLetter === '0' ? 'white' : '#007bff',
              border: '1px solid #007bff',
              borderRadius: '4px',
              cursor: 'pointer',
              minWidth: '40px'
            }}
          >
            0-9
          </button>
          <button
            onClick={() => fetchTagsByLetter('#')}
            style={{
              padding: '8px 12px',
              backgroundColor: selectedLetter === '#' ? '#007bff' : '#fff',
              color: selectedLetter === '#' ? 'white' : '#007bff',
              border: '1px solid #007bff',
              borderRadius: '4px',
              cursor: 'pointer',
              minWidth: '40px'
            }}
          >
            #
          </button>
          <button
            onClick={() => fetchTagsByLetter('all')}
            style={{
              padding: '8px 12px',
              backgroundColor: selectedLetter === 'all' ? '#28a745' : '#fff',
              color: selectedLetter === 'all' ? 'white' : '#28a745',
              border: '1px solid #28a745',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            전체
          </button>
        </div>
      </div>
      
      {/* 새 태그 생성 폼 */}
      <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <h4>새 태그 생성</h4>
        <form onSubmit={handleCreateTag} style={{ display: 'flex', gap: '15px', alignItems: 'end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>태그명 *</label>
            <input
              type="text"
              value={newTag.name}
              onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
              placeholder="예: ASMR, Girl, Healing..."
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            <small style={{ color: '#666', fontSize: '12px' }}>
              첫 글자에 따라 자동으로 분류됩니다 (A-Z, 0-9, 기타)
            </small>
          </div>
          
          <button
            type="submit"
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            생성
          </button>
        </form>
      </div>

      {/* 태그 통계 */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center' }}>
          <div>
            <strong>전체 태그</strong><br />
            <span style={{ fontSize: '18px', color: '#007bff' }}>{tags.length}</span>
          </div>
          <div>
            <strong>현재 보기</strong><br />
            <span style={{ fontSize: '18px', color: '#28a745' }}>
              {selectedLetter === 'all' ? tags.length : tags.filter(tag => tag.first_letter === selectedLetter).length}
            </span>
          </div>
          <div>
            <strong>사용 중인 태그</strong><br />
            <span style={{ fontSize: '18px', color: '#dc3545' }}>
              {tags.filter(tag => (tag.current_usage || tag.usage_count || 0) > 0).length}
            </span>
          </div>
          <div>
            <strong>미사용 태그</strong><br />
            <span style={{ fontSize: '18px', color: '#6c757d' }}>
              {tags.filter(tag => (tag.current_usage || tag.usage_count || 0) === 0).length}
            </span>
          </div>
        </div>
      </div>

      {/* 태그 목록 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
        {(selectedLetter === 'all' ? tags : tags.filter(tag => tag.first_letter === selectedLetter)).map(tag => (
          <div key={tag.id} style={{
            padding: '15px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: 'white',
            position: 'relative'
          }}>
            {editingTag && editingTag.id === tag.id ? (
              /* 편집 모드 */
              <div>
                <div style={{ marginBottom: '10px' }}>
                  <input
                    type="text"
                    value={editingTag.name}
                    onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #007bff',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                    placeholder="태그명 입력"
                    autoFocus
                  />
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button
                    onClick={handleUpdateTag}
                    style={{ 
                      padding: '6px 12px', 
                      backgroundColor: '#28a745', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer', 
                      fontSize: '12px',
                      flex: 1
                    }}
                  >
                    저장
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    style={{ 
                      padding: '6px 12px', 
                      backgroundColor: '#6c757d', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer', 
                      fontSize: '12px',
                      flex: 1
                    }}
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              /* 일반 모드 */
              <>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{
                    backgroundColor: '#007bff',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    marginRight: '10px',
                    fontWeight: 'bold'
                  }}>
                    {tag.name}
                  </span>
                  <span style={{ 
                    backgroundColor: '#6c757d', 
                    color: 'white', 
                    padding: '2px 6px', 
                    borderRadius: '8px',
                    fontSize: '10px',
                    textTransform: 'uppercase'
                  }}>
                    {tag.first_letter}
                  </span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                  <div>
                    <strong>사용 횟수:</strong><br />
                    <span style={{ color: (tag.current_usage || tag.usage_count || 0) > 0 ? '#28a745' : '#dc3545' }}>
                      {tag.current_usage || tag.usage_count || 0}회
                    </span>
                  </div>
                  <div>
                    <strong>상태:</strong><br />
                    <span style={{ color: (tag.current_usage || tag.usage_count || 0) > 0 ? '#28a745' : '#6c757d' }}>
                      {(tag.current_usage || tag.usage_count || 0) > 0 ? '사용 중' : '미사용'}
                    </span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button
                    onClick={() => handleEditTag(tag)}
                    style={{ 
                      padding: '4px 8px', 
                      backgroundColor: '#6c757d', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer', 
                      fontSize: '12px',
                      flex: 1
                    }}
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDeleteTag(tag.id)}
                    style={{ 
                      padding: '4px 8px', 
                      backgroundColor: '#dc3545', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer', 
                      fontSize: '12px',
                      flex: 1
                    }}
                  >
                    삭제
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* 태그가 없을 때 */}
      {tags.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>태그가 없습니다.</p>
          <p>새 태그를 생성해보세요.</p>
        </div>
      )}

      {/* 선택된 알파벳에 태그가 없을 때 */}
      {tags.length > 0 && selectedLetter !== 'all' && tags.filter(tag => tag.first_letter === selectedLetter).length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>'{selectedLetter.toUpperCase()}'로 시작하는 태그가 없습니다.</p>
        </div>
      )}
    </div>
  );

  const renderContentUpload = () => (
    <div>
    <h3>컨텐츠 업로드</h3>
    
    {/* 기존 태그 확인 부분 */}
    {tags.length === 0 && (
      <div style={{
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>⚠️ 태그가 필요합니다</h4>
        <p style={{ margin: 0, color: '#856404' }}>
          컨텐츠를 업로드하기 전에 먼저 태그를 생성해주세요.<br />
          태그 관리 탭에서 ASMR, Female Voice, Sleep 등의 태그를 만들어보세요.
        </p>
      </div>
    )}
      
      <form onSubmit={handleUploadSubmit} style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
        {renderCustomIdSection()}
      
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>제목 *</label>
            <input
              type="text"
              name="title"
              value={uploadForm.title}
              onChange={handleUploadFormChange}
              placeholder="컨텐츠 제목을 입력하세요"
              disabled={uploading}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
        
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>재생시간 (분)</label>
            <input
              type="number"
              name="durationMinutes"
              value={uploadForm.durationMinutes}
              onChange={handleUploadFormChange}
              placeholder="예: 45"
              disabled={uploading}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
        </div>
      
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            설명 * 
            <small style={{ fontWeight: 'normal', color: '#666' }}>
              (줄바꿈 가능, 이미지 URL 자동 감지)
            </small>
          </label>
          <textarea
            name="description"
            value={uploadForm.description}
            onChange={handleUploadFormChange}
            placeholder={`컨텐츠 설명을 입력하세요.\n\n이미지 URL을 입력하면 자동으로 이미지가 표시됩니다.\n예: https://example.com/image.jpg`}
            rows="6"
            disabled={uploading}
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>연령 등급</label>
            <select
              name="contentRating"
              value={uploadForm.contentRating}
              onChange={handleUploadFormChange}
              disabled={uploading}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="All">전체 이용가</option>
              <option value="12+">12세 이상</option>
              <option value="15+">15세 이상</option>
              <option value="18+">18세 이상</option>
              <option value="R18">성인</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>컨텐츠 타입</label>
            <select
              name="contentType"
              value={uploadForm.contentType}
              onChange={handleUploadFormChange}
              disabled={uploading}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="Audio">오디오</option>
              <option value="Video">비디오</option>
              <option value="Mixed">혼합</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>음질</label>
            <select
              name="audioQuality"
              value={uploadForm.audioQuality}
              onChange={handleUploadFormChange}
              disabled={uploading}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="Standard">표준</option>
              <option value="High">고음질</option>
              <option value="Premium">프리미엄</option>
            </select>
          </div>
        </div>

        {/* 태그 선택 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
            태그 선택 ({tags.length > 0 ? `${tags.length}개 사용 가능` : '태그 없음'})
          </label>
          {tags.length === 0 ? (
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#f8d7da', 
              color: '#721c24', 
              borderRadius: '4px',
              textAlign: 'center'
            }}>
              사용 가능한 태그가 없습니다. 먼저 태그 관리 탭에서 태그를 생성해주세요.
            </div>
          ) : (
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '8px',
              maxHeight: '200px',
              overflowY: 'auto',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: 'white'
            }}>
              {tags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleTagSelection(tag.id)}
                  disabled={uploading}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '16px',
                    backgroundColor: uploadForm.selectedTags.includes(tag.id) ? '#007bff' : 'white',
                    color: uploadForm.selectedTags.includes(tag.id) ? 'white' : '#007bff',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                >
                  {tag.name}
                  {(tag.usage_count || tag.current_usage || 0) > 0 && (
                    <span style={{ 
                      marginLeft: '5px', 
                      fontSize: '12px', 
                      opacity: 0.8 
                    }}>
                      ({tag.usage_count || tag.current_usage || 0})
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
          {uploadForm.selectedTags.length > 0 && (
            <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
              선택된 태그: {uploadForm.selectedTags.length}개
            </div>
          )}
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            파일 선택 * (오디오 파일 + 이미지 파일)
          </label>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            accept=".mp3,.m4a,.wav,.aac,.jpg,.jpeg,.png,.webp"
            disabled={uploading}
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
          {uploadFiles.length > 0 && (
            <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
              선택된 파일: {uploadFiles.length}개
              <br />
              오디오 파일: {uploadFiles.filter(f => {
                const ext = f.name.toLowerCase();
                return ext.endsWith('.mp3') || ext.endsWith('.m4a') || ext.endsWith('.wav') || ext.endsWith('.aac');
              }).length}개
              <br />
              이미지 파일: {uploadFiles.filter(f => {
                const ext = f.name.toLowerCase();
                return ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png') || ext.endsWith('.webp');
              }).length}개
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={uploading || tags.length === 0}
          style={{
            width: '100%',
            padding: '15px',
            backgroundColor: uploading || tags.length === 0 ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: uploading || tags.length === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          {uploading ? '업로드 중...' : tags.length === 0 ? '태그를 먼저 생성해주세요' : '컨텐츠 업로드'}
        </button>
      </form>
    </div>
  );

  if (!user) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className="container" style={{ marginTop: '20px' }}>
      {/* 연결 오류 표시 */}
      {renderConnectionError()}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2>관리자 패널</h2>
        <button onClick={() => navigate('/')} style={{
          padding: '10px 20px',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          메인으로
        </button>
      </div>
      
      {/* 탭 네비게이션 */}
      <div style={{ marginBottom: '30px', borderBottom: '1px solid #ddd' }}>
        {[
          { key: 'dashboard', label: '대시보드' },
          { key: 'users', label: '사용자 관리' },
          { key: 'tags', label: '태그 관리' },
          { key: 'upload', label: '컨텐츠 업로드' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 20px',
              marginRight: '10px',
              backgroundColor: activeTab === tab.key ? '#007bff' : 'transparent',
              color: activeTab === tab.key ? 'white' : '#007bff',
              border: '1px solid #007bff',
              borderRadius: '4px 4px 0 0',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* 탭 내용 */}
      <div>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'users' && renderUserManagement()}
        {activeTab === 'tags' && renderTagManagement()}
        {activeTab === 'upload' && renderContentUpload()}
      </div>
    </div>
  );
};

export default Admin;