import React, { useState } from 'react';
import { Check, Copy, Database, ShieldAlert, Code2, Cpu } from 'lucide-react';

interface SqlViewerProps {
  onNotifyCopy: (message: string) => void;
}

export default function SqlViewer({ onNotifyCopy }: SqlViewerProps) {
  const [activeTab, setActiveTab] = useState<'ddl' | 'fns'>('ddl');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const sqlDDL = `-- =========================================================================
-- PASO 1: MODELADO DE DATOS RELACIONAL Y TIEMPO REAL (Supabase SQL DDL)
-- Ubicación geográfica por defecto: Córdoba (Centro, Nueva Córdoba, Güemes)
-- =========================================================================

-- Habilitar extensión para generación de UUIDs v4
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Usuarios (Sincronizada con Supabase Auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'naranjita', 'admin')),
    points INTEGER DEFAULT 100 CHECK (points >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabla de Playas de Estacionamiento Privadas
CREATE TABLE public.private_parking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    hourly_rate DECIMAL(10, 2) NOT NULL CHECK (hourly_rate >= 0),
    total_slots INTEGER NOT NULL CHECK (total_slots > 0),
    free_slots INTEGER NOT NULL CHECK (free_slots >= 0 AND free_slots <= total_slots),
    monthly_rate_available BOOLEAN DEFAULT false NOT NULL,
    monthly_rate DECIMAL(10, 2) CHECK (monthly_rate >= 0),
    CONSTRAINT chk_free_slots CHECK (free_slots <= total_slots)
);

-- 3. Tabla de Reservas Express (15 minutos de tolerancia para estacionar)
CREATE TABLE public.reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    parking_id UUID NOT NULL REFERENCES public.private_parking(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT chk_expiry CHECK (expires_at > created_at)
);

-- 4. Tabla de Abonos Mensuales (Suscripciones tipo Mercado Pago)
CREATE TABLE public.monthly_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    parking_id UUID NOT NULL REFERENCES public.private_parking(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired')),
    start_date DATE DEFAULT CURRENT_DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT chk_dates CHECK (end_date >= start_date)
);

-- 5. Zonas de Vía Pública (Calzadas asignadas al personal urbano / naranjitas)
CREATE TABLE public.street_parking_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    street_name VARCHAR(150) NOT NULL,
    block_number INTEGER NOT NULL CHECK (block_number >= 0),
    assigned_naranjita_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    total_slots INTEGER NOT NULL CHECK (total_slots > 0),
    free_slots INTEGER NOT NULL CHECK (free_slots >= 0 AND free_slots <= total_slots),
    coordinates JSONB NOT NULL, -- Almacena array [{lat: -31.43, lng: -64.19}] para renderizar polilíneas
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- SEGURIDAD: ROW LEVEL SECURITY (RLS) - RESTRICCIÓN DE ACCESO EN VÍA PÚBLICA
-- =========================================================================

-- Habilitar RLS en tablas críticas
ALTER TABLE public.street_parking_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_parking ENABLE ROW LEVEL SECURITY;

-- Política 1: Lectura colectiva en playas y cuadras públicas
CREATE POLICY "Lectura colectiva de playas privadas"
ON public.private_parking FOR SELECT
USING (true);

CREATE POLICY "Lectura colectiva de zonas en via publica"
ON public.street_parking_zones FOR SELECT
USING (true);

-- Política 2: Modificación condicionada de vía pública para Naranjitas autorizados
CREATE POLICY "Solo naranjitas modifican su zona asignada"
ON public.street_parking_zones FOR UPDATE
USING (
  auth.uid() = assigned_naranjita_id
)
WITH CHECK (
  auth.uid() = assigned_naranjita_id AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'naranjita'
  )
);`;

  const sqlFns = `-- =========================================================================
-- PASO 2: LÓGICA DE NEGOCIO EN EL BACKEND (Funciones Transaccionales PL/pgSQL)
-- =========================================================================

-- 1. Función fn_reserve_slot(): Reserva Express y prevención de sobreventa (concurrency-safe)
-- Utiliza exclusivo row-locking (FOR UPDATE) para evitar race-conditions.
-- Al concretarse exitosamente, otorga 50 puntos de fidelización al usuario.
CREATE OR REPLACE FUNCTION public.fn_reserve_slot(
    p_user_id UUID,
    p_parking_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Permite ejecutar con privilegios del administrador, ignorando políticas RLS de sesión temporal
AS $$
DECLARE
    v_free_slots INT;
    v_parking_name VARCHAR(150);
    v_reservation_id UUID;
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- INICIO IMPLÍCITO DE LA TRANSACCIÓN (En funciones de Postgres, cada ejecución de bloque es transaccional)
    
    -- Bloquear de manera exclusiva la fila del parking privado seleccionado
    -- Esto bloquea a cualquier otra llamada concurrente que intente acceder al mismo ID
    SELECT free_slots, name
    INTO v_free_slots, v_parking_name
    FROM public.private_parking
    WHERE id = p_parking_id
    FOR UPDATE;

    -- Validar disponibilidad instantánea
    IF v_free_slots <= 0 OR v_free_slots IS NULL THEN
        RAISE EXCEPTION 'Agotado: No quedan lugares libres en esta playa de estacionamiento.';
    END IF;

    -- Decrementar un lugar libre
    UPDATE public.private_parking
    SET free_slots = free_slots - 1
    WHERE id = p_parking_id;

    -- Definir expiración de 15 minutos (tolerancia municipal)
    v_expires_at := timezone('utc'::text, now()) + INTERVAL '15 minutes';

    -- Crear registro de reserva municipal
    INSERT INTO public.reservations (user_id, parking_id, status, expires_at)
    VALUES (p_user_id, p_parking_id, 'active', v_expires_at)
    RETURNING id INTO v_reservation_id;

    -- Actualizar perfil del usuario sumándole 50 puntos de fidelización
    UPDATE public.users
    SET points = points + 50
    WHERE id = p_user_id;

    -- Confirmación y retorno transaccional exitoso
    RETURN json_build_object(
        'success', true,
        'message', 'Reserva procesada exitosamente en el nodo central.',
        'reservation_id', v_reservation_id,
        'parking_name', v_parking_name,
        'expires_at', v_expires_at,
        'points_earned', 50
    );

EXCEPTION
    WHEN OTHERS THEN
        -- PostgreSQL realiza ROLLBACK atómico general si sucede un error
        RETURN json_build_object(
            'success', false,
            'error_code', SQLSTATE,
            'message', 'Fallo transaccional: ' || SQLERRM
        );
END;
$$;


-- 2. Función fn_update_street_slots(): Ajuste de cupos atómico para el Naranjita en vía pública
-- Asegura el incremento/decremento correcto de lugares libres sin race conditions.
CREATE OR REPLACE FUNCTION public.fn_update_street_slots(
    p_zone_id UUID,
    p_modifier INT -- Recibe -1 (ocupar lugar) o +1 (liberar lugar)
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_free INT;
    v_total_slots INT;
    v_street VARCHAR;
    v_block INT;
BEGIN
    -- Bloquear fila de la zona de estacionamiento urbano asignada
    SELECT free_slots, total_slots, street_name, block_number
    INTO v_current_free, v_total_slots, v_street, v_block
    FROM public.street_parking_zones
    WHERE id = p_zone_id
    FOR UPDATE;

    -- Validar existencia
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Zona de vía pública no localizada.');
    END IF;

    -- Validar límites operacionales estrictos
    IF (v_current_free + p_modifier) < 0 THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'Error: No es posible registrar más autos. La cuadra ya está completa.'
        );
    ELSIF (v_current_free + p_modifier) > v_total_slots THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'Error: Excede el límite de plazas asignadas de la cuadra.'
        );
    END IF;

    -- Actualización de plazas liberadas u ocupadas
    UPDATE public.street_parking_zones
    SET free_slots = free_slots + p_modifier,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_zone_id;

    RETURN json_build_object(
        'success', true,
        'message', 'Plazas actualizadas en tiempo real en Córdoba Central.',
        'street', v_street,
        'block', v_block,
        'free_slots', v_current_free + p_modifier
    );
END;
$$;`;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    onNotifyCopy(`¡Código de la pestaña copiado con éxito!`);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  return (
    <div className="glass rounded-3xl overflow-hidden shadow-2xl h-full flex flex-col flex-1 border border-slate-700/50" id="sql-viewer-container">
      {/* Header */}
      <div className="bg-slate-950 border-b border-slate-800 p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-cyan-500/10 p-2.5 rounded-xl border border-cyan-500/20">
            <Database className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="font-display font-bold text-slate-100 text-lg">Base de Datos Córdoba Parking</h2>
            <p className="text-xs text-slate-400 font-sans">Esquemas Relacionales, Procedimientos Almacenados y RLS en Supabase</p>
          </div>
        </div>
        <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('ddl')}
            className={`px-4 py-1.5 text-xs font-medium font-sans rounded-lg transition-all ${
              activeTab === 'ddl'
                ? 'bg-cyan-500/90 text-white shadow-md shadow-cyan-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            id="tab_view_ddl"
          >
            <Code2 className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
            DDL Relacional & RLS
          </button>
          <button
            onClick={() => setActiveTab('fns')}
            className={`px-4 py-1.5 text-xs font-medium font-sans rounded-lg transition-all ${
              activeTab === 'fns'
                ? 'bg-cyan-500/90 text-white shadow-md shadow-cyan-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            id="tab_view_fns"
          >
            <Cpu className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
            PL/pgSQL Procedimientos
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Banner de RLS e Integridad de Concurrencia */}
        <div className="bg-cyan-950/20 px-5 py-3 border-b border-slate-800/80 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-cyan-200 leading-relaxed font-sans font-medium">
              {activeTab === 'ddl' ? (
                <>
                  <strong className="text-cyan-300">Seguridad RLS Activa:</strong> La tabla <code className="bg-slate-950 px-1 py-0.5 rounded text-cyan-300 font-mono">street_parking_zones</code> restringe mediante políticas que únicamente el naranjita municipal asignado pueda modificar los cupos de su cuadra (UPDATE). Los usuarios comunes solo cuentan con permisos de lectura.
                </>
              ) : (
                <>
                  <strong className="text-cyan-300">Garantía de Concurrencia Cero-Sobreventa:</strong> El motor utiliza el mecanismo de bloqueo exclusivo <code className="bg-slate-950 px-1 py-0.5 rounded text-cyan-300 font-mono">FOR UPDATE</code>. Ante múltiples compras simultáneas de la última vacante, Postgres encolará las transacciones, denegando las excedentes mediante excepciones controladas.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Code Editor */}
        <div className="relative flex-1 bg-slate-950 overflow-hidden flex flex-col">
          <button
            onClick={() => copyToClipboard(activeTab === 'ddl' ? sqlDDL : sqlFns, activeTab)}
            className="absolute top-4 right-4 z-10 bg-slate-900 border border-slate-800 hover:border-slate-700 p-2 rounded-xl text-slate-400 hover:text-slate-200 transition-all flex items-center gap-1.5 text-xs"
            title="Copiar código al portapapeles"
            id="copy-sql-btn"
          >
            {copiedId === activeTab ? (
              <>
                <Check className="w-4.5 h-4.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-4.5 h-4.5 text-slate-400" />
                <span>Copiar SQL</span>
              </>
            )}
          </button>

          <pre className="flex-1 p-6 overflow-auto font-mono text-[11.5px] text-emerald-400/90 leading-relaxed select-all">
            <code>
              {activeTab === 'ddl' ? sqlDDL : sqlFns}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}
