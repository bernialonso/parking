import React from 'react';
import { 
  BarChart4, Coins, TrendingUp, Compass, 
  Layers, Map, Landmark, Wallet, Award, ArrowUpRight
} from 'lucide-react';
import { PrivateParking, StreetParkingZone, User } from '../types';

interface ReportsAppProps {
  parkings: PrivateParking[];
  streetZones: StreetParkingZone[];
  currentUser: User;
}

export default function ReportsApp({
  parkings,
  streetZones,
  currentUser,
}: ReportsAppProps) {
  // Aggregate calculations
  const totalPlayasFree = parkings.reduce((acc, curr) => acc + curr.free_slots, 0);
  const totalPlayasCapacity = parkings.reduce((acc, curr) => acc + curr.total_slots, 0);
  const totalStreetFree = streetZones.reduce((acc, curr) => acc + curr.free_slots, 0);
  const totalStreetCapacity = streetZones.reduce((acc, curr) => acc + curr.total_slots, 0);

  const walletDepositsTotal = currentUser.wallet_transactions
    .filter(tx => tx.type === 'deposit')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const walletExpensesTotal = currentUser.wallet_transactions
    .filter(tx => tx.type === 'payment')
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="glass rounded-3xl overflow-hidden shadow-2xl flex flex-col h-full lg:min-h-[720px] border border-slate-800 bg-slate-950 flex-1" id="reports-analytics-panel-container">
      
      {/* Top Warning Parking Header Frame */}
      <div className="bg-slate-900 border-b px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-slate-800">
        <div className="flex items-center gap-3">
          <div className="caution-stripes w-12 h-6 rounded border border-slate-800"></div>
          <div>
            <h3 className="font-display font-black text-slate-100 flex items-center gap-2 text-base uppercase tracking-wider">
              <span className="text-amber-400">📊 PANEL DE REPORTES</span> 
              <span className="text-xs text-slate-400 font-mono tracking-normal bg-slate-950 px-2 py-1 rounded">Córdoba Gobierno</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">Consola Central de Auditoría de Movilidad y Estadísticas</p>
          </div>
        </div>
        <span className="bg-slate-950/80 border border-slate-800 text-slate-400 text-[10px] font-mono px-3 py-1 rounded-xl">Actualizado hace instantes</span>
      </div>

      <div className="flex-1 flex flex-col p-5 overflow-y-auto" style={{ maxHeight: '640px' }}>
        
        {/* TOP GLOWING BENTO ROW GRID CARD */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          
          {/* Card 1: Vía pública vs Playas */}
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
            <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-wider block">Ocupación Urbana</span>
            <h4 className="text-sm font-black text-slate-300 mt-1 mb-3">Estacionamiento Medido de Córdoba</h4>
            
            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400 font-mono">Vía Pública (Calles):</span>
                  <span className="font-bold text-amber-500 font-mono">{totalStreetFree} libres / {totalStreetCapacity} slots</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${(totalStreetFree / (totalStreetCapacity || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400 font-mono">Playas Privadas Registradas:</span>
                  <span className="font-bold text-cyan-400 font-mono">{totalPlayasFree} libres / {totalPlayasCapacity} slots</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="bg-cyan-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${(totalPlayasFree / (totalPlayasCapacity || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Virtual wallet transactions summary (user audit) */}
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
            <div>
              <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-wider block">Billetera Global</span>
              <h4 className="text-sm font-black text-slate-300 mt-1 mb-2">Resumen de Flujo de Fondos (ARS)</h4>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                <span className="text-[9px] text-slate-500 font-mono block">Cargado via CBU</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">+${walletDepositsTotal}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                <span className="text-[9px] text-slate-500 font-mono block">Abonado en Playas</span>
                <span className="text-xs font-bold text-amber-500 font-mono">-${walletExpensesTotal}</span>
              </div>
            </div>

            <div className="mt-3 text-[10px] text-slate-500 pointer-events-none">
              *Los fondos son emitidos a través de la Red Link municipal con acreditación inmediata.
            </div>
          </div>

        </div>

        {/* REVENUE MODEL & POINTS AUDIT BAR */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl mb-4">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-500" />
            Auditoría de Puntos de Fidelidad (Separación Calle vs Playa)
          </h4>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Para proteger a las cooperativas de vía pública contra la especulación, existe una división estricta en el sistema de puntos:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Box 1: Puntos de calle */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-200">Puntos de Vía Pública (Calle)</span>
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] px-2 py-0.5 rounded-full font-mono uppercase font-bold">Oficial</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">Para canjear horas gratis únicamente en cuadras de Cooperativas Naranjitas aprobadas.</p>
              <div className="flex justify-between items-center border-t border-slate-850 pt-2 text-xs">
                <span className="text-slate-500">Posee tu usuario:</span>
                <span className="font-bold text-amber-500 font-mono">{currentUser.points_street} pts</span>
              </div>
            </div>

            {/* Box 2: Puntos de playas especificas */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-200">Puntos de Playas Privadas</span>
                <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[9px] px-2 py-0.5 rounded-full font-mono uppercase font-bold">Establecimiento</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">Comercio cerrado. Cada cochera tiene su score propio no transferible por motivos de IVA y Rentas.</p>
              
              <div className="border-t border-slate-850 pt-2 flex flex-col gap-1 text-xs">
                {Object.keys(currentUser.points_playas).length > 0 ? (
                  Object.entries(currentUser.points_playas).map(([id, pt]) => {
                    const plName = parkings.find(p => p.id === id)?.name || id;
                    return (
                      <div key={id} className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500 truncate max-w-[120px]">{plName}:</span>
                        <span className="font-bold text-cyan-400 font-mono">{pt} pts</span>
                      </div>
                    );
                  })
                ) : (
                  <span className="text-slate-600">No hay interacciones de playas registradas.</span>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* DEMOGRAPHIC MAP INSIGHTS */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide mb-2 flex items-center gap-1">
            <Compass className="w-4 h-4 text-cyan-400" />
            Flujo Operativo de Vehículos en Córdoba Capital (Simulación)
          </h4>
          <p className="text-xs text-slate-400 leading-normal mb-3">
            Las estadísticas muestran que el 45% de los atascos de tránsito en Nueva Córdoba se producen por conductores circulando en busca de estacionamiento. Gracias a CórdobaPark, la congestión promedio disminuye un 18%.
          </p>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex items-center justify-between">
            <div className="text-xs">
              <p className="text-slate-450 font-bold">Tiempo promedio ahorrado por conductor:</p>
              <p className="text-slate-400 mt-1">Con CórdobaPark app: <strong>4.2 minutos</strong> (frente a 18.5 minutos manuales).</p>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-amber-500 border-r-transparent animate-spin shrink-0"></div>
          </div>
        </div>

      </div>

    </div>
  );
}
