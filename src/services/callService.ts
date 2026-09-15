// Central Event and Audio Service for Real-Time Hospital Calls (TV Panel & Consultórios)

export interface CallPayload {
  senha: string;
  nome: string;
  sala: string;
  prioridade: 'Vermelho' | 'Laranja' | 'Amarelo' | 'Verde' | 'Azul';
  hora: string;
  medicoOuResponsavel?: string;
}

const BROADCAST_CHANNEL_NAME = 'hospitalar_calls_channel';

// Web Audio API Synthesizer for pleasant two-tone hospital chime (Ding-Dong)
export function playHospitalChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Tone 1: High note (e.g. 659.25 Hz - E5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.9);

    // Tone 2: Lower harmonic note (e.g. 523.25 Hz - C5) starting at +0.4s
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(523.25, now + 0.4);
    gain2.gain.setValueAtTime(0, now + 0.4);
    gain2.gain.linearRampToValueAtTime(0.35, now + 0.45);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.4);
    osc2.stop(now + 1.6);
  } catch (err) {
    console.warn('Audio autoplay restrictions or unsupported audio context:', err);
  }
}

// Broadcast a call across tabs and save to storage
export function broadcastCall(call: CallPayload) {
  try {
    localStorage.setItem('hospitalar_last_called', JSON.stringify(call));
    const historyRaw = localStorage.getItem('hospitalar_call_history');
    const history: CallPayload[] = historyRaw ? JSON.parse(historyRaw) : [];
    const newHistory = [call, ...history.filter((c) => c.senha !== call.senha)].slice(0, 10);
    localStorage.setItem('hospitalar_call_history', JSON.stringify(newHistory));
  } catch (e) {
    console.error('Error saving call to localStorage', e);
  }

  try {
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.postMessage({ type: 'CALL_PATIENT', payload: call });
      channel.close();
    }
  } catch (e) {
    console.error('BroadcastChannel error', e);
  }
}

// Subscribe to calls in the TV Panel
export function subscribeToCalls(onCall: (call: CallPayload) => void): () => void {
  let channel: BroadcastChannel | null = null;

  if ('BroadcastChannel' in window) {
    channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    channel.onmessage = (event) => {
      if (event.data?.type === 'CALL_PATIENT' && event.data.payload) {
        onCall(event.data.payload);
      }
    };
  }

  const handleStorage = (e: StorageEvent) => {
    if (e.key === 'hospitalar_last_called' && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        onCall(parsed);
      } catch {
        // ignore
      }
    }
  };

  window.addEventListener('storage', handleStorage);

  return () => {
    if (channel) {
      channel.close();
    }
    window.removeEventListener('storage', handleStorage);
  };
}
