import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { installationsApi, projectsApi, authApi } from '../api';

const Installations = () => {
  const { isManager } = useAuth();
  const [installations, setInstallations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingInstallation, setEditingInstallation] = useState(null);
  const [deletingInstallation, setDeletingInstallation] = useState(null);
  const [formData, setFormData] = useState({
    project_id: '',
    title: '',
    description: '',
    assignee_id: '',
    status: 'new',
    scheduled_at: '',
    address: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [installationsRes, projectsRes, usersRes] = await Promise.all([
        installationsApi.getAll(),
        projectsApi.getAll(),
        authApi.getUsers('worker')
      ]);
      setInstallations(installationsRes.installations || []);
      setProjects(projectsRes.projects || []);
      setUsers(usersRes.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingInstallation) {
        await installationsApi.update(editingInstallation.id, formData);
        setShowModal(false);
        setEditingInstallation(null);
      } else {
        await installationsApi.create(formData);
        setShowModal(false);
      }
      setFormData({
        project_id: '',
        title: '',
        description: '',
        assignee_id: '',
        status: 'new',
        scheduled_at: '',
        address: ''
      });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (installation) => {
    setEditingInstallation(installation);
    setFormData({
      project_id: installation.project_id || '',
      title: installation.title || '',
      description: installation.description || '',
      assignee_id: installation.assignee_id || '',
      status: installation.status || 'new',
      scheduled_at: installation.scheduled_at ? installation.scheduled_at.slice(0, 16) : '',
      address: installation.address || ''
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      await installationsApi.delete(deletingInstallation.id);
      setShowDeleteModal(false);
      setDeletingInstallation(null);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const openCreateModal = () => {
    setEditingInstallation(null);
    setFormData({
      project_id: '',
      title: '',
      description: '',
      assignee_id: '',
      status: 'new',
      scheduled_at: '',
      address: ''
    });
    setShowModal(true);
  };

  const handleStatusChange = async (installationId, newStatus) => {
    try {
      await installationsApi.update(installationId, { status: newStatus });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      new: 'Новый',
      planned: 'Запланирован',
      in_progress: 'В работе',
      waiting_materials: 'Ожидает материалов',
      done: 'Завершён',
      postponed: 'Отложен'
    };
    return labels[status] || status;
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div>
      <header className="header">
        <h1>Монтажи</h1>
        <nav className="header-nav">
          <Link to="/">Главная</Link>
          <Link to="/projects">Проекты</Link>
          <Link to="/tasks">Задачи</Link>
          <Link to="/installations">Монтажи</Link>
          <Link to="/purchase-requests">Заявки</Link>
        </nav>
      </header>

      <main className="container">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Список монтажей</h3>
            {isManager && (
              <button className="btn btn-primary" onClick={openCreateModal}>
                Создать монтаж
              </button>
            )}
          </div>

          {error && <div className="error">{error}</div>}

          {installations.length === 0 ? (
            <div className="empty-state">
              <h3>Нет монтажей</h3>
              <p>Создайте первый монтаж</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Проект</th>
                  <th>Исполнитель</th>
                  <th>Статус</th>
                  <th>Дата</th>
                  <th>Адрес</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {installations.map(inst => (
                  <tr key={inst.id}>
                    <td>{inst.title}</td>
                    <td>{inst.project?.name || '-'}</td>
                    <td>{inst.assignee?.name || '-'}</td>
                    <td>
                      <select
                        className={`status-badge status-${inst.status}`}
                        value={inst.status}
                        onChange={(e) => handleStatusChange(inst.id, e.target.value)}
                        style={{ border: 'none', cursor: 'pointer' }}
                      >
                        <option value="new">Новый</option>
                        <option value="planned">Запланирован</option>
                        <option value="in_progress">В работе</option>
                        <option value="waiting_materials">Ожидает материалов</option>
                        <option value="done">Завершён</option>
                        <option value="postponed">Отложен</option>
                      </select>
                    </td>
                    <td>{inst.scheduled_at ? new Date(inst.scheduled_at).toLocaleDateString('ru-RU') : '-'}</td>
                    <td>{inst.address || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <Link to={`/installations/${inst.id}`} className="btn btn-secondary">
                          Подробнее
                        </Link>
                        {isManager && (
                          <>
                            <button 
                              className="btn btn-primary" 
                              onClick={() => handleEdit(inst)}
                              style={{ padding: '5px 10px', fontSize: '12px' }}
                            >
                              Изменить
                            </button>
                            <button 
                              className="btn btn-danger" 
                              onClick={() => {
                                setDeletingInstallation(inst);
                                setShowDeleteModal(true);
                              }}
                              style={{ padding: '5px 10px', fontSize: '12px' }}
                            >
                              Удалить
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingInstallation ? 'Редактировать монтаж' : 'Создать монтаж'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              {error && <div className="error">{error}</div>}
              <div className="form-group">
                <label>Проект *</label>
                <select
                  value={formData.project_id}
                  onChange={e => setFormData({ ...formData, project_id: e.target.value })}
                  required
                >
                  <option value="">Выберите проект</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Название *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Описание</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Исполнитель</label>
                <select
                  value={formData.assignee_id}
                  onChange={e => setFormData({ ...formData, assignee_id: e.target.value })}
                >
                  <option value="">Выберите исполнителя</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Дата монтажа</label>
                <input
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={e => setFormData({ ...formData, scheduled_at: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Адрес</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingInstallation ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Подтверждение удаления</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>&times;</button>
            </div>
            <div style={{ padding: '20px' }}>
              <p>Вы уверены, что хотите удалить монтаж "{deletingInstallation?.title}"?</p>
              <p style={{ color: '#d32f2f', fontSize: '14px' }}>Это действие нельзя отменить.</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Отмена
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDelete}>
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Installations;
