import { useEffect, useState } from 'react';
import { apiFetch, extrairLista } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { broadcastCall } from '../services/callService';

interface QueueItem {
  id: string;
  code: string;
  name: string;
  reason: string;
  priority: 'Vermelho' | 'Laranja' | 'Amarelo' | 'Verde' | 'Azul';
  room: string;
  wait: string;
  time: string;
}

interface RoomOption {
  id: string;
  nome: string;
  tipo: string;
  unidadeId?: string;
}

const priorityClass: Record<string, string> = {
  Vermelho: 'severity-vermelho',
  Laranja: 'severity-laranja',
  Amarelo: 'severity-amarelo',
  Verde: 'severity-verde',
  Azul: 'severity-azul',
};

export default function CareOperationsPage() {
  const { token, user } = useAuth();
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [called, setCalled] = useState<QueueItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch real rooms and real queue from API
  useEffect(() => {
    if (!token) return;

    setLoading(true);
    Promise.all([
      apiFetch('/salas?limite=200', {}, token).catch(() => []),
      apiFetch<QueueItem[]>('/chamadas/fila', {}, token).catch(() => []),
    ])
      .then(([dbRooms, dbQueue]) => {
        const roomList = extrairLista<RoomOption>(dbRooms);
        if (roomList.length > 0) {
          setRooms(roomList);
          setSelectedRoom(roomList[0].nome);
        } else {
          setRooms([]);
          setSelectedRoom('');
        }

        if (Array.isArray(dbQueue)) {
          setQueue(dbQueue);
        } else {
          setQueue([]);
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  const filteredQueue = queue.filter((item) => !selectedRoom || item.room === selectedRoom);

  async function handleCallNext() {
    const next = filteredQueue[0];
    if (!next) return;

    // Call API to persist the call
    try {
      if (token) {
        await apiFetch('/chamadas/chamar', {
          method: 'POST',
          body: JSON.stringify({
            pacienteId: next.id,
            senha: next.code,
            sala: selectedRoom,
            prioridade: next.priority,
          }),
        }, token);
      }
    } catch {
      // Continua com a chamada local se o endpoint ainda não existir no backend
    }

    // Broadcast to TV panel in real time (instant sound chime and flash)
    broadcastCall({
      senha: next.code,
      nome: next.name,
      sala: selectedRoom,
      prioridade: next.priority,
      hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      medicoOuResponsavel: user?.nome,
    });

    setCalled(next);
    setQueue((cur) => cur.filter((item) => item.code !== next.code));
  }

  function handleFinalize() {
    setCalled(null);
  }

  return (
    <div className="page-wrap care-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Operação clínica diária</p>
          <h2>Atendimento por Sala</h2>
          <p className="page-subtitle">Sincronizado com o banco de dados e integrado ao Painel de TV.</p>
        </div>
        <div className="header-status-badge">
          <span className="status-pill status-active">
            <i className="fas fa-circle" /> Painel de Chamada TV Conectado
          </span>
        </div>
      </header>

      {/* Room Selector as responsive tabs directly from the Database */}
      <section className="room-nav-tabs" aria-label="Seletor de Salas">
        <div className="room-nav-label">
          <i className="fas fa-door-open" /> <strong>Salas cadastradas no banco de dados:</strong>
        </div>

        {rooms.length > 0 ? (
          <div className="room-tabs-container">
            {rooms.map((room) => {
              const count = queue.filter((q) => q.room === room.nome).length;
              const isSelected = selectedRoom === room.nome;
              const isRed = room.nome.toLowerCase().includes('vermelha');

              return (
                <button
                  key={room.id || room.nome}
                  type="button"
                  className={`room-tab-pill ${isSelected ? 'active' : ''} ${isRed ? 'red-pill' : ''}`}
                  onClick={() => setSelectedRoom(room.nome)}
                >
                  <i className={`fas ${isRed ? 'fa-truck-medical' : 'fa-stethoscope'}`} />
                  <div className="room-tab-meta">
                    <span className="room-tab-name">{room.nome}</span>
                    <small className="room-tab-sub">{room.tipo || 'Consultório'}</small>
                  </div>
                  <span className={`room-tab-badge ${isSelected ? 'badge-active' : ''}`}>
                    {count} na fila
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="reference-empty compact">
            <i className="fas fa-door-closed" />
            <strong>Nenhuma sala encontrada no banco de dados</strong>
            <span>Cadastre salas no módulo "Salas por unidade" para vinculá-las ao atendimento.</span>
          </div>
        )}
      </section>

      {/* Context banner */}
      <section className="care-context">
        <div className="context-item">
          <span className="context-label">Unidade Atual</span>
          <strong>{user?.unidadeSaudeNome || 'Unidade Central'}</strong>
          <small>Fila de chamadas ativas</small>
        </div>
        <div className="context-item highlight-box">
          <span className="context-label">Sala Operando</span>
          <strong className="text-petrol">{selectedRoom || 'Nenhuma sala selecionada'}</strong>
          <small>{filteredQueue.length} aguardando nesta sala</small>
        </div>
        <div className="context-item">
          <span className="context-label">Profissional Responsável</span>
          <strong>{user?.nome || 'Profissional Autenticado'}</strong>
          <small>{user?.papel || 'Corpo Clínico'}</small>
        </div>
      </section>

      {/* Main Grid: Called Patient & Queue List */}
      <div className="care-grid">
        <section className="reference-card next-patient-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Chamada Atual</p>
              <h3>{called ? 'Paciente Chamado para Atendimento' : 'Pronto para Próxima Chamada'}</h3>
            </div>
            <span className="queue-counter">{filteredQueue.length} na fila</span>
          </div>

          {called ? (
            <div className="called-patient-box">
              <div className="called-header-badge">
                <span className={`queue-code ${priorityClass[called.priority] || 'severity-amarelo'}`}>{called.code}</span>
                <span className={`status-pill ${priorityClass[called.priority] || 'severity-amarelo'}`}>{called.priority}</span>
              </div>
              <div className="called-info">
                <h4>{called.name}</h4>
                <p className="called-reason"><i className="fas fa-stethoscope" /> {called.reason}</p>
                <div className="called-meta-chips">
                  <span><i className="fas fa-door-open" /> {selectedRoom}</span>
                  <span><i className="fas fa-clock" /> Chamado às {called.time}</span>
                  <span><i className="fas fa-hourglass-half" /> Espera: {called.wait}</span>
                </div>
              </div>

              <div className="called-actions-row">
                <button type="button" className="secondary-button" onClick={handleFinalize}>
                  <i className="fas fa-check" /> Finalizar Atendimento
                </button>
                <button type="button" className="outline-button" onClick={handleCallNext} disabled={!filteredQueue.length}>
                  <i className="fas fa-forward" /> Próximo da Fila
                </button>
              </div>
            </div>
          ) : (
            <div className="call-empty">
              <div className="call-empty-icon">
                <i className="fas fa-bullhorn" />
              </div>
              <strong>Pronto para chamar</strong>
              <span>Ao clicar no botão abaixo, a chamada tocará som na TV da recepção e exibirá a senha.</span>
            </div>
          )}

          <button
            type="button"
            className="primary-button call-button"
            onClick={handleCallNext}
            disabled={!filteredQueue.length || !selectedRoom}
          >
            <i className="fas fa-bullhorn" /> Chamar Próximo Paciente {selectedRoom ? `(${selectedRoom})` : ''}
          </button>
        </section>

        <section className="reference-card queue-list-card">
          <div className="section-heading">
            <div>
              <h3><i className="fas fa-list-ol" /> Fila no Banco de Dados</h3>
              <p className="section-subtitle">Pacientes triados aguardando atendimento nesta sala</p>
            </div>
            <span className="counter-chip">{filteredQueue.length} aguardando</span>
          </div>

          <div className="queue-list-body">
            {loading ? (
              <div className="reference-empty compact">
                <i className="fas fa-circle-notch fa-spin" />
                <strong>Carregando fila do banco de dados...</strong>
              </div>
            ) : filteredQueue.length > 0 ? (
              filteredQueue.map((item, idx) => (
                <div className="care-queue-row" key={item.code || item.id}>
                  <span className="queue-position-indicator">#{idx + 1}</span>
                  <span className={`queue-code ${priorityClass[item.priority] || 'severity-amarelo'}`}>{item.code}</span>
                  <div className="care-queue-meta">
                    <strong>{item.name}</strong>
                    <small>
                      <i className="fas fa-notes-medical" /> {item.reason} · Chegada: {item.time} (Espera: {item.wait})
                    </small>
                  </div>
                  <span className={`status-pill ${priorityClass[item.priority] || 'severity-amarelo'}`}>{item.priority}</span>
                </div>
              ))
            ) : (
              <div className="reference-empty compact">
                <i className="fas fa-clipboard-check" />
                <strong>Nenhum paciente aguardando no banco de dados</strong>
                <span>Não há triagens pendentes para esta sala no momento.</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
