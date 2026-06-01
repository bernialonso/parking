export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'user' | 'naranjita' | 'admin';
  points_street: number; // For street parking / naranjitas discount
  points_playas: { [parkingId: string]: number }; // Specific points for individual garages
  wallet_balance: number; // Virtual wallet in ARS
  wallet_transactions: WalletTransaction[];
  car_location: CarSavedLocation | null;
}

export interface WalletTransaction {
  id: string;
  type: 'deposit' | 'payment';
  amount: number;
  description: string;
  date: string;
}

export interface CarSavedLocation {
  lat: number;
  lng: number;
  note: string;
  floor?: string;
  saved_at: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export interface PrivateParking {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  hourly_rate: number;
  total_slots: number;
  free_slots: number;
  monthly_rate_available: boolean;
  monthly_rate?: number;
  rating: number;
  rating_count: number;
  floor_slots: number[]; // Index maps to Floor (e.g. floor_slots[0] is Floor 1 available spots)
  reviews: Review[];
}

export interface Reservation {
  id: string;
  user_id: string;
  parking_id: string;
  status: 'active' | 'completed' | 'cancelled';
  floor_selected: number; // 0, 1, or 2 (Floor 1, 2, 3)
  created_at: string;
  expires_at: string;
}

export interface MonthlySubscription {
  id: string;
  user_id: string;
  parking_id: string;
  status: 'active' | 'expired';
  start_date: string;
  end_date: string;
}

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface StreetParkingZone {
  id: string;
  street_name: string;
  block_number: number;
  assigned_naranjita_id: string;
  assigned_naranjita_name: string;
  total_slots: number;
  free_slots: number;
  coordinates: Coordinate[]; // Points describing the street polygon/segment
}

export interface BenefitPartner {
  id: string;
  name: string;
  distanceMeter: number;
  category: 'Comida' | 'Café' | 'Servicios' | 'Lavadero';
  discountDescription: string;
  promocode: string;
}
