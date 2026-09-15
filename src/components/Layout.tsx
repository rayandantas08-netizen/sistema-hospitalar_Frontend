import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function Layout() {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const location = useLocation();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const mainLinks = [
    ['dashboard', 'Dashboard', 'fa-chart-pie'],
    ['atendimento', 'Meu atendimento', 'fa-bullhorn'],
    ['pacientes', 'Pacientes', 'fa-users'],
    ['medicos', 'Médicos', 'fa-user-md'],
    ['enfermeiros', 'Enfermeiros', 'fa-user-nurse'],
    ['unidades', 'Unidades', 'fa-building'],
    ['salas', 'Salas por unidade', 'fa-door-open'],
    ['consultas', 'Consultas', 'fa-calendar-check'],
    ['triagem', 'Triagem', 'fa-heartbeat'],
    ['prontuarios', 'Prontuários', 'fa-file-medical'],
    ['prescricoes', 'Prescrições', 'fa-prescription'],
    ['relatorios', 'Relatórios', 'fa-chart-bar'],
  ];

  const supportLinks = [
    ['farmacia', 'Farmácia', 'fa-pills'],
    ['estoque', 'Estoque', 'fa-boxes-stacked'],
    ['movimentacoes', 'Movimentações', 'fa-exchange-alt'],
    ['dispensacao', 'Dispensação', 'fa-hand-holding-medical'],
  ];

  const purchaseLinks = [
    ['solicitacoes', 'Solicitações', 'fa-file-invoice'],
    ['notas-fiscais', 'Notas Fiscais', 'fa-file-invoice-dollar'],
    ['fornecedores', 'Fornecedores', 'fa-truck'],
  ];

  const linkGroup = (links: string[][]) =>
    links.map(([path, label, icon]) => (
      <NavLink
        key={path}
        to={`/${path}`}
        className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
        onClick={() => setMobileOpen(false)}
      >
        <i className={`nav-icon fas ${icon}`} aria-hidden="true" />
        <span className="sidebar-text">{label}</span>
      </NavLink>
    ));

  const formatPathTitle = (path: string) => {
    const clean = path.replace('/', '').split('/')[0] || 'dashboard';
    const dict: Record<string, string> = {
      dashboard: 'Dashboard',
      atendimento: 'Atendimento',
      pacientes: 'Pacientes',
      medicos: 'Médicos',
      enfermeiros: 'Enfermeiros',
      unidades: 'Unidades',
      salas: 'Salas e Setores',
      'sala-vermelha': 'Sala Vermelha',
      consultas: 'Consultas',
      triagem: 'Triagem Clínica',
      prontuarios: 'Prontuários',
      prescricoes: 'Prescrições',
      relatorios: 'Relatórios',
      farmacia: 'Farmácia',
      estoque: 'Estoque',
      movimentacoes: 'Movimentações',
      dispensacao: 'Dispensação',
      solicitacoes: 'Solicitações',
      'notas-fiscais': 'Notas Fiscais',
      fornecedores: 'Fornecedores',
      configuracoes: 'Configurações',
    };
    return dict[clean] || clean;
  };

  return (
    <div className={`app-shell ${collapsed ? 'shell-collapsed' : ''} ${mobileOpen ? 'mobile-drawer-open' : ''}`}>
      {/* Backdrop overlay for mobile drawer */}
      <div
        className={`sidebar-backdrop ${mobileOpen ? 'visible' : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      <aside className={`sidebar ${mobileOpen ? 'mobile-visible' : ''}`}>
        <div className="sidebar-scrollable">
          <div className="brand-block">
            <div className="brand-header-left">
              <div className="brand-mark">H</div>
              <div className="sidebar-text">
                <strong>Hospitalar</strong>
                <small>Gestão clínica</small>
              </div>
            </div>
            {/* Close button for mobile */}
            <button
              type="button"
              className="mobile-close-btn"
              onClick={() => setMobileOpen(false)}
              aria-label="Fechar menu de navegação"
            >
              <i className="fas fa-times" />
            </button>
          </div>

          <nav className="nav-menu">
            {linkGroup(mainLinks)}
            <NavLink
              to="/sala-vermelha"
              className={location.pathname === '/sala-vermelha' ? 'nav-item red-nav-item active' : 'nav-item red-nav-item'}
              onClick={() => setMobileOpen(false)}
            >
              <i className="nav-icon fas fa-truck-medical" aria-hidden="true" />
              <span className="sidebar-text">Sala Vermelha</span>
            </NavLink>

            <div className="nav-section sidebar-text">Farmácia & Estoque</div>
            {linkGroup(supportLinks)}

            <div className="nav-section sidebar-text">Compras</div>
            {linkGroup(purchaseLinks)}

            <div className="nav-section nav-section-last sidebar-text">Sistema</div>
            <NavLink
              to="/configuracoes"
              className={location.pathname === '/configuracoes' ? 'nav-item active' : 'nav-item'}
              onClick={() => setMobileOpen(false)}
            >
              <i className="nav-icon fas fa-cog" aria-hidden="true" />
              <span className="sidebar-text">Configurações</span>
            </NavLink>
            <Link className="nav-item" to="/painel" target="_blank" rel="noreferrer" onClick={() => setMobileOpen(false)}>
              <i className="nav-icon fas fa-tv" aria-hidden="true" />
              <span className="sidebar-text">Painel TV</span>
            </Link>
          </nav>
        </div>

        <div className="user-panel">
          <div className="user-panel-info">
            <div className="avatar user-avatar-small">{(user?.nome || 'U').slice(0, 2).toUpperCase()}</div>
            <div className="sidebar-text">
              <strong>{user?.nome || 'Usuário'}</strong>
              <small>{user?.papel?.replace('_', ' ') || 'Perfil'}</small>
            </div>
          </div>
          <button type="button" onClick={logout} className="logout-button" title="Sair do sistema">
            <i className="fas fa-right-from-bracket" /> <span className="sidebar-text">Sair</span>
          </button>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu-toggle"
              type="button"
              onClick={() => {
                if (window.innerWidth <= 840) {
                  setMobileOpen((open) => !open);
                } else {
                  setCollapsed((value) => !value);
                }
              }}
              aria-label="Alternar menu de navegação"
            >
              <i className="fas fa-bars" />
            </button>

            <div className="mobile-brand-chip">
              <span className="brand-dot">H</span>
              <span className="brand-name">Hospitalar</span>
            </div>

            <div className="breadcrumbs">
              <span className="breadcrumb-root">Hospitalar</span>
              <b className="breadcrumb-sep">›</b>
              <strong className="breadcrumb-current">{formatPathTitle(location.pathname)}</strong>
            </div>
          </div>

          <div className="topbar-right">
            <div className={`network-badge ${isOnline ? 'online' : 'offline'}`} title={isOnline ? 'Conexão ativa com o banco de dados' : 'Modo offline detectado'}>
              <i className="fas fa-circle" /> <span>{isOnline ? 'Sincronizado' : 'Modo Offline'}</span>
            </div>
            <div className="unit-chip">
              <i className="fas fa-building" /> <span>{user?.unidadeSaudeNome || 'Hospital Central'}</span>
            </div>
            <div className="profile-summary">
              <div className="profile-text">
                <strong>{user?.nome || 'Usuário'}</strong>
                <small>{user?.papel?.replace('_', ' ') || 'Perfil'}</small>
              </div>
              <div className="avatar" title={user?.nome || 'Perfil'}>
                {(user?.nome || 'U').slice(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="content-panel">
          <Outlet />
        </main>

        {/* Mobile bottom quick action navigation */}
        <nav className="mobile-bottom-nav" aria-label="Navegação rápida mobile">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <i className="fas fa-chart-pie" />
            <span>Início</span>
          </NavLink>
          <NavLink
            to="/atendimento"
            className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <i className="fas fa-bullhorn" />
            <span>Atendimento</span>
          </NavLink>
          <NavLink
            to="/pacientes"
            className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <i className="fas fa-users" />
            <span>Pacientes</span>
          </NavLink>
          <NavLink
            to="/sala-vermelha"
            className={({ isActive }) => `bottom-nav-item red-accent ${isActive ? 'active' : ''}`}
          >
            <i className="fas fa-truck-medical" />
            <span>Emergência</span>
          </NavLink>
          <button
            type="button"
            className={`bottom-nav-item ${mobileOpen ? 'active' : ''}`}
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir todas as opções do menu"
          >
            <i className="fas fa-bars" />
            <span>Menu</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
