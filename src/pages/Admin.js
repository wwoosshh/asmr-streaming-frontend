import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // 대시보드 상태
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalContents: 0,
    totalViews: 0
  });

  // 사용자 관리 상태
  const [users, setUsers] = useState([]);
  const [usersPagination, setUsersPagination] = useState({
    page: 1,
    totalPages: 1
  });

  // 컨텐츠 업로드 상태
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    contentRating: '19세',
    durationMinutes: '',
    tags: ''
  });
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

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
      const response = await api.get('/api/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('통계 조회 오류:', error);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get(`/api/auth/users?page=${usersPagination.page}&limit=10`);
      setUsers(response.data.users);
      setUsersPagination(prev => ({
        ...prev,
        totalPages: response.data.pagination.totalPages
      }));
    } catch (error) {
      console.error('사용자 목록 조회 오류:', error);
      alert('사용자 목록을 불러오는데 실패했습니다.');
    }
  }, [usersPagination.page]);

  useEffect(() => {
    checkAdminAuth();
  }, [checkAdminAuth]);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchStats();
    } else if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab, fetchStats, fetchUsers]);

  // API 변경사항에 맞춰 수정된 함수
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

  const handleUploadFormChange = (e) => {
    setUploadForm({
      ...uploadForm,
      [e.target.name]: e.target.value
    });
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
    
    // 오디오 파일 확인
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
      
      // 폼 데이터 추가
      Object.keys(uploadForm).forEach(key => {
        formData.append(key, uploadForm[key]);
      });
      
      // 파일 추가
      uploadFiles.forEach(file => {
        formData.append('files', file);
      });
      
      console.log('컨텐츠 업로드 시작');
      
      const response = await api.post('/api/admin/contents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 5 * 60 * 1000 // 5분 타임아웃
      });
      
      alert(`컨텐츠가 성공적으로 업로드되었습니다! (ID: ${response.data.contentId})`);
      
      // 폼 초기화
      setUploadForm({
        title: '',
        description: '',
        contentRating: '19세',
        durationMinutes: '',
        tags: ''
      });
      setUploadFiles([]);
      
      // 파일 input 초기화
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        fileInput.value = '';
      }
      
      // 통계 업데이트
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

  const renderDashboard = () => (
    <div>
      <h3>관리자 대시보드</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
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
      </div>
      <p>환영합니다, {user?.username}님! 관리자 패널입니다.</p>
    </div>
  );

  const renderUserManagement = () => (
    <div>
      <h3>사용자 관리</h3>
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
                  {new Date(userData.created_at).toLocaleDateString()}
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
      </div>
      
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
  );

  const renderContentUpload = () => (
    <div>
      <h3>컨텐츠 업로드</h3>
      <div style={{ backgroundColor: '#e7f3ff', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <strong>📋 업로드 안내:</strong><br />
        • 컨텐츠 ID는 자동으로 생성됩니다<br />
        • 업로드 후 파일명을 수동으로 변경해야 합니다<br />
        • 오디오 파일명: ID.m4a, ID_1.m4a, ID_2.m4a...<br />
        • 이미지 파일명: ID.jpg, ID_1.jpg, ID_2.jpg...
      </div>
      
      <form onSubmit={handleUploadSubmit} style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
        <div style={{ marginBottom: '20px' }}>
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
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>설명 *</label>
          <textarea
            name="description"
            value={uploadForm.description}
            onChange={handleUploadFormChange}
            placeholder="컨텐츠 설명을 입력하세요"
            rows="4"
            disabled={uploading}
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>수위</label>
            <select
              name="contentRating"
              value={uploadForm.contentRating}
              onChange={handleUploadFormChange}
              disabled={uploading}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="전체">전체이용가</option>
              <option value="15세">15세 이용가</option>
              <option value="19세">19세 이용가</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>재생시간 (분)</label>
            <input
              type="number"
              name="durationMinutes"
              value={uploadForm.durationMinutes}
              onChange={handleUploadFormChange}
              placeholder="예: 60"
              min="0"
              disabled={uploading}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>태그</label>
            <input
              type="text"
              name="tags"
              value={uploadForm.tags}
              onChange={handleUploadFormChange}
              placeholder="태그1, 태그2, 태그3"
              disabled={uploading}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
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
              <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                {uploadFiles.map((file, index) => (
                  <li key={index}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={uploading}
          style={{
            width: '100%',
            padding: '15px',
            backgroundColor: uploading ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: uploading ? 'not-allowed' : 'pointer'
          }}
        >
          {uploading ? '업로드 중...' : '컨텐츠 업로드'}
        </button>
      </form>
    </div>
  );

  if (!user) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className="container" style={{ marginTop: '20px' }}>
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
        {activeTab === 'upload' && renderContentUpload()}
      </div>
    </div>
  );
};

export default Admin;