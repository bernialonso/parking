import React, { useState } from 'react';
import { 
  Database, HardHat, Navigation, Heart, Shield, RefreshCw, 
  MapPin, CheckCircle2, Waves, Zap, Coins, Sparkles, BookOpen, Layers, Eye
} from 'lucide-react';

import { MOCK_USERS, INITIAL_PRIVATE_PARKINGS, INITIAL_STREET_ZONES } from './data/mockData';
import { PrivateParking, StreetParkingZone, User } from './types';

// Importing custom redesigned components
import SqlViewer from './components/SqlViewer';
import DriverApp from './components/DriverApp';
import NaranjitaApp from './components/NaranjitaApp';
import GarageApp from './components/GarageApp';
import ReportsApp from './components/ReportsApp';

export default function App() {
  // Shared States (Realtime Synchronizer Simulation)
  const [parkings, setParkings] = useState<PrivateParking[]>(INITIAL_PRIVATE_PARKINGS);
  const [streetZones, setStreetZones] = useState<StreetParkingZone[]>(INITIAL_STREET_ZONES);
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0]);

  // Tab state for the RIGHT Panel side simulators representing independent apps
  const [activeRightApp, setActiveRightApp] = useState<'naranjita' | 'garage' | 'reports'>('naranjita');

  // System Notifications Log representing real-time telemetry / PG logs
  const [notifications, setNotifications] = useState<Array<{ id: string; time: string; text: string }>>([
    { id: '1', time: '19:01', text: 'Canal de tiempo real de Supabase inicializado correctamente.' },
    { id: '2', time: '19:01', text: 'Mapa de Córdoba centrado en Nueva Córdoba y el microcentro.' }
  ]);

  const addNotification = (text: string) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    setNotifications(prev => [
      { id: Date.now().toString(), time: timeStr, text },
      ...prev.slice(0, 5) // Keep last 6 logs
    ]);
  };

  // Reset states
  const handleReset = () => {
    setParkings(INITIAL_PRIVATE_PARKINGS);
    setStreetZones(INITIAL_STREET_ZONES);
    setCurrentUser(MOCK_USERS[0]);
    addNotification('Valores del sistema reseteados a las configuraciones de origen.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased selection:bg-amber-500/30 selection:text-amber-200" id="main-app-container">
      
      {/* Top Professional Header with Stripe Accent */}
      <div className="caution-stripes h-2 w-full"></div>
      
      <header className="bg-slate-900 border-b border-amber-500/20 py-4 px-6 shadow-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo & Sub-header */}
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 p-2 rounded-2xl border border-amber-500/30 shadow-inner flex items-center justify-center">
              <Navigation className="w-6 h-6 text-amber-400 rotate-45 transform fill-amber-500/10 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-black text-slate-100 tracking-tight text-xl uppercase">CórdobaPark Hub</h1>
                <span className="bg-amber-400/20 border border-amber-400/30 text-amber-300 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                  SISTEMA MULTIAPP CORDOBÉS
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Plataforma de Optimización Urbana • Integración de Playas Privadas, Naranjitas Registrados y Billetera Digital
              </p>
            </div>
          </div>

          {/* User Profile Overview & Global Utilities */}
          <div className="flex items-center gap-3 self-end md:self-auto">
            {/* User points overview */}
            <div className="bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2.5">
              <div className="bg-amber-500/10 p-1 rounded-lg border border-amber-500/20">
                <Coins className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-left leading-none">
                <span className="text-[9px] text-slate-500 block uppercase font-mono font-bold">Billetera Virtual</span>
                <span className="text-amber-400 text-xs font-bold font-mono">ARS ${currentUser.wallet_balance}</span>
              </div>
            </div>

            {/* Quick Sync Reset Button */}
            <button
              onClick={handleReset}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition active:scale-95 border border-slate-700/50 cursor-pointer"
              title="Resetear estados a valores mock originales"
              id="global-reset-btn"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Cargar Datos Default</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Platform Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 flex flex-col gap-6">

        {/* Informative Architectural Hero Section */}
        <div className="glass rounded-3xl p-5 md:p-6 shadow-inner relative overflow-hidden border border-amber-500/25">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full filter blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-10 w-60 h-60 bg-blue-500/5 rounded-full filter blur-3xl pointer-events-none"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
            <div className="max-w-2xl text-left">
              <span className="text-[10px] font-mono font-bold tracking-wider text-amber-400 uppercase bg-amber-950/40 border border-amber-500/15 px-2.5 py-1 rounded-full">
                DISEÑO INDUSTRIAL • AMARILLO Y NEGRO CAUTION INTERACTIVE
              </span>
              <h2 className="font-display font-black text-slate-100 text-xl md:text-2xl mt-3 leading-tight tracking-tight">
                MÓDULOS DE ESTACIONAMIENTO DISOCIADOS Y COMPATIBLES
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed font-sans mt-2">
                Hemos rediseñado la interfaz para poner el <strong>MAPA en primer plano</strong> en la App del Conductor (Izquierda). Adicionalmente, separamos las aplicaciones en plataformas individuales (Derecha) para que puedas auditar el comportamiento del <strong>Naranjita en calle</strong>, el <strong>Controlador de Playas por Piso</strong>, y las métricas en el **Panel de Reportes**.
              </p>
            </div>
            
            {/* Tech Badge Deck */}
            <div className="flex flex-wrap gap-2 md:max-w-[320px] justify-start md:justify-end">
              <span className="bg-slate-900 border border-slate-800 text-slate-200 text-[10px] font-mono px-2.5 py-1 rounded-lg">CBA Sistemas de Cocheras</span>
              <span className="bg-slate-900 border border-slate-800 text-slate-200 text-[10px] font-mono px-2.5 py-1 rounded-lg">Wallet Digital CBA</span>
              <span className="bg-slate-900 border border-slate-800 text-slate-200 text-[10px] font-mono px-2.5 py-1 rounded-lg">Fidelidad Doblada</span>
              <span className="bg-slate-900 border border-slate-800 text-slate-200 text-[10px] font-mono px-2.5 py-1 rounded-lg">Google Maps Real</span>
            </div>
          </div>
        </div>

        {/* Master Simulator Layout Row (Interactive connected screen blocks) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          
          {/* LEFT COLUMN: PRIMARY APP (Driver App with map *first*) */}
          <div className="flex flex-col">
            <DriverApp 
              parkings={parkings}
              setParkings={setParkings}
              streetZones={streetZones}
              setStreetZones={setStreetZones}
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
              onNotify={addNotification}
            />
          </div>

          {/* RIGHT COLUMN: DISOCIATED COMPANION APPS WITH SELECTOR TABS */}
          <div className="flex flex-col gap-4">
            
            {/* Companion App Selector Switcher Panel */}
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex items-center justify-between gap-3">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest pl-1">Sistemas Conectados:</span>
              
              <div className="flex gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-850">
                <button
                  type="button"
                  onClick={() => setActiveRightApp('naranjita')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                    activeRightApp === 'naranjita' 
                      ? 'bg-amber-500 text-slate-950 shadow-md font-bold' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🚧 App Naranjita
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRightApp('garage')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                    activeRightApp === 'garage' 
                      ? 'bg-amber-500 text-slate-950 shadow-md font-bold' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🏢 Playas Admin
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRightApp('reports')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                    activeRightApp === 'reports' 
                      ? 'bg-amber-500 text-slate-950 shadow-md font-bold' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  📊 Reportes Municipio
                </button>
              </div>
            </div>

            {/* Companion App Render space */}
            <div className="flex-1 flex flex-col">
              {activeRightApp === 'naranjita' && (
                <NaranjitaApp
                  streetZones={streetZones}
                  setStreetZones={setStreetZones}
                  onNotify={addNotification}
                />
              )}

              {activeRightApp === 'garage' && (
                <GarageApp
                  parkings={parkings}
                  setParkings={setParkings}
                  onNotify={addNotification}
                />
              )}

              {activeRightApp === 'reports' && (
                <ReportsApp
                  parkings={parkings}
                  streetZones={streetZones}
                  currentUser={currentUser}
                />
              )}
            </div>

          </div>

        </div>

        {/* Bottom Panel: PostgreSQL Schema Viewer & System Event Logs */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
          
          {/* Left 2 cols: Database Code and RLS rules */}
          <div className="xl:col-span-2 h-full min-h-[460px] flex flex-col">
            <SqlViewer onNotifyCopy={addNotification} />
          </div>

          {/* Right 1 col: Live Event Logs / WebSocket Simulation */}
          <div className="glass rounded-3xl flex flex-col p-5 shadow-2xl justify-between h-full min-h-[460px] border border-amber-500/20">
            <div className="flex-1 flex flex-col justify-between">
              
              {/* Header */}
              <div className="border-b border-slate-800 pb-4 mb-4 select-none">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></div>
                  <h3 className="font-display font-black text-slate-100 text-xs sm:text-sm uppercase tracking-wider">Flujo de Eventos Compartidos</h3>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Monitoreo de señales TCP y webhooks transaccionales en tiempo real</p>
              </div>

              {/* Event Stream */}
              <div className="flex-1 overflow-y-auto space-y-3 font-mono text-[11px] pr-1 select-all h-[240px]">
                {notifications.map(n => (
                  <div key={n.id} className="bg-slate-950/80 hover:bg-slate-950 border border-slate-800/60 hover:border-slate-800 p-2.5 rounded-xl transition flex items-start gap-2.5 leading-relaxed">
                    <span className="text-amber-400 font-black shrink-0">[{n.time}]</span>
                    <span className="text-slate-300 font-sans text-xs">{n.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Simulated Live Analytics Overview */}
            <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-500">
              <div className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span>Base Conectada:</span>
                <strong className="text-emerald-400 font-bold uppercase font-mono">SUPABASE OK</strong>
              </div>
              <div className="flex items-center gap-1">
                <span>Playas: {parkings.length} • Cuadras Calle: {streetZones.length}</span>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Minimal Craft Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2 mt-auto">
        <span>Córdoba Parking Optimizer MVP</span>
        <span>•</span>
        <span className="flex items-center gap-1 font-mono">
          Desarrollado para la Municipalidad de Córdoba <Shield className="w-3.5 h-3.5 inline text-amber-500" />
        </span>
      </footer>
    </div>
  );
}
