import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectsApi, tasksApi, installationsApi, purchaseRequestsApi } from '../api';

const Dashboard = () => {
  const { user, isManager, logout } = useAuth();
  const [stats, setStats] = useState({
    projects: 0,
    tasks: 0,
    installations: 0,
    pendingRequests: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [projectsRes, tasksRes, installationsRes, requestsRes] = await Promise.all([
        projectsApi.getAll(),
        tasksApi.getAll(),
        installationsApi.getAll(),
        purchaseRequestsApi.getAll()
      ]);

      setStats({
        projects: projectsRes.projects?.length || 0,
        tasks: tasksRes.tasks?.length || 0,
        installations: installationsRes.installations?.length || 0,
        pendingRequests: requestsRes.purchaseRequests?.filter(r => r.status === 'pending').length || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div>
      <header className="header">
        <h1>Система управления задачами</h1>
        <nav className="header-nav">
          <Link to="/">Главная</Link>
          <Link to="/projects">Проекты</Link>
          <Link to="/tasks">Задачи</Link>
          <Link to="/installations">Монтажи</Link>
          <Link to="/purchase-requests">Заявки</Link>
        </nav>
        <div className="header-user">
          <span>{user.name} ({user.role === 'manager' ? 'Руководитель' : 'Исполнитель'})</span>
          <button onClick={logout}>Выйти</button>
        </div>
      </header>

      <main className="container">
        <h2 style={{ marginBottom: '20px' }}>Добро пожаловать, {user.name}!</h2>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>{stats.projects}</h3>
            <p>Проектов</p>
            <Link to="/projects" className="btn btn-primary" style={{ marginTop: '10px', display: 'inline-block' }}>
              Подробнее
            </Link>
          </div>

          <div className="stat-card">
            <h3>{stats.tasks}</h3>
            <p>Задач</p>
            <Link to="/tasks" className="btn btn-primary" style={{ marginTop: '10px', display: 'inline-block' }}>
              Подробнее
            </Link>
          </div>

          <div className="stat-card">
            <h3>{stats.installations}</h3>
            <p>Монтажей</p>
            <Link to="/installations" className="btn btn-primary" style={{ marginTop: '10px', display: 'inline-block' }}>
              Подробнее
            </Link>
          </div>

          <div className="stat-card">
            <h3>{stats.pendingRequests}</h3>
            <p>Ожидающих заявок</p>
            <Link to="/purchase-requests" className="btn btn-primary" style={{ marginTop: '10px', display: 'inline-block' }}>
              Подробнее
            </Link>
          </div>
        </div>

        {isManager && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Быстрые действия</h3>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Link to="/projects" className="btn btn-primary">Создать проект</Link>
              <Link to="/tasks" className="btn btn-primary">Создать задачу</Link>
              <Link to="/installations" className="btn btn-primary">Создать монтаж</Link>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Информация</h3>
          </div>
          <p>Вы вошли в систему как {user.role === 'manager' ? 'руководитель' : 'исполнитель'}.</p>
          {isManager ? (
            <p style={{ marginTop: '10px' }}>У вас есть доступ ко всем проектам, задачам и монтажам. Вы можете подтверждать или отклонять заявки на закупку материалов.</p>
          ) : (
            <p style={{ marginTop: '10px' }}>Вы видите только задачи и монтажи, назначенные вам. Вы можете создавать заявки на закупку материалов для своих задач.</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
