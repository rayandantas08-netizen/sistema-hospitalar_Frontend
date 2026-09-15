import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import { subscribeToCalls, playHospitalChime, type CallPayload } from '../services/callService';

const priorityClass: Record<string, string> = {
  Vermelho: 'tv-red',
  Laranja: 'tv-orange',
  Amarelo: 'tv-yellow',
  Verde: 'tv-green',
  Azul: 'tv-blue',
};

export default function TvPanelPage() {
  const [currentCall, setCurrentCall] = useState<CallPayload | null>(() => {
    try {
      const saved = localStorage.getItem('hospitalar_last_called');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [callHistory, setCallHistory] = useState<CallPayload[]>(() => {
    try {
      const saved = localStorage.getItem('hospitalar_call_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [now, setNow] = useState(new Date());
  const [isFlashing, setIsFlashing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Digital Clock
  useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(clock);
  }, []);

  // Fetch initial active call and queue from API
  useEffect(() => {
    apiFetch<CallPayload[]>('/chamadas/ultimas')
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCurrentCall(data[0]);
          setCallHistory(data.slice(1));
        }
      })
      .catch(() => {
        // Se a API ainda não tiver chamadas no banco, mantém apenas o histórico local real
      });
  }, []);

  // Listen for real calls (no automatic fake timer!)
  useEffect(() => {
    const unsubscribe = subscribeToCalls((call) => {
      setCurrentCall(call);
      setCallHistory((prev) => [call, ...prev.filter((c) => c.senha !== call.senha)].slice(0, 8));

      // Trigger audio chime if sound is enabled
      if (soundEnabled) {
        playHospitalChime();
      }

      // Visual flash animation
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 2500);
    });

    return unsubscribe;
  }, [soundEnabled]);

  return (
    <main className="tv-panel-page">
      <header className="tv-header">
        <div className="tv-brand">
          <i className="fas fa-hospital" />
          <div>
            <h1>Hospital Central de Clínicas</h1>
            <p>Painel Eletrônico de Chamadas · Recepção e Triagem</p>
          </div>
        </div>

        <div className="tv-header-right">
          <button
            type="button"
            className={`tv-sound-toggle ${soundEnabled ? 'sound-on' : 'sound-off'}`}
            onClick={() => {
              setSoundEnabled((v) => !v);
              if (!soundEnabled) playHospitalChime();
            }}
            title={soundEnabled ? 'Aviso sonoro ativado' : 'Aviso sonoro desativado'}
          >
            <i className={`fas ${soundEnabled ? 'fa-volume-high' : 'fa-volume-xmark'}`} />
            <span>{soundEnabled ? 'Áudio Ativo' : 'Áudio Mudo'}</span>
          </button>

          <div className="tv-clock">
            <strong>{now.toLocaleTimeString('pt-BR')}</strong>
            <span>
              {now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
      </header>

      <div className="tv-content">
        {/* Main call display - Only shows when someone is actually called */}
        <section className={`called-card ${isFlashing ? 'called-flash' : ''}`}>
          <p className="called-label">
            <i className="fas fa-bullhorn" /> Chamando Agora
          </p>

          {currentCall ? (
            <div className="called-content">
              <div className="called-main-info">
                <span className="called-code">{currentCall.senha}</span>
                <p className="called-name">{currentCall.nome}</p>
                <div className="called-room-pill">
                  <i className="fas fa-door-open" /> {currentCall.sala}
                </div>
                {currentCall.medicoOuResponsavel && (
                  <small className="called-physician">
                    <i className="fas fa-user-doctor" /> {currentCall.medicoOuResponsavel}
                  </small>
                )}
              </div>
              <div className="called-badge-wrapper">
                <span className={`tv-badge ${priorityClass[currentCall.prioridade] || 'tv-yellow'}`}>
                  {currentCall.prioridade}
                </span>
                <small className="called-timestamp">Chamado às {currentCall.hora}</small>
              </div>
            </div>
          ) : (
            <div className="tv-idle-box">
              <div className="tv-idle-icon">
                <i className="fas fa-hospital-user" />
              </div>
              <h3>Aguardando Próxima Chamada</h3>
              <p>Por favor, acomode-se na sala de espera com seu documento e senha em mãos.</p>
              <span className="tv-idle-note">
                <i className="fas fa-circle-info" /> Sua senha e nome aparecerão com aviso sonoro assim que o consultório estiver disponível.
              </span>
            </div>
          )}
        </section>

        {/* Real call history */}
        <section className="queue-card">
          <p className="queue-label">
            <i className="fas fa-clock-rotate-left" /> Últimas Chamadas
          </p>
          <div className="tv-history-list">
            {callHistory.length > 0 ? (
              callHistory.map((item, idx) => (
                <div
                  className={`queue-item ${priorityClass[item.prioridade] || 'tv-blue'}`}
                  key={`${item.senha}-${idx}`}
                >
                  <div className="queue-item-left">
                    <strong>{item.senha}</strong>
                    <span className="queue-item-name">{item.nome}</span>
                  </div>
                  <div className="queue-item-right">
                    <b>{item.sala}</b>
                    <small>{item.hora}</small>
                  </div>
                </div>
              ))
            ) : (
              <div className="tv-empty-history">
                <i className="fas fa-inbox" />
                <span>Nenhuma chamada anterior registrada hoje.</span>
              </div>
            )}
          </div>
        </section>
      </div>

      <footer className="tv-footer">
        <i className="fas fa-shield-halved" /> Sistema Hospitalar Integrado · Fila prioritária conforme a Lei Federal nº 10.048 e Protocolo de Manchester.
      </footer>
    </main>
  );
}
