import React, { useState } from 'react';
import { 
  Building2, DollarSign, Layers, Users, Star, 
  Settings, Save, RefreshCw, StarHalf, ShieldAlert, TrendingUp
} from 'lucide-react';
import { PrivateParking } from '../types';

interface GarageAppProps {
  parkings: PrivateParking[];
  setParkings: React.Dispatch<React.SetStateAction<PrivateParking[]>>;
  onNotify: (message: string) => void;
}

export default function GarageApp({
  parkings,
  setParkings,
  onNotify,
}: GarageAppProps) {
  // Select which Private Garage is logged into the local system administration
  const [selectedGarageId, setSelectedGarageId] = useState<string>('priv-001');
  const activeGarage = parkings.find(p => p.id === selectedGarageId) || parkings[0];

  // Forms states
  const [hourlyRateInput, setHourlyRateInput] = useState<string>(activeGarage.hourly_rate.toString());
  const [monthlyRateInput, setMonthlyRateInput] = useState<string>((activeGarage.monthly_rate || 42000).toString());
  const [floor1Spots, setFloor1Spots] = useState<number>(activeGarage.floor_slots[0] || 0);
  const [floor2Spots, setFloor2Spots] = useState<number>(activeGarage.floor_slots[1] || 0);
  const [floor3Spots, setFloor3Spots] = useState<number>(activeGarage.floor_slots[2] || 0);

  const [savingSettings, setSavingSettings] = useState(false);

  // Switch form parameters when active garage selection changes
  const handleGarageChange = (id: string) => {
    setSelectedGarageId(id);
    const target = parkings.find(p => p.id === id);
    if (target) {
      setHourlyRateInput(target.hourly_rate.toString());
      setMonthlyRateInput((target.monthly_rate || 40000).toString());
      setFloor1Spots(target.floor_slots[0] || 0);
      setFloor2Spots(target.floor_slots[1] || 0);
      setFloor3Spots(target.floor_slots[2] || 0);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);

    const hrRate = parseInt(hourlyRateInput);
    const mRate = parseInt(monthlyRateInput);

    if (isNaN(hrRate) || hrRate <= 0) {
      onNotify('Error: La tarifa por hora debe ser un número entero válido mayor a cero.');
      setSavingSettings(false);
      return;
    }

    setTimeout(() => {
      // Apply upgrades across state
      setParkings(prev => prev.map(p => {
        if (p.id === activeGarage.id) {
          const freshFloors = [floor1Spots, floor2Spots, floor3Spots];
          const freshFreeSlots = floor1Spots + floor2Spots + floor3Spots;
          // Calculate total slots based on ratio
          return {
            ...p,
            hourly_rate: hrRate,
            monthly_rate: p.monthly_rate_available ? mRate : undefined,
            floor_slots: freshFloors,
            free_slots: freshFreeSlots,
            total_slots: Math.max(p.total_slots, freshFreeSlots + 10)
          };
        }
        return p;
      }));

      setSavingSettings(false);
      onNotify(`¡Configuración de Playa unificada! Tarifas y cupos aplicados para ${activeGarage.name}.`);
    }, 1000);
  };

  // Mock revenue calculations
  const totalOccupied = activeGarage.total_slots - activeGarage.free_slots;
  const projectionHourlyRevenue = totalOccupied * activeGarage.hourly_rate;

  return (
    <div className="glass rounded-3xl overflow-hidden shadow-2xl flex flex-col h-full lg:min-h-[720px] border-2 border-slate-700/60 bg-slate-950 flex-1" id="garage-app-simulation-container">
      
      {/* Top Warning Parking Header Frame */}
      <div className="bg-slate-900 border-b-4 border-amber-500 px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="caution-stripes w-12 h-6 rounded border border-slate-800"></div>
          <div>
            <h3 className="font-display font-black text-slate-100 flex items-center gap-2 text-base uppercase tracking-wider">
              <span className="text-amber-400">🏢 PORTAL PROPIETARIOS</span> 
              <span className="text-xs text-slate-400 font-mono tracking-normal bg-slate-950 px-2 py-1 rounded">Playas Córdoba</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-mono font-bold">Administrador del Sistema de Gestión de Cocheras Civiles</p>
          </div>
        </div>

        {/* Dropdown to select different garages for system emulation */}
        <div className="flex items-center gap-2">
          <label htmlFor="playa-selector-admin" className="text-slate-400 text-xs font-mono font-bold">Playa:</label>
          <select
            id="playa-selector-admin"
            className="bg-slate-950 text-slate-200 border border-slate-800 text-xs rounded-xl px-2.5 py-1.5 focus:border-amber-500 max-w-[190px]"
            value={selectedGarageId}
            onChange={(e) => handleGarageChange(e.target.value)}
          >
            {parkings.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-4 overflow-y-auto" style={{ maxHeight: '640px' }}>
        
        {/* Banner with general metrics and compatibility logo */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4">
          <div className="flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center">
            <div>
              <span className="text-[9px] bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-bold px-2.5 py-1 rounded-full uppercase">SISTEMAS CIVILES INTEGRADOS S.A.</span>
              <h4 className="font-bold text-slate-100 text-sm mt-1">{activeGarage.name}</h4>
              <p className="text-xs text-slate-400 font-mono mt-0.5">ID Fiscal: MP-CBA-{activeGarage.id.toUpperCase()}-X</p>
            </div>
            
            {/* Average score */}
            <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-center">
              <div className="flex items-center gap-1.5 text-amber-400 justify-center">
                <Star className="w-4 h-4 fill-amber-400" />
                <span className="text-sm font-bold font-mono">{activeGarage.rating}</span>
              </div>
              <span className="text-[9px] text-slate-500 block uppercase font-mono">{activeGarage.rating_count} Opiniones</span>
            </div>
          </div>
        </div>

        {/* REVENUE PREDICTION & LIVE CAPACITY GRID */}
        <div className="bg-[#0b101c] border border-blue-950 p-4 rounded-2xl mb-4">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            Ingresos Estimados por Ocupación Actual
          </h4>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <span className="text-[9px] text-slate-500 block uppercase font-mono">Autos Activos</span>
              <span className="text-lg font-black text-slate-100 font-mono">
                {activeGarage.total_slots - activeGarage.free_slots}
              </span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <span className="text-[9px] text-slate-500 block uppercase font-mono">Lugares Disponibles</span>
              <span className="text-lg font-black text-amber-500 font-mono">
                {activeGarage.free_slots}
              </span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <span className="text-[9px] text-slate-500 block uppercase font-mono">Recaudación Proyectada</span>
              <span className="text-lg font-black text-emerald-400 font-mono">
                ${projectionHourlyRevenue}/h
              </span>
            </div>
          </div>
        </div>

        {/* CONFIGURATION FORM */}
        <form onSubmit={handleSaveSettings} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col gap-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-amber-400" />
              Editar Parámetros y Valores Operacionales
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Rates fields */}
            <div>
              <label htmlFor="hourly-rate-input-admin" className="text-xs text-slate-400 font-bold block mb-1">Costo Fracción Hora (ARS):</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">$</span>
                <input
                  id="hourly-rate-input-admin"
                  type="number"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-100 font-mono"
                  value={hourlyRateInput}
                  onChange={(e) => setHourlyRateInput(e.target.value)}
                />
              </div>
            </div>

            {activeGarage.monthly_rate_available && (
              <div>
                <label className="text-xs text-slate-400 font-bold block mb-1">Abono Mensual (ARS):</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">$</span>
                  <input
                    type="number"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2 py-2 text-xs text-slate-100 font-mono"
                    value={monthlyRateInput}
                    onChange={(e) => setMonthlyRateInput(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Floor Capacity inputs representing system compat */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
            <p className="text-xs font-bold text-slate-300 mb-2.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              Cupos Libres por Piso (Sincronización de Barrera):
            </p>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="floor1-spots-input" className="text-[10px] text-slate-500 block mb-1">Piso 1 Libres:</label>
                <input
                  id="floor1-spots-input"
                  type="number"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1 px-2.5 text-xs text-center text-slate-100"
                  value={floor1Spots}
                  onChange={(e) => setFloor1Spots(Math.max(0, parseInt(e.target.value) || 0))}
                />
              </div>
              <div>
                <label htmlFor="floor2-spots-input" className="text-[10px] text-slate-500 block mb-1">Piso 2 Libres:</label>
                <input
                  id="floor2-spots-input"
                  type="number"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1 px-2.5 text-xs text-center text-slate-100"
                  value={floor2Spots}
                  onChange={(e) => setFloor2Spots(Math.max(0, parseInt(e.target.value) || 0))}
                />
              </div>
              <div>
                <label htmlFor="floor3-spots-input" className="text-[10px] text-slate-500 block mb-1">Piso 3 Libres:</label>
                <input
                  id="floor3-spots-input"
                  type="number"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1 px-2.5 text-xs text-center text-slate-100"
                  value={floor3Spots}
                  onChange={(e) => setFloor3Spots(Math.max(0, parseInt(e.target.value) || 0))}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <p className="text-[10px] text-slate-500 max-w-[280px]">Estas modificaciones impactarán instantáneamente en tiempo real en los mapas de la App de Conductores ubicados en el sector.</p>
            <button
              type="submit"
              disabled={savingSettings}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              {savingSettings ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Aplicar Cambios Playa</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* FEED DETAILS SUMMARY */}
        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl mt-4 text-left">
          <h5 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            Compatibilidad con Sistemas de Entrada Legacy (API Barrera)
          </h5>
          <p className="text-[11px] text-slate-400 leading-normal">
            Este panel simula la automatización del software de barrera municipal de Córdoba. Al ingresar una patente o tarjeta RFID en la garita real, la API emite una respuesta transaccional actualizando los valores cargados en este panel de control. Los conductores de CórdobaPark visualizarán en menos de 100ms las capacidades por piso reducidas, optimizando sensiblemente las vueltas improductivas buscando plaza libre.
          </p>
        </div>

      </div>

    </div>
  );
}
