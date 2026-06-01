import React, { useState, useEffect } from 'react';
import { 
  Wifi, WifiOff, RefreshCw, AlertTriangle, 
  MapPin, Check, Code, HelpCircle, Eye, Info, HardHat, CircleUser,
  ChevronRight, Copy, Plus, Minus
} from 'lucide-react';
import { StreetParkingZone } from '../types';

interface NaranjitaAppProps {
  streetZones: StreetParkingZone[];
  setStreetZones: React.Dispatch<React.SetStateAction<StreetParkingZone[]>>;
  onNotify: (message: string) => void;
}

export default function NaranjitaApp({
  streetZones,
  setStreetZones,
  onNotify,
}: NaranjitaAppProps) {
  // Carlos operates 'Calle Belgrano al 400'
  const myZone = streetZones.find(z => z.id === 'street-001') || streetZones[0];

  // Connection & Offline simulated helpers
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineQueue, setOfflineQueue] = useState<number>(0); // how many operations queued when offline
  const [syncLoading, setSyncLoading] = useState<boolean>(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Auto retry simulation if coming back online
  useEffect(() => {
    if (isOnline && offlineQueue !== 0) {
      handleSyncQueue();
    }
  }, [isOnline]);

  const handleSyncQueue = () => {
    setSyncLoading(true);
    onNotify('🔌 Detectada señal celular: Sincronizando cupos de via pública en Córdoba...');
    setTimeout(() => {
      setStreetZones(prev => prev.map(z => {
        if (z.id === myZone.id) {
          const updatedFree = Math.min(z.total_slots, Math.max(0, z.free_slots + offlineQueue));
          return { ...z, free_slots: updatedFree };
        }
        return z;
      }));
      setOfflineQueue(0);
      setSyncLoading(false);
      onNotify('¡Sincronización completada! Cupos actualizados en la base de datos municipal.');
    }, 1500);
  };

  const handleSlotChange = (modifier: number) => {
    if (syncLoading) return;

    if (!isOnline) {
      const projectedValue = myZone.free_slots + offlineQueue + modifier;
      if (projectedValue < 0 || projectedValue > myZone.total_slots) {
        onNotify('Sincronizador: Error de Límites. Cuadra llena u ocupación irreal.');
        return;
      }
      setOfflineQueue(prev => prev + modifier);
      setErrorToast(`Operación en bandeja de salida local. Se sincronizará al recuperar red.`);
      setTimeout(() => setErrorToast(null), 4000);
      return;
    }

    setSyncLoading(true);
    setErrorToast(null);

    // Simulated network latency on public cellular networks
    setTimeout(() => {
      if (myZone.free_slots + modifier < 0) {
        setErrorToast('Error: No hay espacios teóricos para ocupar más.');
        setSyncLoading(false);
        setTimeout(() => setErrorToast(null), 3000);
        return;
      }
      if (myZone.free_slots + modifier > myZone.total_slots) {
        setErrorToast('Error: Límite excedido. Estás liberando de más.');
        setSyncLoading(false);
        setTimeout(() => setErrorToast(null), 3050);
        return;
      }

      setStreetZones(prev => prev.map(z => {
        if (z.id === myZone.id) {
          return { ...z, free_slots: z.free_slots + modifier };
        }
        return z;
      }));

      setSyncLoading(false);
      onNotify(`Arancel Urbano Actualizado: ${myZone.street_name} al ${myZone.block_number} (${modifier > 0 ? 'Libre' : 'Ocupado'})`);
    }, 600);
  };

  return (
    <div className="glass rounded-3xl overflow-hidden shadow-2xl flex flex-col h-full lg:min-h-[720px] border-2 border-slate-700/60 bg-slate-950 flex-1" id="naranjita-app-simulation-container">
      
      {/* Top Warning Parking Header Frame */}
      <div className="bg-slate-900 border-b-4 border-slate-800 px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="caution-stripes w-12 h-6 rounded border border-slate-800"></div>
          <div>
            <h3 className="font-display font-black text-slate-100 flex items-center gap-2 text-base uppercase tracking-wider">
              <span className="text-amber-400">🚨 APP VALIDADOR STREET</span> 
              <span className="text-xs text-slate-400 font-mono tracking-normal bg-slate-950 px-2 py-1 rounded">Cooperativa</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">Dispositivo Portátil de Control de Calle</p>
          </div>
        </div>

        {/* Offline Mode Switcher Widget */}
        <button
          onClick={() => setIsOnline(prev => !prev)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
            isOnline 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
          }`}
          title="Alternar modo de conexión simular cortes de 4G"
        >
          {isOnline ? (
            <>
              <Wifi className="w-3.5 h-3.5 animate-pulse" />
              <span>Celular Inteligente 4G</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span>Modo Sin Señal / Offline</span>
            </>
          )}
        </button>
      </div>

      <div className="flex-1 flex flex-col p-4 overflow-y-auto" style={{ maxHeight: '640px' }}>
        
        {/* Guard Operator Info Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center border-2 border-slate-950 shadow-inner">
              <HardHat className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <p className="text-[10px] text-amber-500 font-mono uppercase tracking-wider font-bold">Naranjita Municipal Registrado</p>
              <h4 className="font-bold text-slate-100 text-sm leading-tight">{myZone.assigned_naranjita_name}</h4>
              <p className="text-xs text-slate-400">Celular ID: #NARA-CBA-{myZone.assigned_naranjita_id.toUpperCase()}</p>
            </div>
          </div>
          <span className="bg-slate-950 border border-slate-850 px-2 py-1 rounded text-[10px] font-mono text-cyan-400">Región Centro II</span>
        </div>

        {/* Street Zone Stats Overview */}
        <div className="bg-[#0f1422] border border-indigo-900/30 rounded-2xl p-4 mb-4">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            Mi Cuadra Concesionada Activa
          </h4>
          
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-mono">Nombre de Calle</span>
              <span className="text-sm font-bold text-slate-200">{myZone.street_name} al {myZone.block_number}</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-mono">Cupo Máximo Legal</span>
              <span className="text-sm font-bold text-slate-200 font-mono">{myZone.total_slots} Autos</span>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 block">Lugares Libres Reportados:</span>
              <div className="space-x-2 mt-1">
                <span className="text-2xl font-black text-amber-400 font-mono">
                  {myZone.free_slots + offlineQueue}
                </span>
                <span className="text-xs text-slate-400 font-mono">de {myZone.total_slots}</span>
              </div>
            </div>

            {/* Offline sync warnings if any pending */}
            {offlineQueue !== 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-2 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="text-[10px] text-amber-400 leading-tight">
                  <span className="font-bold underline block">Acciones en cola</span>
                  {offlineQueue > 0 ? `+${offlineQueue}` : offlineQueue} pendientes
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BIG TACTICAL CONTROLLER BUTTONS FOR STREET PARKERS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide mb-3">CONSOLA AUXILIAR DE ACCIÓN DIRECTA</h4>
          <p className="text-xs text-slate-400 mb-4 leading-normal">
            Presioná los botones para liberar o registrar la ocupación de un cajón de estacionamiento cuando un conductor se retire o ingrese en la cuadra:
          </p>

          <div className="grid grid-cols-2 gap-4">
            
            {/* OCCUPY SPOT ACTION (Decrease available counters) */}
            <button
              onClick={() => handleSlotChange(-1)}
              disabled={syncLoading || (myZone.free_slots + offlineQueue <= 0)}
              className="bg-rose-500 hover:bg-rose-400 disabled:bg-slate-800 disabled:text-slate-600 disabled:border-slate-800 text-slate-950 py-4 px-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition active:scale-95 border-b-4 border-rose-700 font-black relative overflow-hidden"
              style={{ contentVisibility: 'auto' }}
            >
              <Minus className="w-6 h-6 text-slate-950 shrink-0" />
              <span className="text-xs uppercase tracking-wider block">OCUPAR CAJÓN</span>
              <span className="text-[9px] font-mono font-normal tracking-wide block">(-1 Espacio Libre)</span>
            </button>

            {/* RELEASE SPOT ACTION (Increase available counters) */}
            <button
              onClick={() => handleSlotChange(1)}
              disabled={syncLoading || (myZone.free_slots + offlineQueue >= myZone.total_slots)}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 disabled:border-slate-800 text-slate-950 py-4 px-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition active:scale-95 border-b-4 border-emerald-700 font-black relative overflow-hidden"
              style={{ contentVisibility: 'auto' }}
            >
              <Plus className="w-6 h-6 text-slate-950 shrink-0" />
              <span className="text-xs uppercase tracking-wider block">LIBERAR CAJÓN</span>
              <span className="text-[9px] font-mono font-normal tracking-wide block">(+1 Espacio Libre)</span>
            </button>

          </div>

          {errorToast && (
            <div className="bg-rose-950/40 border border-rose-800/60 p-2.5 rounded-xl text-xs text-rose-300 mt-3 text-center">
              ⚠ {errorToast}
            </div>
          )}

          {syncLoading && (
            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-amber-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Actualizando cupos en Servidor Municipal de Córdoba...</span>
            </div>
          )}
        </div>

        {/* GUIDELINE SECTION FOR STREET USERS */}
        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl mt-4 text-left">
          <h5 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            Integridad de datos y Latencia de Red
          </h5>
          <p className="text-[11px] text-slate-400 leading-normal">
            En Córdoba, las conexiones celulares en vía pública sufren degradación de cobertura. Cuando apagas el interruptor Wifi arriba para "Modo Sin Señal", los cupos modificados por Don Carlos se almacenarán instantáneamente en la base de datos de SQLite del teléfono. Tan pronto reactives el interruptor, el dispositivo sincronizará automáticamente el lote de datos a Supabase mediante bloqueos transaccionales PG, resguardando la consistencia frente a la overbooking del mapa del Conductor.
          </p>
        </div>

      </div>

    </div>
  );
}
