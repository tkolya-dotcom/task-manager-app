import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { purchaseRequestsApi, tasksApi, installationsApi } from '../api';

const PurchaseRequests = () => {
  const { isManager, isWorker } = useAuth();
  const [requests, setRequests] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [installations, setInstallations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    task_id: '',
    installation_id: '',
    comment: '',
    status: 'draft'
  });
  
  const [itemFormData, setItemFormData] = useState({
    name: '',
    quantity: 1,
    unit: 'шт'
  });

  useEffect(() => {
    loadRequests();
    loadRelatedData();
  }, [filter]);

  const loadRequests = async () => {
    try {
      const filters = filter !== 'all' ? { status: filter } : {};
      const data = await purchaseRequestsApi.getAll(filters);
      setRequests(data.purchaseRequests || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedData = async () => {
    try {
      const [tasksData, installationsData] = await Promise.all([
        tasksApi.getAll(),
        installationsApi.getAll()
      ]);
      setTasks(tasksData.tasks || []);
      setInstallations(installationsData.installations || []);
    } catch (err) {
      console.error('Error loading related data:', err);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await purchaseRequestsApi.create(formData);
      setShowCreateModal(false);
      setFormData({ task_id: '', installation_id: '', comment: '', status: 'draft' });
      loadRequests();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await purchaseRequestsApi.addItem(selectedRequest.id, itemFormData);
      setItemFormData({ name: '', quantity: 1, unit: 'шт' });
      loadRequests();
      // Refresh the selected request to show new item
      const data = await purchaseRequestsApi.getById(selectedRequest.id);
      setSelectedRequest(data.purchaseRequest);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await purchaseRequestsApi.updateItem(editingItem.id, itemFormData);
      setEditingItem(null);
      setItemFormData({ name: '', quantity: 1, unit: 'шт' });
      loadRequests();
      // Refresh the selected request to show updated item
      const data = await purchaseRequestsApi.getById(selectedRequest.id);
      setSelectedRequest(data.purchaseRequest);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот item?')) return;
    setError('');
    try {
      await purchaseRequestsApi.deleteItem(itemId);
      loadRequests();
      // Refresh the selected request to show updated items
      const data = await purchaseRequestsApi.getById(selectedRequest.id);
      setSelectedRequest(data.purchaseRequest);
    } catch (err) {
      setError(err.message);
    }
  };

  const openItemsModal = async (request) => {
    try {
      const data = await purchaseRequestsApi.getById(request.id);
      setSelectedRequest(data.purchaseRequest);
      setShowItemsModal(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStatusChange = async (requestId, newStatus, comment) => {
    try {
      await purchaseRequestsApi.updateStatus(requestId, newStatus, comment);
      loadRequests();
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      draft: 'Черновик',
      pending: 'Ожидает',
      approved: 'Подтверждена',
      rejected: 'Отклонена'
    };
    return labels[status] || status;
  };

  const getRelatedName = (request) => {
    if (request.task) return `Задача: ${request.task.title}`;
    if (request.installation) return `Монтаж: ${request.installation.title}`;
    return '-';
  };

  const canManageItems = isWorker || isManager;

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div>
      <header className="header">
        <h1>Заявки на закупку</h1>
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
            <h3 className="card-title">Список заявок</h3>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #e0e0e0' }}
              >
                <option value="all">Все</option>
                <option value="draft">Черновики</option>
                <option value="pending">Ожидающие</option>
                <option value="approved">Подтверждённые</option>
                <option value="rejected">Отклонённые</option>
              </select>
              {canManageItems && (
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                  Создать заявку
                </button>
              )}
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          {requests.length === 0 ? (
            <div className="empty-state">
              <h3>Нет заявок</h3>
              <p>Заявки на закупку материалов появятся здесь</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Связанный объект</th>
                  <th>Создатель</th>
                  <th>Статус</th>
                  <th>Комментарий</th>
                  <th>Дата создания</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(request => (
                  <tr key={request.id}>
                    <td>{getRelatedName(request)}</td>
                    <td>{request.creator?.name || '-'}</td>
                    <td>
                      <span className={`status-badge status-${request.status}`}>
                        {getStatusLabel(request.status)}
                      </span>
                    </td>
                    <td>{request.comment || '-'}</td>
                    <td>{new Date(request.created_at).toLocaleDateString('ru-RU')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '5px', flexDirection: 'column' }}>
                        {isManager && request.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button
                              className="btn btn-success"
                              onClick={() => handleStatusChange(request.id, 'approved', '')}
                              style={{ padding: '5px 10px', fontSize: '12px' }}
                            >
                              Подтвердить
                            </button>
                            <button
                              className="btn btn-danger"
                              onClick={() => handleStatusChange(request.id, 'rejected', '')}
                              style={{ padding: '5px 10px', fontSize: '12px' }}
                            >
                              Отклонить
                            </button>
                          </div>
                        )}
                        {canManageItems && (
                          <button
                            className="btn btn-secondary"
                            onClick={() => openItemsModal(request)}
                            style={{ padding: '5px 10px', fontSize: '12px' }}
                          >
                            Управление items ({request.items?.length || 0})
                          </button>
                        )}
                        {request.items && request.items.length > 0 && (
                          <div style={{ marginTop: '5px' }}>
                            <ul style={{ margin: '5px 0 0 15px', padding: 0 }}>
                              {request.items.slice(0, 2).map(item => (
                                <li key={item.id} style={{ fontSize: '12px' }}>
                                  {item.name} - {item.quantity} {item.unit}
                                </li>
                              ))}
                              {request.items.length > 2 && (
                                <li style={{ fontSize: '12px', color: '#757575' }}>
                                  ...ещё {request.items.length - 2} позиций
                                </li>
                              )}
                            </ul>
                          </div>
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

      {/* Create Request Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Создать заявку на закупку</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateRequest}>
              {error && <div className="error">{error}</div>}
              <div className="form-group">
                <label>Связать с задачей</label>
                <select
                  value={formData.task_id}
                  onChange={e => setFormData({ ...formData, task_id: e.target.value, installation_id: '' })}
                >
                  <option value="">Выберите задачу</option>
                  {tasks.map(task => (
                    <option key={task.id} value={task.id}>{task.title}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Связать с монтажом</label>
                <select
                  value={formData.installation_id}
                  onChange={e => setFormData({ ...formData, installation_id: e.target.value, task_id: '' })}
                  disabled={!!formData.task_id}
                >
                  <option value="">Выберите монтаж</option>
                  {installations.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.title}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Комментарий</label>
                <textarea
                  value={formData.comment}
                  onChange={e => setFormData({ ...formData, comment: e.target.value })}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Items Management Modal */}
      {showItemsModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => { setShowItemsModal(false); setSelectedRequest(null); setEditingItem(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>Управление items заявки</h2>
              <button className="modal-close" onClick={() => { setShowItemsModal(false); setSelectedRequest(null); setEditingItem(null); }}>&times;</button>
            </div>
            <div style={{ padding: '20px' }}>
              {error && <div className="error">{error}</div>}
              
              {/* Add/Edit Item Form */}
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <h4>{editingItem ? 'Редактировать item' : 'Добавить item'}</h4>
                <form onSubmit={editingItem ? handleUpdateItem : handleAddItem}>
                  <div className="form-group">
                    <label>Название *</label>
                    <input
                      type="text"
                      value={itemFormData.name}
                      onChange={e => setItemFormData({ ...itemFormData, name: e.target.value })}
                      required
                      placeholder="Например: Болты М10"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Количество *</label>
                      <input
                        type="number"
                        min="1"
                        value={itemFormData.quantity}
                        onChange={e => setItemFormData({ ...itemFormData, quantity: parseInt(e.target.value) || 1 })}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Единица</label>
                      <select
                        value={itemFormData.unit}
                        onChange={e => setItemFormData({ ...itemFormData, unit: e.target.value })}
                      >
                        <option value="шт">шт</option>
                        <option value="кг">кг</option>
                        <option value="м">м</option>
                        <option value="м2">м2</option>
                        <option value="м3">м3</option>
                        <option value="упаковка">упаковка</option>
                        <option value="комплект">комплект</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button type="submit" className="btn btn-primary">
                      {editingItem ? 'Сохранить' : 'Добавить'}
                    </button>
                    {editingItem && (
                      <button type="button" className="btn btn-secondary" onClick={() => { setEditingItem(null); setItemFormData({ name: '', quantity: 1, unit: 'шт' }); }}>
                        Отмена
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Items List */}
              <h4>Список items</h4>
              {selectedRequest.items && selectedRequest.items.length > 0 ? (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Название</th>
                      <th>Количество</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRequest.items.map(item => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.quantity} {item.unit}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button
                              className="btn btn-primary"
                              onClick={() => { setEditingItem(item); setItemFormData({ name: item.name, quantity: item.quantity, unit: item.unit }); }}
                              style={{ padding: '5px 10px', fontSize: '12px' }}
                            >
                              Изменить
                            </button>
                            <button
                              className="btn btn-danger"
                              onClick={() => handleDeleteItem(item.id)}
                              style={{ padding: '5px 10px', fontSize: '12px' }}
                            >
                              Удалить
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: '#757575' }}>Нет items в этой заявке</p>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => { setShowItemsModal(false); setSelectedRequest(null); setEditingItem(null); }}>
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseRequests;
