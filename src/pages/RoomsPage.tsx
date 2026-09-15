import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

interface HealthUnit {
  id: string;
  nome: string;
  tipo: string;
  cnes?: string;
  endereco?: string | { logradouro?: string; numero?: string; cidade?: string; estado?: string };
  telefone?: string;
  salas?: Room[];
}

interface Room {
  id: string;
  nome: string;
  tipo: string;
  responsavelNome?: string;
  status: string;
  unidadeSaudeId?: string;
  pacientesFila?: number;
}

export default function RoomsPage() {
  const { token } = useAuth();
  const [units, setUnits] = useState<HealthUnit[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [filterType, setFilterType] = useState('Todas as categorias');
  const [loading, setLoading] = useState(true);

  // Fetch real units and rooms from API
  useEffect(() => {
    if (!token) return;

    setLoading(true);
    Promise.all([
      apiFetch<HealthUnit[]>('/unidades', {}, token).catch(() => []),
      apiFetch<Room[]>('/salas', {}, token).catch(() => []),
    ])
      .then(([dbUnits, dbRooms]) => {
        const validUnits = Array.isArray(dbUnits) ? dbUnits : [];
        const validRooms = Array.isArray(dbRooms) ? dbRooms : [];
        setUnits(validUnits);
        setRooms(validRooms);

        if (validUnits.length > 0) {
          setSelectedUnitId(validUnits[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  const activeUnit = units.find((u) => u.id === selectedUnitId) || units[0];
  const unitRooms = rooms.filter((r) => !selectedUnitId || r.unidadeSaudeId === selectedUnitId || !r.unidadeSaudeId);

  const filteredRooms = unitRooms.filter((room) => {
    if (filterType === 'Todas as categorias') return true;
    if (filterType === 'Consultórios') return room.tipo?.toLowerCase().includes('clínica') || room.tipo?.toLowerCase().includes('consultório');
    if (filterType === 'Emergência') return room.nome?.toLowerCase().includes('vermelha') || room.tipo?.toLowerCase().includes('emergência');
    if (filterType === 'Farmácia') return room.tipo?.toLowerCase().includes('farmácia');
    if (filterType === 'Exames') return room.tipo?.toLowerCase().includes('exames') || room.tipo?.toLowerCase().includes('diagnóstico');
    return true;
  });

  return (
    <div className="page-wrap rooms-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Gestão de infraestrutura clínica</p>
          <h2>Unidades, Salas e Setores</h2>
          <p className="page-subtitle">Estrutura física carregada diretamente do banco de dados.</p>
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={() => window.dispatchEvent(new CustomEvent('module-create'))}
        >
          <i className="fas fa-plus" /> Nova Sala ou Unidade
        </button>
      </header>

      {loading ? (
        <div className="reference-empty compact">
          <i className="fas fa-circle-notch fa-spin" />
          <strong>Carregando unidades e salas do banco de dados...</strong>
        </div>
      ) : units.length > 0 ? (
        <div className="rooms-layout">
          <aside className="unit-selector reference-card">
            <div className="card-heading">
              <i className="fas fa-building" /> <strong>Unidades no Banco de Dados ({units.length})</strong>
            </div>
            <div className="unit-selector-list">
              {units.map((item) => {
                const isSelected = item.id === selectedUnitId;
                const countRooms = rooms.filter((r) => r.unidadeSaudeId === item.id).length;
                return (
                  <button
                    type="button"
                    className={`unit-selector-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedUnitId(item.id)}
                    key={item.id}
                  >
                    <span className="unit-selector-icon">
                      <i className={item.tipo?.includes('UPA') ? 'fas fa-truck-medical' : 'fas fa-hospital'} />
                    </span>
                    <div className="unit-selector-meta">
                      <strong>{item.nome}</strong>
                      <small>{item.tipo || 'Unidade de Saúde'} · {countRooms} salas</small>
                    </div>
                    <i className="fas fa-chevron-right unit-chevron" />
                  </button>
                );
              })}
            </div>
          </aside>

          <main className="rooms-content-area">
            {activeUnit && (
              <section className="unit-hero reference-card">
                <div className="unit-hero-icon">
                  <i className={activeUnit.tipo?.includes('UPA') ? 'fas fa-truck-medical' : 'fas fa-hospital'} />
                </div>
                <div className="unit-hero-info">
                  <p className="eyebrow">Unidade Selecionada</p>
                  <h3>{activeUnit.nome}</h3>
                  <div className="unit-hero-details">
                    <span>
                      <i className="fas fa-location-dot" />{' '}
                      {typeof activeUnit.endereco === 'string'
                        ? activeUnit.endereco
                        : activeUnit.endereco?.logradouro
                        ? `${activeUnit.endereco.logradouro}, ${activeUnit.endereco.numero || ''} - ${activeUnit.endereco.cidade || ''}`
                        : 'Endereço cadastrado no banco'}
                    </span>
                    {activeUnit.telefone && (
                      <span><i className="fas fa-phone" /> {activeUnit.telefone}</span>
                    )}
                    {activeUnit.cnes && (
                      <span className="cnes-tag">CNES: {activeUnit.cnes}</span>
                    )}
                  </div>
                </div>
                <span className="status-pill status-active">
                  <i className="fas fa-circle" /> Operacional
                </span>
              </section>
            )}

            <div className="rooms-toolbar">
              <div>
                <h3>Salas e Setores em Funcionamento</h3>
                <p>Gerenciamento de ocupação, médicos alocados e direcionamento de chamadas.</p>
              </div>
              <select
                aria-label="Filtrar por categoria de sala"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option>Todas as categorias</option>
                <option>Consultórios</option>
                <option>Emergência</option>
                <option>Farmácia</option>
                <option>Exames</option>
              </select>
            </div>

            {filteredRooms.length > 0 ? (
              <div className="room-grid">
                {filteredRooms.map((room) => {
                  const isRed = room.nome?.toLowerCase().includes('vermelha');
                  return (
                    <article
                      className={`room-card ${isRed ? 'red-room-card' : ''}`}
                      key={room.id || room.nome}
                    >
                      <div className="room-card-top">
                        <span className="room-type-icon">
                          <i
                            className={
                              isRed
                                ? 'fas fa-truck-medical'
                                : room.tipo?.includes('Farmácia')
                                ? 'fas fa-pills'
                                : room.tipo?.includes('Exames')
                                ? 'fas fa-microscope'
                                : 'fas fa-stethoscope'
                            }
                          />
                        </span>
                        <span className="status-pill status-active">
                          {room.status || 'Ativo'}
                        </span>
                      </div>

                      <h3>{room.nome}</h3>
                      <p>{room.tipo || 'Consultório'}</p>

                      <div className="room-owner">
                        <i className="fas fa-user-doctor" />
                        <div>
                          <small>Responsável</small>
                          <strong>{room.responsavelNome || 'Profissional Alocado'}</strong>
                        </div>
                      </div>

                      <footer>
                        <button type="button" className="room-btn-secondary">
                          <i className="fas fa-pen" /> Editar
                        </button>
                        {isRed ? (
                          <Link to="/sala-vermelha" className="room-btn-primary red-btn">
                            Abrir Emergência <i className="fas fa-arrow-right" />
                          </Link>
                        ) : (
                          <Link to="/atendimento" className="room-btn-primary">
                            Atender Fila <i className="fas fa-arrow-right" />
                          </Link>
                        )}
                      </footer>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="reference-empty compact">
                <i className="fas fa-door-closed" />
                <strong>Nenhuma sala encontrada no banco de dados para esta unidade</strong>
                <span>Adicione uma sala utilizando o botão acima para associá-la à escala médica.</span>
              </div>
            )}
          </main>
        </div>
      ) : (
        <div className="reference-empty">
          <i className="fas fa-building" />
          <strong>Nenhuma unidade de saúde cadastrada no banco de dados</strong>
          <span>Clique em "Nova Sala ou Unidade" para cadastrar hospitais e UPAs no sistema.</span>
        </div>
      )}
    </div>
  );
}
