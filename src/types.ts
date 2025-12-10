
export interface TripDay {
  day: number;
  activities: TripActivity[];
}

export interface TripActivity {
  id: string;
  time: string;
  title: string;
  description: string;
  type: 'food' | 'sightseeing' | 'relax' | 'adventure';
  location?: string;
}

export interface Destination {
  name: string;
  description: string;
  imageUrl: string;
  rating: number;
  tags: string[];
  bestTime: string;
  weather: {
    condition: 'sunny' | 'cloudy' | 'rainy';
    temp: string;
  };
  coordinates?: { lat: number, lng: number };
}

export interface Place {
  id: string;
  name: string;
  imageUrl: string;
  rating: number;
  price: string;
  type: string;
  isAiPick?: boolean;
  coordinates?: { lat: number, lng: number };
  description?: string; // Added for details view
  amenities?: string[]; // Added for details view
  location?: string; // Added for search in Stays
}

export interface Comment {
  id: string;
  user: string;
  text: string;
  timestamp: string;
}

export interface Post {
  id: string;
  user: string;
  userAvatar: string;
  location: string;
  title?: string; // Added for Create Post feature
  imageUrl: string;
  content: string;
  likes: number;
  likedByCurrentUser: boolean; 
  saved: boolean;
  aiInsights?: string;
  comments: Comment[];
  createdAt: string; // Added for sorting logic
}

export interface RouteOption {
  id: string;
  mode: 'train' | 'bus' | 'flight' | 'car';
  duration: string;
  cost: string;
  scenic: boolean;
  apps?: string[]; // Apps used in destination country
  coordinates?: { // Optional custom coordinates for different routes
    from: { lat: number, lng: number };
    to: { lat: number, lng: number };
  }
}

export interface PackingItem {
  category: string;
  items: string[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface SavedItinerary {
  id: string;
  title: string;
  days: number;
  type: string;
  destinations: string[];
  // New Fields for Enhanced Planner
  sourceLocation?: string;
  startDate?: string;
  budget?: { amount: number; currency: string };
  activities?: string[];
  notes?: string;
  schedule?: TripDay[]; // Added to store the actual plan
}

export enum AppRoute {
  SPLASH = 'splash',
  ONBOARDING = 'onboarding',
  AUTH = 'auth',
  HOME = 'home',
  DESTINATION = 'destination',
  ITINERARY = 'itinerary',
  COMMUNITY = 'community',
  PROFILE = 'profile',
  STAYS = 'stays',
  FOOD = 'food',
  ROUTES = 'routes',
  PACKING = 'packing',
}