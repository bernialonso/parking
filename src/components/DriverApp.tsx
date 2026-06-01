import React, { useState } from 'react';
import { 
  MapPin, Search, Star, MessageSquare, Compass, 
  Map, DollarSign, Award, Ticket, Wallet, Download, RefreshCw, 
  Save, Eye, LogIn, ChevronRight, CheckCircle2, AlertTriangle, Layers
} from 'lucide-react';
import { PrivateParking, StreetParkingZone, User, BenefitPartner, CarSavedLocation } from '../types';
import { BENEFIT_PARTNERS } from '../data/mockData';

interface DriverAppProps {
  parkings: PrivateParking[];
  setParkings: React.Dispatch<React.SetStateAction<PrivateParking[]>>;
  streetZones: StreetParkingZone[];
  setStreetZones: React.Dispatch<React.SetStateAction<StreetParkingZone[]>>;
  currentUser: User;
  setCurrentUser: React.Dispatch<React.SetStateAction<User>>;
  onNotify: (message: string) => void;
}

export default function DriverApp({
  parkings,
  setParkings,
  streetZones,
  setStreetZones,
  currentUser,
  setCurrentUser,
  onNotify,
}: DriverAppProps) {
  // Navigation tabs within Driver App
  const [driverTab, setDriverTab] = useState<'mapa' | 'billetera' | 'beneficios' | 'perfil'>('mapa');
  
  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpot, setSelectedSpot] = useState<{ type: 'playa' | 'calle'; id: string } | null>(null);
  
  // Custom auth demo
  const [userEmail, setUserEmail] = useState(currentUser.email);
  const [userName, setUserName] = useState(currentUser.full_name);
  const [isLogged, setIsLogged] = useState(true);

  // Car Location Registry
  const [carNote, setCarNote] = useState('');
  const [carFloor, setCarFloor] = useState('Piso 1');
  const [savingLocation, setSavingLocation] = useState(false);

  // Review Submissions
  const [reviewComment, setReviewComment] = useState('');
  const [reviewRating, setReviewRating] = useState(5);

  // Booking states
  const [selectedFloor, setSelectedFloor] = useState<number>(0); // 0: Piso 1, 1: Piso 2, 2: Piso 3
  const [bookingLoading, setBookingLoading] = useState(false);
  
  // Wallet states
  const [transferAmountInput, setTransferAmountInput] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);

  // Filter spots on map based on search query
  const filteredParkings = parkings.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    searchQuery === '' ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStreetZones = streetZones.filter(z => 
    z.street_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    searchQuery === ''
  );

  // Selected object references
  const activePlaya = selectedSpot?.type === 'playa' 
    ? parkings.find(p => p.id === selectedSpot.id) 
    : null;
    
  const activeCalle = selectedSpot?.type === 'calle' 
    ? streetZones.find(s => s.id === selectedSpot.id) 
    : null;

  // Actions
  const handleLoginToggle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail || !userName) {
      onNotify('Por favor complete el email y nombre.');
      return;
    }
    
    setCurrentUser(prev => ({
      ...prev,
      email: userEmail,
      full_name: userName,
    }));
    setIsLogged(true);
    onNotify(`Sesión iniciada correctamente como: ${userName}`);
  };

  const handleRegisterCarLocation = () => {
    setSavingLocation(true);
    setTimeout(() => {
      // Pick dynamic latitude/longitude close to centered area
      const mockLat = activePlaya ? activePlaya.latitude : activeCalle ? activeCalle.coordinates[0].lat : -31.4245;
      const mockLng = activePlaya ? activePlaya.longitude : activeCalle ? activeCalle.coordinates[0].lng : -64.1872;
      
      const newLoc: CarSavedLocation = {
        lat: mockLat,
        lng: mockLng,
        note: carNote || 'Dejado cerca de la esquina principal',
        floor: activePlaya ? `Piso ${selectedFloor + 1}` : undefined,
        saved_at: new Date().toLocaleTimeString(),
      };

      setCurrentUser(prev => ({
        ...prev,
        car_location: newLoc
      }));
      setSavingLocation(false);
      setCarNote('');
      onNotify('¡Ubicación de tu auto guardada con éxito! Te avisaremos a la vuelta.');
    }, 800);
  };

  const handleClearCarLocation = () => {
    setCurrentUser(prev => ({ ...prev, car_location: null }));
    onNotify('Se eliminó el registro de ubicación de tu auto.');
  };

  // Deposit funds via Transferencia
  const handleLoadWallet = () => {
    const amount = parseFloat(transferAmountInput);
    if (isNaN(amount) || amount <= 0) {
      onNotify('Monto de transferencia inválido.');
      return;
    }
    setTransferLoading(true);
    setTimeout(() => {
      setCurrentUser(prev => {
        const updatedBalance = prev.wallet_balance + amount;
        return {
          ...prev,
          wallet_balance: updatedBalance,
          wallet_transactions: [
            {
              id: `tx-${Date.now()}`,
              type: 'deposit',
              amount: amount,
              description: 'Depósito recibido por Transferencia Bancaria',
              date: new Date().toISOString().replace('T', ' ').slice(0, 16)
            },
            ...prev.wallet_transactions
          ]
        };
      });
      setTransferLoading(false);
      setTransferAmountInput('');
      onNotify(`¡Transferencia exitosa! Se acreditaron ARS $${amount} a tu billetera virtual.`);
    }, 1500);
  };

  // Reserve a private garage spot on a specific Floor
  const handleReserveSpot = () => {
    if (!activePlaya) return;
    
    // Cost calculation (can offer discounted price if paying from virtual wallet)
    const cost = activePlaya.hourly_rate;
    const hasEnoughWallet = currentUser.wallet_balance >= cost;
    
    if (activePlaya.floor_slots[selectedFloor] <= 0) {
      onNotify(`No hay lugares libres disponibles en el Piso ${selectedFloor + 1} de este estacionamiento.`);
      return;
    }

    setBookingLoading(true);

    setTimeout(() => {
      // 1. Deduct slot from that specific floor & general availability
      setParkings(prev => prev.map(p => {
        if (p.id === activePlaya.id) {
          const freshFloorSlots = [...p.floor_slots];
          freshFloorSlots[selectedFloor] -= 1;
          return {
            ...p,
            free_slots: Math.max(0, p.free_slots - 1),
            floor_slots: freshFloorSlots
          };
        }
        return p;
      }));

      // 2. Manage points (differentiation between street vs. specific garage points)
      // Accumulates 50 points directly associated with this private playa!
      setCurrentUser(prev => {
        const freshPlayaPoints = { ...prev.points_playas };
        freshPlayaPoints[activePlaya.id] = (freshPlayaPoints[activePlaya.id] || 0) + 50;

        // Optionally pay with Wallet to get a 10% discount
        let freshWalletBalance = prev.wallet_balance;
        const finalCost = hasEnoughWallet ? Math.round(cost * 0.9) : 0;
        let finalTx = prev.wallet_transactions;

        if (hasEnoughWallet) {
          freshWalletBalance -= finalCost;
          finalTx = [
            {
              id: `pay-${Date.now()}`,
              type: 'payment',
              amount: finalCost,
              description: `Reserva Express - ${activePlaya.name} (Piso ${selectedFloor + 1}) con 10% off por usar Wallet`,
              date: new Date().toISOString().replace('T', ' ').slice(0, 16)
            },
            ...prev.wallet_transactions
          ];
        }

        return {
          ...prev,
          wallet_balance: freshWalletBalance,
          wallet_transactions: finalTx,
          points_playas: freshPlayaPoints
        };
      });

      setBookingLoading(false);
      onNotify(`¡Plaza reservada con éxito en ${activePlaya.name} (${selectedFloor === 0 ? 'Piso 1' : selectedFloor === 1 ? 'Piso 2' : 'Piso 3'})! Acumulaste +50 pts de fidelidad en esta playa.`);
    }, 1200);
  };

  // Pay street parking with Virtual Wallet (Don Carlos or municipal)
  const handlePayStreetParking = (zone: StreetParkingZone) => {
    const cost = 500; // Fixed Córdoba hourly street municipal cost
    if (currentUser.wallet_balance < cost) {
      onNotify('Saldo de billetera virtual insuficiente. Cargue saldo primero.');
      return;
    }

    setCurrentUser(prev => ({
      ...prev,
      wallet_balance: prev.wallet_balance - cost,
      points_street: prev.points_street + 30, // Accumulating street points
      wallet_transactions: [
        {
          id: `pay-${Date.now()}`,
          type: 'payment',
          amount: cost,
          description: `Pago estacionamiento en calle urbana (${zone.street_name} al ${zone.block_number})`,
          date: new Date().toISOString().replace('T', ' ').slice(0, 16)
        },
        ...prev.wallet_transactions
      ]
    }));
    onNotify(`¡Pago de estacionamiento en la calle confirmado para ${zone.street_name}! Acumulaste +30 Puntos Urbanos.`);
  };

  // Submit dynamic rating/review
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlaya) return;
    if (!reviewComment.trim()) {
      onNotify('Por favor escribe un comentario.');
      return;
    }

    setParkings(prev => prev.map(p => {
      if (p.id === activePlaya.id) {
        const newReview = {
          id: `rev-${Date.now()}`,
          author: currentUser.full_name,
          rating: reviewRating,
          comment: reviewComment,
          date: 'Hoy'
        };
        const updatedRating = parseFloat(((p.rating * p.rating_count + reviewRating) / (p.rating_count + 1)).toFixed(1));
        return {
          ...p,
          rating: updatedRating,
          rating_count: p.rating_count + 1,
          reviews: [newReview, ...p.reviews]
        };
      }
      return p;
    }));

    setReviewComment('');
    onNotify(`¡Gracias! Añadiste una calificación de ${reviewRating} estrellas para ${activePlaya.name}.`);
  };

  return (
    <div className="glass rounded-3xl overflow-hidden shadow-2xl flex flex-col h-full lg:min-h-[720px] border-2 border-amber-500/30 flex-1 bg-slate-950" id="driver-app-simulation-container">
      
      {/* Top Warning Parking Header Frame */}
      <div className="bg-slate-900 border-b-4 border-amber-500 px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="caution-stripes-sm w-12 h-6 rounded border border-amber-500/40"></div>
          <div>
            <h3 className="font-display font-black text-slate-100 flex items-center gap-2 text-base uppercase tracking-wider">
              <span className="text-amber-400">🚗 CONDUCTOR APP</span> 
              <span className="text-xs text-slate-400 font-mono tracking-normal leading-none bg-slate-950 px-2 py-1 rounded">Córdoba</span>
            </h3>
            <p className="text-[10px] text-amber-500/80 font-mono">Buscador y GPS de Estacionamientos Oficiales</p>
          </div>
        </div>

        {/* Tab switcher Inside app */}
        <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button 
            onClick={() => setDriverTab('mapa')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${driverTab === 'mapa' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-100'}`}
          >
            Mapa Vía
          </button>
          <button 
            onClick={() => setDriverTab('billetera')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${driverTab === 'billetera' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-100'}`}
          >
            Wallet
          </button>
          <button 
            onClick={() => setDriverTab('beneficios')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${driverTab === 'beneficios' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-100'}`}
          >
            Alianzas (Criollos30)
          </button>
          <button 
            onClick={() => setDriverTab('perfil')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${driverTab === 'perfil' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-100'}`}
          >
            Mi Cuenta
          </button>
        </div>
      </div>

      {/* Screen Views Wrapper */}
      <div className="flex-1 flex flex-col p-4 overflow-y-auto" style={{ maxHeight: '640px' }}>
        
        {/* Auth / Profile Bar (Simulates login support requested by user) */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-3.5 mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center font-bold text-amber-400 text-sm">
              {userName.charAt(0)}
            </div>
            <div>
              <p className="text-xs text-slate-500">Sesión en CórdobaPark</p>
              <h4 className="text-sm font-bold text-slate-200">{userName} <span className="text-[10px] text-slate-400 font-mono">({isLogged ? 'Conectado' : 'Simulado'})</span></h4>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-500">Saldo Billetera</span>
            <span className="text-sm font-black text-amber-400 font-mono">ARS ${currentUser.wallet_balance}</span>
          </div>
        </div>

        {/* DRIVER TAB: MAP WITH SEARCH & BOOKINGS */}
        {driverTab === 'mapa' && (
          <div className="flex flex-col gap-4 flex-1">
            
            {/* Search inputs representing user locator flow */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <Search className="w-4 h-4 text-amber-500/80" />
              </span>
              <input
                type="text"
                placeholder="Buscar estacionamiento o calle (ej: Buen Pastor, Rondeau, 27 de Abril)..."
                className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30 text-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-xs transition placeholder:text-slate-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* MAP SECTION - FIRST thing they see */}
            <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-4 relative overflow-hidden min-h-[260px] flex flex-col justify-between">
              
              {/* Background abstract layout mimicking Google Maps of downtown Córdoba */}
              <div className="absolute inset-0 bg-[#0c101a] opacity-95 pointer-events-none">
                {/* Simulated streets lines in grid */}
                <div className="absolute top-[20%] left-0 w-full h-[3px] bg-slate-800/80"></div>
                <div className="absolute top-[50%] left-0 w-full h-[3px] bg-slate-800/80"></div>
                <div className="absolute top-[80%] left-0 w-full h-[2px] bg-indigo-500/20"></div>
                
                <div className="absolute left-[20%] top-0 w-[3px] h-full bg-slate-800/80"></div>
                <div className="absolute left-[50%] top-0 w-[3px] h-full bg-slate-800/80"></div>
                <div className="absolute left-[80%] top-0 w-[2px] h-full bg-amber-500/10"></div>

                {/* Paseo Buen Pastor green patch */}
                <div className="absolute top-[48%] left-[48%] w-16 h-12 bg-emerald-950/20 rounded-xl border border-emerald-500/10 flex items-center justify-center">
                  <span className="text-[7px] text-emerald-500 uppercase font-mono font-bold tracking-tight">Paseo B.P.</span>
                </div>
              </div>

              {/* Map Controls */}
              <div className="relative z-10 flex items-center justify-between mb-2">
                <span className="bg-slate-950/90 border border-amber-500/30 px-2.5 py-1 rounded-lg text-[9px] font-mono text-amber-400 flex items-center gap-1.5 backdrop-blur-md shadow-md">
                  <Compass className="w-3 h-3 animate-spin" />
                  MAPA DE CÓRDOBA CAPITAL (INTERACTIVO)
                </span>
                <span className="text-[8px] text-slate-500 font-mono">Zoom: 15x</span>
              </div>

              {/* Interactive Vector Markers */}
              <div className="relative z-10 grid grid-cols-4 gap-2 my-auto">
                {filteredParkings.map(parking => (
                  <button
                    key={parking.id}
                    onClick={() => setSelectedSpot({ type: 'playa', id: parking.id })}
                    className={`py-2 px-1 rounded-xl border transition-all text-center flex flex-col items-center gap-1 ${
                      selectedSpot?.id === parking.id && selectedSpot?.type === 'playa'
                        ? 'bg-amber-500 border-amber-400 text-slate-950 scale-105 font-bold'
                        : parking.free_slots === 0 
                          ? 'bg-rose-950/40 border-rose-800/60 text-rose-400 hover:bg-rose-950/60'
                          : parking.free_slots < 5
                            ? 'bg-amber-950/40 border-amber-700/60 text-amber-300 hover:bg-amber-950/60'
                            : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400 hover:bg-emerald-950/60'
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                    <span className="text-[8px] block truncate max-w-full font-mono">{parking.name.split(' ')[1] || parking.name}</span>
                    <span className="text-[9px] font-black">{parking.free_slots} Libres</span>
                  </button>
                ))}

                {filteredStreetZones.map(zone => (
                  <button
                    key={zone.id}
                    onClick={() => setSelectedSpot({ type: 'calle', id: zone.id })}
                    className={`py-2 px-1 rounded-xl border transition-all text-center flex flex-col items-center gap-1 ${
                      selectedSpot?.id === zone.id && selectedSpot?.type === 'calle'
                        ? 'bg-amber-400 border-amber-300 text-slate-950 scale-105 font-bold'
                        : zone.free_slots === 0
                          ? 'bg-red-950/40 border-red-900/40 text-red-400'
                          : zone.free_slots < 4
                            ? 'bg-amber-950/40 border-amber-900/40 text-amber-400'
                            : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span className="text-[8px] block truncate max-w-full font-mono">{zone.street_name}</span>
                    <span className="text-[9px] font-black font-mono">{zone.free_slots} Lugares</span>
                  </button>
                ))}
              </div>

              {/* Saved car banner marker indication */}
              {currentUser.car_location && (
                <div role="status" className="relative z-10 bg-amber-500 text-slate-950 p-2 rounded-xl text-center flex items-center justify-center gap-2 border border-amber-400 font-mono shadow-md text-[10px]">
                  <Compass className="w-3.5 h-3.5 animate-bounce" />
                  <span>Tu auto está en <strong>{currentUser.car_location.note}</strong> {currentUser.car_location.floor ? `(${currentUser.car_location.floor})` : ''} reservado a las {currentUser.car_location.saved_at}</span>
                </div>
              )}

              {/* Prompt to register or locate parked vehicle */}
              <div className="relative z-10 flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[10px]">
                <p className="text-slate-400">Seleccioná un marcador del mapa para reservar plaza o ver datos.</p>
                <button 
                  onClick={() => {
                    // Quick default spot focus if none selected
                    if (!selectedSpot) {
                      setSelectedSpot({ type: 'playa', id: 'priv-001' });
                    }
                    onNotify('Centrado mapa en parking.');
                  }}
                  className="text-amber-400 hover:underline font-mono text-[9px] uppercase tracking-wider font-bold"
                >
                  Centrar GPS
                </button>
              </div>

            </div>

            {/* SELECTION DETAIL OR SPECIFIC PLAYA / CALLE BOOKING */}
            {activePlaya && (
              <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 flex flex-col gap-3.5" id="playa-booking-panel">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase">Playa Privada</span>
                      <span className="text-slate-400 text-xs font-mono">#{activePlaya.id}</span>
                    </div>
                    <h4 className="text-md font-bold text-slate-100 mt-1">{activePlaya.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-0.5 text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span className="text-xs font-bold font-mono">{activePlaya.rating}</span>
                      </div>
                      <span className="text-xs text-slate-400">({activePlaya.rating_count} calificaciones de playistas)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider block">Precio Hora</span>
                    <span className="text-lg font-black text-emerald-400 font-mono">${activePlaya.hourly_rate}</span>
                  </div>
                </div>

                {/* Floor Selection Grid - Dynamic rules */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800" id="floor-selector-box">
                  <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-2">
                    <Layers className="w-3.5 h-3.5 text-amber-500" />
                    Seleccioná qué piso querés reservar:
                  </p>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {activePlaya.floor_slots.map((slots, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedFloor(i)}
                        className={`p-2 rounded-lg border text-center transition ${
                          selectedFloor === i 
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-black' 
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-[10px] block font-mono">Piso {i + 1}</span>
                        <span className="text-xs font-black">{slots} libres</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Points differentiation disclaimer to respect user instructions */}
                <div className="bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-xl text-[11px] text-slate-300 leading-normal flex items-start gap-2">
                  <Award className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <strong>Puntos de esta Playa:</strong> Acumularás 50 pts canjeables por descuentos futuros en <em>{activePlaya.name}</em> únicamente. Los puntos de calle o municipales no se mezclan.
                  </div>
                </div>

                {/* Booking Trigger Actions */}
                <div className="flex gap-2.5">
                  <button
                    onClick={handleReserveSpot}
                    disabled={bookingLoading || activePlaya.free_slots <= 0}
                    type="button"
                    className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition active:scale-95 border border-amber-400 shadow-lg cursor-pointer"
                  >
                    {bookingLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                        <span>Procesando reserva...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-slate-950" />
                        <span>Reservar Plaza Express (-10% con Wallet)</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setCarFloor(`Piso ${selectedFloor + 1}`);
                      setCarNote(`Estacionamiento ${activePlaya.name}`);
                      handleRegisterCarLocation();
                    }}
                    type="button"
                    className="bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-750 px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4 text-amber-500" />
                    <span>Guardar ubicación auto</span>
                  </button>
                </div>

                {/* REVIEWS & FEED ON SELECTED PLAYA */}
                <div className="border-t border-slate-800/80 pt-3.5">
                  <h5 className="text-xs font-bold text-slate-300 uppercase tracking-tight mb-2 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                    Calificaciones de Conductores Córdoba ({activePlaya.reviews.length})
                  </h5>
                  
                  {/* Reviews feed */}
                  <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto mb-3 pr-1">
                    {activePlaya.reviews.map(review => (
                      <div key={review.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-900 leading-tight">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-amber-400">{review.author}</span>
                          <span className="text-[9px] text-slate-500">{review.date}</span>
                        </div>
                        <div className="flex gap-0.5 text-amber-500 mb-1">
                          {Array.from({ length: review.rating }).map((_, idx) => (
                            <Star key={idx} className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                          ))}
                        </div>
                        <p className="text-xs text-slate-400 italic">"{review.comment}"</p>
                      </div>
                    ))}
                  </div>

                  {/* Add review form */}
                  <form onSubmit={handleSubmitReview} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col gap-2">
                    <label htmlFor="review-comment-input" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dejar mi reseña para esta playa:</label>
                    <div className="flex gap-2">
                      <input
                        id="review-comment-input"
                        type="text"
                        placeholder="Escribe tu comentario de la atención..."
                        className="bg-slate-900 border border-slate-800 text-xs rounded-lg py-1.5 px-2.5 flex-1 text-slate-100 placeholder:text-slate-500"
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                      />
                      <select
                        aria-label="Calificación en estrellas"
                        className="bg-slate-900 border border-slate-800 text-xs text-amber-400 rounded-lg px-2"
                        value={reviewRating}
                        onChange={(e) => setReviewRating(parseInt(e.target.value))}
                      >
                        <option value="5">5 ★</option>
                        <option value="4">4 ★</option>
                        <option value="3">3 ★</option>
                        <option value="2">2 ★</option>
                        <option value="1">1 ★</option>
                      </select>
                      <button
                        type="submit"
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer"
                      >
                        Enviar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeCalle && (
              <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3" id="calle-booking-panel">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase">Estacionamiento Medido (Vía Pública)</span>
                    <h4 className="text-md font-bold text-slate-100 mt-1">{activeCalle.street_name} al {activeCalle.block_number}</h4>
                    <p className="text-xs text-slate-400 mt-1">Naranjita asignado municipal: <strong>{activeCalle.assigned_naranjita_name}</strong></p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider block">Costo Oficial</span>
                    <span className="text-md font-black text-emerald-400 font-mono">$500/h</span>
                  </div>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-slate-400">Cupos totales de la cuadra:</span>
                    <span className="font-bold text-slate-100 font-mono">{activeCalle.total_slots}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Cupos actualmente libres:</span>
                    <span className="font-bold text-amber-400 font-mono">{activeCalle.free_slots} disponibles</span>
                  </div>
                </div>

                <div className="bg-purple-950/20 border border-purple-800/20 p-2.5 rounded-xl text-xs text-slate-300">
                  <span className="font-bold text-purple-400">Puntos de Vía Pública:</span> Pagando este estacionamiento acumularás puntos de calle, válidos para canjear por horas gratis en cualquier calle controlada por cooperativas autorizadas de Córdoba.
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handlePayStreetParking(activeCalle)}
                    type="button"
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Wallet className="w-4 h-4" />
                    Pagar con mi Billetera Virtual ($500)
                  </button>

                  <button
                    onClick={() => {
                      setCarFloor('Vía Pública');
                      setCarNote(`${activeCalle.street_name} al ${activeCalle.block_number}`);
                      handleRegisterCarLocation();
                    }}
                    type="button"
                    className="bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-750 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Save className="w-4 h-4 text-amber-500" />
                    Dejé el auto acá
                  </button>
                </div>
              </div>
            )}

            {/* REGISTER WHERE YOU LEFT THE CAR DIRECT FORM */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-amber-500" />
                  ¿Dónde dejás el auto hoy? (Localizador manual)
                </h4>
                {currentUser.car_location && (
                  <button
                    onClick={handleClearCarLocation}
                    className="text-[9px] text-rose-500 font-mono font-bold hover:underline"
                  >
                    Limpiar Registro
                  </button>
                )}
              </div>

              {currentUser.car_location ? (
                <div role="status" className="bg-slate-950 border border-amber-500/30 p-3 rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[9px] text-amber-500 font-mono font-bold uppercase block">Ubicación Activa Guardada</span>
                    <p className="text-xs text-slate-200 font-bold mt-1">📍 {currentUser.car_location.note}</p>
                    {currentUser.car_location.floor && <p className="text-[10px] text-slate-400">Piso / Nivel: {currentUser.car_location.floor}</p>}
                    <span className="text-[9px] text-slate-500 font-mono block mt-1">Registrado hoy a las {currentUser.car_location.saved_at}</span>
                  </div>
                  <div className="caution-stripes w-8 h-8 rounded-full border border-amber-500/40"></div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-slate-400">Guardá una anotación con el piso o calle exacta para volver sin perderte en Córdoba.</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ej: Piso 2 - Hilera E3, cerca de la Panadería..."
                      className="bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 flex-1 text-slate-100 placeholder:text-slate-500"
                      value={carNote}
                      onChange={(e) => setCarNote(e.target.value)}
                    />
                    <select
                      aria-label="Piso o Nivel del auto"
                      className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-2"
                      value={carFloor}
                      onChange={(e) => setCarFloor(e.target.value)}
                    >
                      <option value="Calle">Calle</option>
                      <option value="Piso 1">Piso 1</option>
                      <option value="Piso 2">Piso 2</option>
                      <option value="Piso 3">Piso 3</option>
                    </select>
                    <button
                      onClick={handleRegisterCarLocation}
                      disabled={savingLocation}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs transition cursor-pointer"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* DRIVER TAB: VIRTUAL WALLET */}
        {driverTab === 'billetera' && (
          <div className="flex flex-col gap-4">
            <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full pointer-events-none filter blur-xl"></div>
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs text-amber-500 font-mono font-bold uppercase tracking-wider block">Billetera Virtual Cordobesa</span>
                  <span className="text-2xl font-black text-slate-100 font-mono">ARS ${currentUser.wallet_balance}</span>
                </div>
                <div className="bg-amber-500 p-2.5 rounded-xl text-slate-950">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>

              {/* Deposit Money simulator form */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
                <label className="text-xs font-bold text-slate-300" htmlFor="transfer-amount-input">Cargar saldo por Transferencia bancaria (CBU / CVU simulado)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 font-mono font-bold">$</span>
                    <input
                      id="transfer-amount-input"
                      type="number"
                      placeholder="Ingrese monto a transferir..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-600"
                      value={transferAmountInput}
                      onChange={(e) => setTransferAmountInput(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={handleLoadWallet}
                    disabled={transferLoading}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition flex items-center gap-1 cursor-pointer"
                  >
                    {transferLoading ? 'Procesando...' : 'Transferir Dinero'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">Recibo automático inmediato. El saldo sirve para abonar Playas de Estacionamiento Civiles y Cooperativas de Naranjitas.</p>
              </div>
            </div>

            {/* Wallet transactions list */}
            <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 flex flex-col gap-2">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">Historial de Transacciones</h4>
              <div className="flex flex-col gap-2 overflow-y-auto max-h-[180px]">
                {currentUser.wallet_transactions.map(tx => (
                  <div key={tx.id} className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-200">{tx.description}</p>
                      <span className="text-[10px] text-slate-500 font-mono">{tx.date}</span>
                    </div>
                    <span className={`font-mono font-bold ${tx.type === 'deposit' ? 'text-emerald-400' : 'text-amber-500'}`}>
                      {tx.type === 'deposit' ? '+' : '-'}${tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DRIVER TAB: LOCAL BENEFITS QR SELECTOR */}
        {driverTab === 'beneficios' && (
          <div className="flex flex-col gap-4">
            <div className="bg-slate-900 border border-amber-500/20 p-4 rounded-2xl">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Ticket className="w-4 h-4 text-amber-500" />
                Alianzas de Estacionamientos Córdoba PARK
              </h4>
              <p className="text-xs text-slate-400 mb-3 leading-normal">
                Comercios de cercanía a menos de 100 metros del estacionamiento te otorgan beneficios demostrando tu reserva activa o pago con la Wallet:
              </p>

              <div className="flex flex-col gap-3">
                {BENEFIT_PARTNERS.map(partner => (
                  <div key={partner.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row items-center gap-4 justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full">{partner.category}</span>
                        <span className="text-slate-500 text-[10px] font-mono">📍 a {partner.distanceMeter}m</span>
                      </div>
                      <h5 className="font-bold text-slate-200 text-xs mt-1.5">{partner.name}</h5>
                      <p className="text-xs text-amber-400 font-bold mt-1">{partner.discountDescription}</p>
                    </div>

                    {/* QR Simulation Box */}
                    <div className="bg-white p-2 rounded-xl flex flex-col items-center shrink-0 border border-slate-200">
                      <div className="w-16 h-16 bg-slate-950 flex flex-wrap items-center justify-center p-1.5 rounded">
                        {/* Fake Aztec Code pattern representation */}
                        <div className="grid grid-cols-4 gap-0.5 w-full h-full">
                          {Array.from({ length: 16 }).map((_, i) => (
                            <div key={i} className={`w-full h-full rounded ${i % 3 === 0 || i % 5 === 2 ? 'bg-amber-400' : 'bg-slate-900'}`} />
                          ))}
                        </div>
                      </div>
                      <span className="text-[8px] text-slate-950 font-mono font-bold mt-1">{partner.promocode}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DRIVER TAB: CREDENTIALS / MY ACCOUNT */}
        {driverTab === 'perfil' && (
          <div className="flex flex-col gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide mb-3">Datos del Perfil y Cuenta del Conductor</h4>
              
              <form onSubmit={handleLoginToggle} className="flex flex-col gap-3">
                <div>
                  <label htmlFor="perfil-full-name-input" className="text-[10px] text-slate-500 font-mono block mb-1">Nombre Completo:</label>
                  <input
                    id="perfil-full-name-input"
                    type="text"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs p-2 text-slate-100"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="perfil-email-input" className="text-[10px] text-slate-500 font-mono block mb-1">Correo Electrónico:</label>
                  <input
                    id="perfil-email-input"
                    type="email"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs p-2 text-slate-100"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                  />
                </div>

                <div className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800 leading-none mt-2">
                  <div className="text-xs text-slate-400">Puntos Acumulados en Calle (Naranjitas):</div>
                  <div className="text-sm font-mono font-black text-amber-500">{currentUser.points_street} pts</div>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-1">
                  <span className="text-[10px] text-slate-500 font-mono uppercase">Mis Puntos por Playa Privada:</span>
                  {Object.keys(currentUser.points_playas).length > 0 ? (
                    Object.entries(currentUser.points_playas).map(([id, pt]) => {
                      const plName = parkings.find(p => p.id === id)?.name || id;
                      return (
                        <div key={id} className="flex justify-between items-center text-xs mt-1">
                          <span className="text-slate-400">{plName}:</span>
                          <span className="font-mono font-bold text-amber-500">{pt} pts</span>
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-xs text-slate-600 block mt-1">No posees puntos cargados aún de playas.</span>
                  )}
                </div>

                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 font-bold py-2 rounded-lg text-xs text-slate-950 transition-all cursor-pointer"
                >
                  Guardar Perfil de Conductor
                </button>
              </form>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
