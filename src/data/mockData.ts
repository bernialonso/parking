import { User, PrivateParking, StreetParkingZone, BenefitPartner } from '../types';

export const MOCK_USERS: User[] = [
  {
    id: 'user-cba',
    email: 'javier.talleres@gmail.com',
    full_name: 'Javier Spinelli',
    role: 'user',
    points_street: 420, // Accumulating street points (Naranjitas)
    points_playas: {
      'priv-001': 150, // Individual garage points (Buen Pastor)
      'priv-002': 80,  // Individual garage points (San Jerónimo)
    },
    wallet_balance: 8500, // ARS loaded via transfer
    wallet_transactions: [
      { id: 'tx-1', type: 'deposit', amount: 5000, description: 'Carga por transferencia (Red Link)', date: '2026-06-01 12:30' },
      { id: 'tx-2', type: 'payment', amount: 1500, description: 'Pago Fracción - Buen Pastor (Piso 1)', date: '2026-05-31 18:40' }
    ],
    car_location: null, // Custom physical spot locator
  }
];

export const INITIAL_PRIVATE_PARKINGS: PrivateParking[] = [
  {
    id: 'priv-001',
    name: 'Estacionamiento Buen Pastor',
    latitude: -31.4245,
    longitude: -64.1872,
    hourly_rate: 1500,
    total_slots: 45,
    free_slots: 12,
    monthly_rate_available: true,
    monthly_rate: 45000,
    rating: 4.8,
    rating_count: 142,
    floor_slots: [4, 5, 3], // 3 floors: Piso 1, Piso 2, Piso 3
    reviews: [
      { id: 'rev-1', author: 'Paula C.', rating: 5, comment: 'Excelente ubicación en Nueva Córdoba. Techado y súper seguro.', date: '2026-05-30' },
      { id: 'rev-2', author: 'Marcos G.', rating: 4, comment: 'Suelo estacionar cuando voy al Paseo del Buen Pastor. Recomiendo reservar antes.', date: '2026-05-28' }
    ]
  },
  {
    id: 'priv-002',
    name: 'Playa San Jerónimo Centro',
    latitude: -31.4150,
    longitude: -64.1820,
    hourly_rate: 1200,
    total_slots: 60,
    free_slots: 34,
    monthly_rate_available: true,
    monthly_rate: 35000,
    rating: 4.4,
    rating_count: 89,
    floor_slots: [10, 14, 10], // Floors 1, 2, 3
    reviews: [
      { id: 'rev-3', author: 'Tomás R.', rating: 4, comment: 'La atención es bastante rápida. Precios accesibles para el microcentro.', date: '2026-05-29' }
    ]
  },
  {
    id: 'priv-003',
    name: 'Garaje Güemes Art',
    latitude: -31.4268,
    longitude: -64.1935,
    hourly_rate: 1300,
    total_slots: 20,
    free_slots: 0, // Solid red
    monthly_rate_available: false,
    rating: 4.1,
    rating_count: 65,
    floor_slots: [0, 0, 0],
    reviews: [
      { id: 'rev-4', author: 'Luna F.', rating: 3, comment: 'Cerca de los bares de Güemes pero siempre está lleno los fines de semana.', date: '2026-05-25' }
    ]
  },
  {
    id: 'priv-004',
    name: 'Parking Trejo & Caseros',
    latitude: -31.4178,
    longitude: -64.1870,
    hourly_rate: 1400,
    total_slots: 50,
    free_slots: 4, // Yellow (< 5)
    monthly_rate_available: true,
    monthly_rate: 42000,
    rating: 4.6,
    rating_count: 112,
    floor_slots: [1, 2, 1], // Floors 1, 2, 3
    reviews: [
      { id: 'rev-5', author: 'Fede V.', rating: 5, comment: 'Excelente atención de los playeros. Ideal si vas a la Manzana Jesuítica.', date: '2026-05-27' }
    ]
  }
];

export const INITIAL_STREET_ZONES: StreetParkingZone[] = [
  {
    id: 'street-001',
    street_name: 'Calle Belgrano',
    block_number: 400,
    assigned_naranjita_id: 'nara-001',
    assigned_naranjita_name: 'Don Carlos Peralta',
    total_slots: 20,
    free_slots: 14,
    coordinates: [
      { lat: -31.4250, lng: -64.1925 },
      { lat: -31.4270, lng: -64.1930 }
    ]
  },
  {
    id: 'street-002',
    street_name: 'Calle Rondeau',
    block_number: 200,
    assigned_naranjita_id: 'nara-002',
    assigned_naranjita_name: 'Doña Marta Gómez',
    total_slots: 15,
    free_slots: 6,
    coordinates: [
      { lat: -31.4230, lng: -64.1850 },
      { lat: -31.4242, lng: -64.1865 }
    ]
  },
  {
    id: 'street-003',
    street_name: 'Calle San Lorenzo',
    block_number: 300,
    assigned_naranjita_id: 'nara-003',
    assigned_naranjita_name: 'El Flaco Coco',
    total_slots: 18,
    free_slots: 1,
    coordinates: [
      { lat: -31.4255, lng: -64.1875 },
      { lat: -31.4267, lng: -64.1890 }
    ]
  },
  {
    id: 'street-004',
    street_name: 'Calle 27 de Abril',
    block_number: 500,
    assigned_naranjita_id: 'nara-004',
    assigned_naranjita_name: 'Seba Ortega',
    total_slots: 25,
    free_slots: 0,
    coordinates: [
      { lat: -31.4140, lng: -64.1855 },
      { lat: -31.4145, lng: -64.1872 }
    ]
  }
];

// Commercial benefit alliances representing Córdoba local stores
export const BENEFIT_PARTNERS: BenefitPartner[] = [
  {
    id: 'b-1',
    name: 'Panadería "La docta" (Paseo Buen Pastor)',
    distanceMeter: 25,
    category: 'Comida',
    discountDescription: '30% de Descuento Especial en Criollos de Hojaldre mostrando QR activo.',
    promocode: 'PARK-CRIOLLO30'
  },
  {
    id: 'b-2',
    name: 'Café Martínez (Manzana Jesuítica)',
    distanceMeter: 60,
    category: 'Café',
    discountDescription: '20% off en desayunos/meriendas abonando con Billetera CordobaPark.',
    promocode: 'PARK-MARTINEZ20'
  }
];

export const CORDOBA_CENTER = { lat: -31.4210, lng: -64.1880 };
