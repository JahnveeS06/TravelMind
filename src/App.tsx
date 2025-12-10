
import React, { useState, useEffect, useContext, createContext } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation, Navigate, Outlet } from 'react-router-dom';
import { 
  Map, Home as HomeIcon, Compass, User, MessageCircle, Search, Menu, Sparkles, Heart, Share2, 
  Calendar, Send, X, ChevronRight, Sun, CloudRain, Utensils, Bed, Signpost, Briefcase, 
  Cloud, Wifi, WifiOff, AlertTriangle, Filter, Check, Plus, Minus, ThumbsUp, MapPin, ArrowDownUp,
  LocateFixed, Edit, Save, Trash2, Clock, Image as ImageIcon
} from 'lucide-react';
import { getDestinationInsights, generateItinerary, chatWithAI, generatePackingList, getStays, getFoodRecommendations } from './services/geminiService';
import { Destination, TripDay, Post, PackingItem, Place, RouteOption, SavedItinerary, TripActivity } from './types';
import { getPlaceImage } from './constants/destinationImages';

// --- Global Declarations ---
declare global {
  interface Window {
    L: any;
  }
}

// --- Context for State Management ---
const ItineraryContext = createContext<{
  savedItineraries: SavedItinerary[];
  saveItinerary: (itinerary: SavedItinerary) => void;
  deleteItinerary: (id: string) => void;
  updateItinerary: (itinerary: SavedItinerary) => void;
}>({
  savedItineraries: [],
  saveItinerary: () => {},
  deleteItinerary: () => {},
  updateItinerary: () => {},
});

// --- Shared Data ---
const MOCK_SAVED_ITINERARIES: SavedItinerary[] = [
  { 
    id: '1', title: 'Tokyo Adventure', days: 5, type: 'Cultural', 
    destinations: ['Tokyo', 'Kyoto', 'Osaka'],
    sourceLocation: 'San Francisco',
    startDate: '2024-04-10',
    budget: { amount: 3500, currency: 'USD' },
    activities: ['Culture', 'Food'],
    notes: 'Want to see cherry blossoms and visit Nintendo World.',
    schedule: [] // Simplified for mock
  }, 
  { 
    id: '2', title: 'Italian Summer', days: 7, type: 'Relax', 
    destinations: ['Rome', 'Amalfi'],
    sourceLocation: 'London',
    startDate: '2024-07-15',
    budget: { amount: 2000, currency: 'EUR' },
    activities: ['Relax', 'Food', 'Sightseeing'],
    notes: 'Focus on relaxation and beaches.',
    schedule: []
  }
];

// --- Shared Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', icon: Icon, size = 'md', disabled = false }: any) => {
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-6 py-3", lg: "px-8 py-4 text-lg" };
  const baseStyle = `rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${sizes[size as keyof typeof sizes]}`;
  const variants = {
    primary: "bg-sage text-white shadow-lg shadow-sage/30 hover:bg-opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
    secondary: "bg-white text-deepTeal border border-stone-200 hover:bg-stone-50 active:scale-95 disabled:opacity-50",
    ghost: "text-deepTeal hover:bg-black/5 disabled:opacity-50",
    outline: "border-2 border-sage text-sage hover:bg-sage/10 disabled:opacity-50",
    danger: "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 disabled:opacity-50"
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`}>
      {Icon && <Icon size={size === 'sm' ? 16 : 18} />}
      {children}
    </button>
  );
};

const Input = ({ placeholder, value, onChange, onKeyDown, icon: Icon, className = '', type = 'text' }: any) => (
  <div className={`relative w-full ${className}`}>
    {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />}
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      className={`w-full p-4 ${Icon ? 'pl-12' : ''} bg-white rounded-2xl shadow-sm border border-stone-100 focus:ring-2 focus:ring-sage focus:border-transparent outline-none text-deepTeal placeholder-gray-400 transition-all`}
    />
  </div>
);

// --- Map Component (Leaflet) ---
interface LeafletMapProps {
  places?: Place[];
  route?: { from: {lat: number, lng: number}, to: {lat: number, lng: number} };
  center?: {lat: number, lng: number};
  zoom?: number;
}

const LeafletMap = ({ places = [], route, center, zoom = 13 }: LeafletMapProps) => {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || !window.L) return;

    // Cleanup existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    // Determine initial center
    let initialLat = 48.8566;
    let initialLng = 2.3522;

    if (center) {
      initialLat = center.lat;
      initialLng = center.lng;
    } else if (places.length > 0 && places[0].coordinates) {
      initialLat = places[0].coordinates.lat;
      initialLng = places[0].coordinates.lng;
    } else if (route) {
      initialLat = route.from.lat;
      initialLng = route.from.lng;
    }
    
    // Initialize Map
    const map = window.L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([initialLat, initialLng], zoom);
    
    mapInstanceRef.current = map;

    // Add CartoDB Positron Tile Layer
    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      subdomains: 'abcd'
    }).addTo(map);

    // Custom Icon Definition
    const createCustomIcon = (isActive: boolean = false) => {
        return window.L.divIcon({
            className: 'custom-div-icon',
            html: `
              <div style="
                background-color: ${isActive ? '#5E8D77' : '#0F3D3E'}; 
                width: 28px; 
                height: 28px; 
                border-radius: 50% 50% 0 50%; 
                transform: rotate(45deg) ${isActive ? 'scale(1.2)' : 'scale(1)'}; 
                border: 2px solid white; 
                box-shadow: 0 4px 6px rgba(0,0,0,0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
              ">
                <div style="width: 8px; height: 8px; background-color: white; border-radius: 50%; transform: rotate(-45deg);"></div>
              </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 28],
            popupAnchor: [0, -28]
        });
    };

    // Add Markers
    places.forEach(place => {
      if (place.coordinates) {
        const marker = window.L.marker([place.coordinates.lat, place.coordinates.lng], {
            icon: createCustomIcon(place.isAiPick)
        }).addTo(map);
        
        marker.bindPopup(`
           <div style="font-family: 'Inter', sans-serif; padding: 4px; min-width: 120px;">
             <strong style="color: #0F3D3E; display:block; margin-bottom: 4px; font-size: 14px;">${place.name}</strong>
             <span style="color: #666; font-size: 12px; display: block;">${place.type}</span>
             <span style="color: #5E8D77; font-weight: 600; font-size: 12px;">${place.price}</span>
           </div>
        `);
      }
    });

    // Draw Route if present
    if (route) {
        const line = window.L.polyline([
            [route.from.lat, route.from.lng],
            [route.to.lat, route.to.lng]
        ], { color: '#5E8D77', weight: 4, dashArray: '10, 10' }).addTo(map);
        map.fitBounds(line.getBounds(), { padding: [50, 50] });
    } else if (places.length > 1) {
       // Fit bounds if multiple places
      const bounds = window.L.latLngBounds(places.map(p => p.coordinates ? [p.coordinates.lat, p.coordinates.lng] : null).filter(Boolean));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }

    return () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }
    }
  }, [places, route, center, zoom]);

  return (
    <div className="w-full h-full relative bg-stone-100">
       <div ref={mapRef} className="w-full h-full z-0" />
       {!window.L && (
         <div className="absolute inset-0 flex items-center justify-center bg-stone-100 text-gray-400">
           Loading Map...
         </div>
       )}
    </div>
  );
};

// --- Layout Components ---

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path: string) => location.pathname.startsWith(path);

  const navItems = [
    { icon: HomeIcon, label: 'Home', path: '/home' },
    { icon: Compass, label: 'Itinerary', path: '/itinerary' },
    { icon: MessageCircle, label: 'Community', path: '/community' },
    { icon: Bed, label: 'Stays', path: '/stays' },
    { icon: Utensils, label: 'Food', path: '/food' },
    { icon: Signpost, label: 'Routes', path: '/routes' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="hidden md:flex flex-col w-64 bg-white border-r border-stone-200 h-screen fixed left-0 top-0 z-40">
      <div className="p-8 pb-4">
         <div className="flex items-center gap-3 text-deepTeal font-bold text-2xl">
           <div className="bg-sage text-white p-2 rounded-xl"><Compass size={24} /></div>
           TravelMind
         </div>
      </div>
      <div className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
              isActive(item.path) ? 'bg-sage/10 text-sage font-semibold' : 'text-gray-500 hover:bg-stone-50'
            }`}
          >
            <item.icon size={20} strokeWidth={isActive(item.path) ? 2.5 : 2} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
      <div className="p-4 border-t border-stone-100">
        <div className="flex items-center gap-3 px-4 py-2">
          <img src="https://images.unsplash.com/photo-1533738363-b7f9aef128ce?q=80&w=200" className="w-10 h-10 rounded-full object-cover" alt="Profile" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-deepTeal">Alex Traveler</h4>
            <p className="text-xs text-gray-400">Pro Member</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { icon: HomeIcon, label: 'Home', path: '/home' },
    { icon: Compass, label: 'Itinerary', path: '/itinerary' },
    { icon: MessageCircle, label: 'Community', path: '/community' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-stone-200 pb-safe pt-2 px-6 z-50">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center p-2 transition-colors ${
              isActive(item.path) ? 'text-sage' : 'text-gray-400'
            }`}
          >
            <item.icon size={24} strokeWidth={isActive(item.path) ? 2.5 : 2} />
            <span className="text-[10px] font-medium mt-1">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const OfflineIndicator = () => {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const setStatus = () => setOnline(navigator.onLine);
    window.addEventListener('online', setStatus);
    window.addEventListener('offline', setStatus);
    return () => {
      window.removeEventListener('online', setStatus);
      window.removeEventListener('offline', setStatus);
    };
  }, []);

  if (online) return null;
  return (
    <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-xs text-center py-1 z-[60]">
      Offline Mode - Some AI features may be unavailable
    </div>
  );
};

const Layout = () => {
  const location = useLocation();
  const isAuth = ['/', '/login', '/onboarding', '/splash'].includes(location.pathname);

  if (isAuth) return <Outlet />;

  return (
    <div className="bg-softSand min-h-screen text-stone-800 font-sans">
      <OfflineIndicator />
      <Sidebar />
      <div className="md:ml-64 min-h-screen pb-20 md:pb-0">
        <Outlet />
      </div>
      <BottomNav />
      <AIChatFloat />
    </div>
  );
};

// --- Features & Pages ---

const AIChatFloat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'model', text: string}[]>([]);
  const [input, setInput] = useState('');
  const location = useLocation();

  if (['/', '/login', '/onboarding'].includes(location.pathname)) return null;

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setMessages(prev => [...prev, { role: 'model', text: '...' }]);
    const response = await chatWithAI(userMsg, `Current page: ${location.pathname}`);
    setMessages(prev => {
      const newMsgs = [...prev];
      newMsgs.pop();
      return [...newMsgs, { role: 'model', text: response }];
    });
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 md:bottom-8 md:right-8 bg-deepTeal text-white p-4 rounded-full shadow-xl shadow-deepTeal/30 z-40 hover:scale-105 transition-transform"
      >
        <Sparkles size={24} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end sm:px-8 pointer-events-none p-4 pb-24 sm:pb-4">
          <div className="bg-white w-full max-w-md h-[500px] rounded-3xl shadow-2xl flex flex-col pointer-events-auto animate-slideUp border border-stone-100">
            <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-sage/10 rounded-t-3xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-sage flex items-center justify-center text-white">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-deepTeal">TravelMind AI</h3>
                  <p className="text-xs text-sage">Ask me anything</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-400 mt-20">
                  <p>Where are we going next?</p>
                  <p className="text-xs mt-2">Try "Best cafes in Paris" or "Packing list for winter"</p>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' ? 'bg-sage text-white rounded-tr-sm' : 'bg-stone-100 text-stone-800 rounded-tl-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-stone-100">
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-stone-50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sage"
                  placeholder="Ask for recommendations..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button onClick={handleSend} className="bg-deepTeal text-white p-2 rounded-xl">
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// --- Page Components ---

const Home = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [season, setSeason] = useState<'summer'|'winter'>('summer');

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && search.trim()) {
      navigate(`/itinerary?destination=${encodeURIComponent(search.trim())}`);
    }
  };

  const handleViewOnMap = (location: string) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`, '_blank');
  };

  const summerDestinations = [
    { name: 'Santorini' }, { name: 'Bali' },
    { name: 'Amalfi Coast' }, { name: 'Maui' }
  ];
  const winterDestinations = [
    { name: 'Swiss Alps' }, { name: 'Aspen' },
    { name: 'Kyoto' }, { name: 'Reykjavik' }
  ];
  const currentDestinations = season === 'summer' ? summerDestinations : winterDestinations;

  const suggestionPlace = "Kyoto, Japan";

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
         <div>
            <h1 className="text-3xl md:text-4xl font-bold text-deepTeal">Explore the World</h1>
            <p className="text-gray-500 mt-2">Discover new places and create memories.</p>
         </div>
         <div className="w-full md:w-96">
            <Input 
              icon={Search} 
              placeholder="Where do you want to go?" 
              value={search}
              onChange={(e: any) => setSearch(e.target.value)}
              onKeyDown={handleSearch}
            />
         </div>
      </div>

      <section className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100">
         <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-deepTeal flex items-center gap-2">
              <Sparkles size={20} className="text-sage" /> Daily AI Suggestion
            </h2>
         </div>
         <div className="flex flex-col md:flex-row gap-6 items-start">
            <img src={getPlaceImage(suggestionPlace)} className="w-full md:w-1/3 h-64 object-cover rounded-2xl" alt={suggestionPlace} />
            <div className="flex-1">
               <div className="flex items-center gap-2 mb-2">
                 <span className="bg-sage/10 text-sage px-3 py-1 rounded-full text-xs font-bold">Top Pick</span>
                 <span className="flex items-center text-xs text-gray-400"><Sun size={12} className="mr-1"/> 24°C</span>
               </div>
               <h3 className="text-2xl font-bold text-deepTeal mb-2">{suggestionPlace}</h3>
               <p className="text-gray-500 mb-4 leading-relaxed">Experience the serene temples and vibrant cherry blossoms in this historic gem. Perfect for travelers seeking culture and tranquility.</p>
               <div className="flex gap-2">
                  <Button onClick={() => navigate('/destination?q=Kyoto')} icon={ChevronRight}>Explore Kyoto</Button>
                  <Button onClick={() => handleViewOnMap(suggestionPlace)} variant="secondary" icon={MapPin}>View on Map</Button>
               </div>
            </div>
         </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-xl font-bold text-deepTeal">Explore by Season</h2>
           <div className="bg-white p-1 rounded-xl border border-stone-200 flex">
             {['summer', 'winter'].map((s) => (
                <button 
                  key={s} 
                  onClick={() => setSeason(s as any)}
                  className={`px-4 py-2 rounded-lg text-sm capitalize font-medium transition-all ${season === s ? 'bg-deepTeal text-white shadow-md' : 'text-gray-500 hover:text-deepTeal'}`}
                >
                  {s}
                </button>
             ))}
           </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
           {currentDestinations.map((place, i) => (
             <div key={i} className="group relative h-64 rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all" onClick={() => navigate(`/destination?q=${place.name}`)}>
               <img src={getPlaceImage(place.name)} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={place.name} />
               <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
               <div className="absolute bottom-4 left-4 text-white">
                 <h3 className="font-bold text-lg">{place.name}</h3>
                 <p className="text-xs text-white/80 flex items-center gap-1"><Sparkles size={10} /> 95% Match</p>
               </div>
             </div>
           ))}
        </div>
      </section>
      
      <section>
        <h2 className="text-xl font-bold text-deepTeal mb-6">Quick Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {[
             { l: 'Itinerary Builder', i: Compass, path: '/itinerary', c: 'bg-orange-100 text-orange-600' },
             { l: 'Find Stays', i: Bed, path: '/stays', c: 'bg-blue-100 text-blue-600' },
             { l: 'Food Spots', i: Utensils, path: '/food', c: 'bg-green-100 text-green-600' },
             { l: 'Travel Routes', i: Signpost, path: '/routes', c: 'bg-purple-100 text-purple-600' },
           ].map((item, i) => (
             <button key={i} onClick={() => navigate(item.path)} className="bg-white p-6 rounded-2xl flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition-all border border-stone-100">
               <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.c}`}>
                 <item.i size={24} />
               </div>
               <span className="font-medium text-gray-700">{item.l}</span>
             </button>
           ))}
        </div>
      </section>
    </div>
  );
};

const DestinationDetails = () => {
  const [data, setData] = useState<Destination | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPacking, setShowPacking] = useState(false);
  const [packingList, setPackingList] = useState<PackingItem[]>([]);
  const query = new URLSearchParams(useLocation().search).get('q') || 'Unknown';
  const navigate = useNavigate();

  useEffect(() => {
    getDestinationInsights(query).then(res => {
      setData(res);
      setLoading(false);
    });
  }, [query]);

  const loadPackingList = async () => {
    setShowPacking(true);
    if (packingList.length === 0) {
      const list = await generatePackingList(query, 'Spring'); 
      setPackingList(list);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><div className="animate-spin text-sage"><Sparkles /></div></div>;

  const weatherColor = data?.weather.condition === 'rainy' 
    ? 'bg-gradient-to-br from-blue-500 to-gray-600' 
    : data?.weather.condition === 'cloudy' 
      ? 'bg-gradient-to-br from-gray-400 to-gray-600'
      : 'bg-gradient-to-br from-orange-400 to-yellow-500';

  return (
    <div className="relative">
      <div className="h-[50vh] relative">
        <img src={getPlaceImage(data?.name || '')} className="w-full h-full object-cover" alt={data?.name} />
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 bg-gradient-to-t from-black/80 to-transparent">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">{data?.name}</h1>
            <div className="flex flex-wrap gap-4 text-white/90">
               <span className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2"><Sparkles size={16}/> {data?.rating} / 5.0</span>
               <span className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2"><Calendar size={16}/> Best Time: {data?.bestTime}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 md:p-12 -mt-10 relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-stone-100">
             <h2 className="text-2xl font-bold text-deepTeal mb-4">About</h2>
             <p className="text-gray-600 leading-relaxed text-lg">{data?.description}</p>
             <div className="flex gap-3 mt-6">
                {data?.tags.map(tag => (
                   <span key={tag} className="px-4 py-2 bg-sage/10 text-sage rounded-full font-medium">#{tag}</span>
                ))}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Button onClick={() => navigate(`/itinerary?destination=${encodeURIComponent(data?.name || '')}`)} icon={Calendar} size="lg" className="w-full justify-center">Build Itinerary</Button>
             <Button onClick={loadPackingList} variant="secondary" icon={Briefcase} size="lg" className="w-full justify-center">Smart Packing List</Button>
          </div>
          
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-stone-100">
             <h3 className="text-xl font-bold text-deepTeal mb-6">User Reviews</h3>
             <div className="space-y-6">
                {[1, 2].map((i) => (
                  <div key={i} className="flex gap-4 border-b border-stone-50 pb-6 last:border-0 last:pb-0">
                    <img src={`https://i.pravatar.cc/150?u=${i+20}`} className="w-12 h-12 rounded-full" alt="User" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-deepTeal">Traveler {i}</h4>
                        <div className="flex text-yellow-400"><Sparkles size={12} fill="currentColor" /></div>
                      </div>
                      <p className="text-gray-600 text-sm">Ideally located and beautiful views. A must visit!</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className={`${weatherColor} text-white p-8 rounded-[32px] shadow-lg relative overflow-hidden transition-all duration-500`}>
              <div className="relative z-10">
                 <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-white/80 font-medium">Current Weather</div>
                      <div className="text-4xl font-bold mt-1">{data?.weather.temp}</div>
                    </div>
                    {data?.weather.condition === 'rainy' ? <CloudRain size={40} /> : <Sun size={40} />}
                 </div>
                 <div className="text-sm bg-white/20 backdrop-blur-md px-3 py-1 rounded-full inline-block capitalize">{data?.weather.condition}</div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
           </div>

           <div className="bg-stone-200 h-64 rounded-[32px] relative overflow-hidden group cursor-pointer border border-stone-100">
              <LeafletMap 
                center={data?.coordinates} 
                places={data?.coordinates ? [{id: 'dest', name: data.name, type: 'Destination', price: '', imageUrl: '', rating: data.rating, coordinates: data.coordinates}] : []}
                zoom={11}
              />
           </div>
        </div>
      </div>

      {showPacking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
           <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col animate-slideUp">
              <div className="p-6 border-b border-stone-100 flex justify-between items-center">
                 <h2 className="text-2xl font-bold text-deepTeal flex items-center gap-2"><Briefcase className="text-sage" /> Smart Pack</h2>
                 <button onClick={() => setShowPacking(false)} className="p-2 hover:bg-stone-100 rounded-full"><X size={24} /></button>
              </div>
              <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                 {packingList.length === 0 ? (
                   <div className="col-span-2 text-center py-12 text-gray-400"><div className="animate-spin inline-block mb-2"><Sparkles /></div><br/>AI is curating your list...</div>
                 ) : (
                   packingList.map((cat, i) => (
                     <div key={i} className="bg-stone-50 p-6 rounded-2xl">
                        <h3 className="font-bold text-deepTeal mb-4 border-b border-stone-200 pb-2">{cat.category}</h3>
                        <ul className="space-y-3">
                           {cat.items.map((item, j) => (
                             <li key={j} className="flex items-center gap-3 text-gray-600">
                               <div className="w-5 h-5 rounded-md border-2 border-stone-300"></div>
                               {item}
                             </li>
                           ))}
                        </ul>
                     </div>
                   ))
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const Stays = () => {
  const [filter, setFilter] = useState('All');
  const [selectedStay, setSelectedStay] = useState<Place | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [staysData, setStaysData] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const initialHotels: Place[] = [
    { 
      id: '1', name: 'Grand View Resort', imageUrl: getPlaceImage('Grand View Resort'), 
      rating: 4.9, price: '$250/night', type: 'Resort', isAiPick: true,
      description: 'Luxury resort with panoramic ocean views and private beach access.',
      amenities: ['Pool', 'Spa', 'Wifi', 'Breakfast'],
      location: 'Maui, USA'
    },
    { 
      id: '2', name: 'City Center Loft', imageUrl: getPlaceImage('City Center Loft'), 
      rating: 4.5, price: '$120/night', type: 'Apartment',
      description: 'Modern loft in the heart of the city, walking distance to museums.',
      amenities: ['Kitchen', 'Wifi', 'Washer'],
      location: 'Paris, France'
    },
    { 
      id: '3', name: 'Cozy Cabin', imageUrl: getPlaceImage('Cozy Cabin'), 
      rating: 4.7, price: '$180/night', type: 'Cabin',
      description: 'Secluded cabin in the woods, perfect for a romantic getaway.',
      amenities: ['Fireplace', 'Hiking', 'Pet Friendly'],
      location: 'Aspen, USA'
    },
    {
      id: '4', name: 'Kyoto Ryokan', imageUrl: getPlaceImage('Kyoto'),
      rating: 4.8, price: '$300/night', type: 'Hotel', 
      description: 'Traditional Japanese inn with tatami rooms and hot springs.',
      amenities: ['Onsen', 'Tea Ceremony', 'Garden'],
      location: 'Kyoto, Japan'
    }
  ];

  useEffect(() => {
    if (!hasSearched) {
      setStaysData(initialHotels);
    }
  }, [hasSearched]);

  const handleSearch = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (!searchQuery.trim()) {
        setHasSearched(false);
        setStaysData(initialHotels);
        return;
      }
      setLoading(true);
      setHasSearched(true);
      try {
        const results = await getStays(searchQuery);
        setStaysData(results);
      } catch (e) {
        console.error("Search failed", e);
      }
      setLoading(false);
    }
  };

  const filteredHotels = staysData.filter(h => {
    const matchesFilter = filter === 'All' ? true : h.type === filter;
    return matchesFilter;
  });

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div className="flex-1 w-full">
          <h1 className="text-3xl font-bold text-deepTeal mb-2">Stays & Hotels</h1>
          <p className="text-gray-500 mb-6">Find the perfect place to rest your head.</p>
          <div className="max-w-md">
             <Input 
                icon={Search} 
                placeholder="Search stays by name or location (e.g. Maui)" 
                value={searchQuery}
                onChange={(e: any) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
             />
          </div>
        </div>
        <div className="hidden md:flex gap-2">
           {['All', 'Hotel', 'Resort', 'Apartment', 'Cabin'].map(f => (
             <button 
               key={f} 
               onClick={() => setFilter(f)}
               className={`px-4 py-2 border rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                 filter === f ? 'bg-deepTeal text-white border-deepTeal' : 'border-stone-200 hover:bg-stone-50'
               }`}
             >
               {f}
             </button>
           ))}
        </div>
      </div>
      
      {loading ? (
         <div className="flex flex-col items-center justify-center py-20 text-sage">
            <div className="animate-spin mb-4"><Sparkles size={32} /></div>
            <p>Finding the best stays for you...</p>
         </div>
      ) : filteredHotels.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {filteredHotels.map(h => (
           <div key={h.id} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all group">
              <div className="h-64 relative">
                 <img src={h.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={h.name} />
                 {h.isAiPick && (
                   <div className="absolute top-4 left-4 bg-sage text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                     <Sparkles size={12} /> AI Pick
                   </div>
                 )}
                 <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-sm font-bold text-deepTeal">
                   {h.price}
                 </div>
              </div>
              <div className="p-6">
                 <div className="flex justify-between items-start mb-2">
                   <div>
                     <div className="text-xs text-gray-400 uppercase tracking-wide font-medium">{h.type}</div>
                     <h3 className="text-xl font-bold text-deepTeal">{h.name}</h3>
                     {h.location && <div className="text-xs text-gray-400 mt-1 flex items-center gap-1"><MapPin size={10}/> {h.location}</div>}
                   </div>
                   <div className="flex items-center gap-1 bg-stone-100 px-2 py-1 rounded-lg text-sm font-bold text-stone-600">
                     <Sparkles size={12} fill="currentColor" className="text-yellow-400" /> {h.rating}
                   </div>
                 </div>
                 <div className="mt-4 flex gap-2">
                   <Button size="sm" className="flex-1" onClick={() => setSelectedStay(h)}>View Details</Button>
                   <Button variant="secondary" size="sm" icon={Heart}></Button>
                 </div>
              </div>
           </div>
         ))}
      </div>
      ) : (
        <div className="text-center py-20 bg-stone-50 rounded-3xl border border-dashed border-stone-200">
          <p className="text-gray-500">No stays found matching your criteria.</p>
        </div>
      )}

      {selectedStay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
           <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden flex flex-col animate-slideUp">
              <div className="h-48 relative">
                 <img src={selectedStay.imageUrl} className="w-full h-full object-cover" alt={selectedStay.name} />
                 <button onClick={() => setSelectedStay(null)} className="absolute top-4 right-4 bg-white/80 p-2 rounded-full hover:bg-white"><X size={20} /></button>
              </div>
              <div className="p-6">
                 <h2 className="text-2xl font-bold text-deepTeal mb-2">{selectedStay.name}</h2>
                 <p className="text-gray-600 mb-4">{selectedStay.description}</p>
                 <div className="flex flex-wrap gap-2 mb-6">
                    {selectedStay.amenities?.map((a: string) => (
                      <span key={a} className="bg-stone-100 text-stone-600 px-3 py-1 rounded-lg text-sm">{a}</span>
                    ))}
                 </div>
                 <Button className="w-full" onClick={() => { setSelectedStay(null); /* Handle booking */ }}>Book Now - {selectedStay.price}</Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const Food = () => {
  const [selectedSpot, setSelectedSpot] = useState<Place | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'city' | 'nearby'>('city');
  const [loading, setLoading] = useState(false);
  const [foodSpots, setFoodSpots] = useState<Place[]>([
    { id: '1', name: 'The Local Bistro', type: 'Italian', price: '$$', rating: 4.8, coordinates: { lat: 48.8566, lng: 2.3522 }, imageUrl: getPlaceImage('The Local Bistro'), description: 'Cozy place for authentic pasta.', location: 'Paris' },
    { id: '2', name: 'Sakura Sushi', type: 'Japanese', price: '$$$', rating: 4.9, coordinates: { lat: 48.8606, lng: 2.3376 }, imageUrl: getPlaceImage('Sakura Sushi'), description: 'Fresh sushi and sashmi.', location: 'Paris' },
    { id: '3', name: 'Le Petit Café', type: 'French', price: '$', rating: 4.5, coordinates: { lat: 48.8530, lng: 2.3499 }, imageUrl: getPlaceImage('Le Petit Café'), description: 'Best coffee and croissants.', location: 'Paris' },
    { id: '4', name: 'Mama\'s Pizza', type: 'Italian', price: '$$', rating: 4.6, coordinates: { lat: 48.8642, lng: 2.3290 }, imageUrl: getPlaceImage("Mama's Pizza"), description: 'Wood fired pizza.', location: 'Paris' }
  ]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      if (searchMode === 'nearby') {
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            const results = await getFoodRecommendations(searchQuery, 'nearby', { lat: latitude, lng: longitude });
            setFoodSpots(results);
            setLoading(false);
          }, (error) => {
             console.error("Geo Error", error);
             alert("Could not get your location. Defaulting to general search.");
             getFoodRecommendations(searchQuery, 'city').then(res => {
                setFoodSpots(res);
                setLoading(false);
             });
          });
        } else {
           alert("Geolocation not supported.");
           setLoading(false);
        }
      } else {
        const results = await getFoodRecommendations(searchQuery, 'city');
        setFoodSpots(results);
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto h-screen flex flex-col md:flex-row gap-6 overflow-hidden">
       {/* List View */}
       <div className="w-full md:w-1/3 flex flex-col h-full overflow-hidden">
          <h1 className="text-3xl font-bold text-deepTeal mb-2 flex-shrink-0">Local Eats</h1>
          <p className="text-gray-500 mb-6 flex-shrink-0">Find the best food spots near you or anywhere.</p>
          
          <div className="mb-6 flex-shrink-0 space-y-3">
             <div className="flex bg-stone-100 p-1 rounded-xl">
               <button 
                 onClick={() => setSearchMode('city')}
                 className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${searchMode === 'city' ? 'bg-white text-deepTeal shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
               >
                 Search by City
               </button>
               <button 
                 onClick={() => setSearchMode('nearby')}
                 className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${searchMode === 'nearby' ? 'bg-white text-sage shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
               >
                 <LocateFixed size={14} /> Near Me
               </button>
             </div>
             <div className="flex gap-2">
               <Input 
                 placeholder={searchMode === 'city' ? "Search for 'Pizza in Paris'" : "Search for 'Sushi'..."}
                 value={searchQuery}
                 onChange={(e: any) => setSearchQuery(e.target.value)}
                 onKeyDown={handleKeyDown}
               />
               <Button onClick={handleSearch} icon={Search} className="px-4" />
             </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-20">
             {loading ? (
               <div className="flex flex-col items-center justify-center py-10 text-sage">
                  <div className="animate-spin mb-2"><Sparkles size={24} /></div>
                  <p className="text-sm">Finding delicious spots...</p>
               </div>
             ) : foodSpots.length > 0 ? (
               foodSpots.map(spot => (
                 <div 
                   key={spot.id} 
                   onClick={() => setSelectedSpot(spot)}
                   className={`bg-white p-4 rounded-2xl shadow-sm border flex gap-4 cursor-pointer transition-colors ${selectedSpot?.id === spot.id ? 'border-sage ring-1 ring-sage bg-sage/5' : 'border-stone-100 hover:border-sage'}`}
                 >
                    <img src={spot.imageUrl} className="w-24 h-24 rounded-xl object-cover" alt={spot.name} />
                    <div className="flex-1">
                       <h3 className="font-bold text-deepTeal">{spot.name}</h3>
                       <p className="text-xs text-gray-500 mb-2">{spot.type} • {spot.price} {spot.location ? `• ${spot.location}` : ''}</p>
                       <p className="text-xs text-gray-400 line-clamp-2">{spot.description}</p>
                       {spot.isAiPick && (
                         <div className="mt-2 flex items-center gap-1 text-xs text-sage font-medium bg-sage/5 w-fit px-2 py-1 rounded-md">
                            <Sparkles size={10} /> AI Recommendation
                         </div>
                       )}
                    </div>
                 </div>
               ))
             ) : (
               <div className="text-center py-10 text-gray-400 border border-dashed border-stone-200 rounded-2xl">
                 No spots found within 5km.
               </div>
             )}
          </div>
       </div>
       
       {/* Map View */}
       <div className="flex-1 bg-stone-200 rounded-[32px] relative overflow-hidden hidden md:block shadow-inner border border-stone-100">
          <LeafletMap 
            places={foodSpots} 
            center={selectedSpot?.coordinates || (foodSpots.length > 0 ? foodSpots[0].coordinates : undefined)} 
            zoom={selectedSpot ? 16 : 13}
          />
       </div>
    </div>
  );
};

const RoutesPage = () => {
  const [fromLocation, setFromLocation] = useState('Paris, France');
  const [toLocation, setToLocation] = useState('Lyon, France');
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  const getAppsForMode = (mode: string, destination: string): string[] => {
    const dest = destination.toLowerCase();
    
    // Country/Region Specific Logic
    if (dest.includes('france') || dest.includes('paris') || dest.includes('lyon')) {
      if (mode === 'train') return ['SNCF Connect', 'Trainline'];
      if (mode === 'bus') return ['FlixBus', 'BlaBlaCar Bus'];
      if (mode === 'car') return ['Uber', 'Bolt', 'BlaBlaCar'];
    }
    
    if (dest.includes('japan') || dest.includes('tokyo') || dest.includes('kyoto') || dest.includes('osaka')) {
      if (mode === 'train') return ['Navitime', 'HyperDia', 'Japan Travel'];
      if (mode === 'bus') return ['Willer Express'];
      if (mode === 'car') return ['JapanTaxi', 'Uber', 'Go Taxi'];
    }

    if (dest.includes('italy') || dest.includes('rome') || dest.includes('milan')) {
      if (mode === 'train') return ['Trenitalia', 'Italo'];
      if (mode === 'bus') return ['FlixBus', 'Itabus'];
      if (mode === 'car') return ['Uber', 'Free Now'];
    }

    if (dest.includes('usa') || dest.includes('america') || dest.includes('new york') || dest.includes('san francisco')) {
        if (mode === 'train') return ['Amtrak'];
        if (mode === 'bus') return ['Greyhound', 'Megabus'];
        if (mode === 'car') return ['Uber', 'Lyft'];
    }

    if (dest.includes('uk') || dest.includes('london')) {
        if (mode === 'train') return ['Trainline', 'National Rail'];
        if (mode === 'bus') return ['National Express', 'Megabus'];
        if (mode === 'car') return ['Uber', 'Bolt', 'Gett'];
    }
    
    // Default Global Apps
    if (mode === 'train') return ['Google Maps', 'Rome2Rio'];
    if (mode === 'bus') return ['BusRadar', 'Rome2Rio'];
    if (mode === 'car') return ['Uber', 'Google Maps'];
    
    return [];
  };

  const routes: RouteOption[] = [
    { 
      id: '1', mode: 'train', duration: '2h 30m', cost: '$45', scenic: true, 
      apps: getAppsForMode('train', toLocation) 
    },
    { 
      id: '2', mode: 'bus', duration: '4h 15m', cost: '$20', scenic: false, 
      apps: getAppsForMode('bus', toLocation) 
    },
    { 
      id: '3', mode: 'car', duration: '2h 10m', cost: '$60', scenic: true, 
      apps: getAppsForMode('car', toLocation) 
    },
  ];

  const selectedRoute = routes.find(r => r.id === selectedRouteId);

  return (
    <div className="p-6 md:p-12 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-deepTeal mb-8">Travel Routes</h1>
      
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-stone-100">
         <div className="flex items-center gap-4 mb-8">
            <div className="flex-1">
               <label className="text-xs text-gray-400 font-bold uppercase block mb-1">From</label>
               <Input 
                 value={fromLocation}
                 onChange={(e: any) => setFromLocation(e.target.value)}
                 className="w-full"
               />
            </div>
            <div className="text-gray-300 pt-6"><ChevronRight /></div>
            <div className="flex-1">
               <label className="text-xs text-gray-400 font-bold uppercase block mb-1">To</label>
               <Input 
                 value={toLocation}
                 onChange={(e: any) => setToLocation(e.target.value)}
                 className="w-full"
               />
            </div>
         </div>

         <div className="space-y-4">
            <h3 className="font-bold text-gray-500 text-sm uppercase tracking-wide mb-4">AI Suggested Options</h3>
            {routes.map((r, i) => (
              <div 
                key={i} 
                onClick={() => setSelectedRouteId(r.id)}
                className={`flex items-center justify-between p-6 rounded-2xl border transition-all cursor-pointer ${
                   selectedRouteId === r.id ? 'border-sage bg-sage/5 ring-1 ring-sage' : 'border-stone-100 hover:border-sage/50 bg-stone-50/50'
                }`}
              >
                 <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${selectedRouteId === r.id ? 'bg-sage text-white' : 'bg-white text-deepTeal'}`}>
                       {r.mode === 'train' && <div className="text-2xl">🚆</div>}
                       {r.mode === 'bus' && <div className="text-2xl">🚌</div>}
                       {r.mode === 'car' && <div className="text-2xl">🚗</div>}
                    </div>
                    <div>
                       <div className="font-bold text-deepTeal capitalize">{r.mode}</div>
                       {r.apps && r.apps.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                           <span className="font-medium">Apps:</span> {r.apps.join(', ')}
                        </div>
                       )}
                       {r.scenic && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium mt-1 inline-block">Scenic Route</span>}
                    </div>
                 </div>
                 <div className="text-right">
                    <div className="font-bold text-xl text-deepTeal">{r.cost}</div>
                    <div className="text-sm text-gray-500">{r.duration}</div>
                 </div>
              </div>
            ))}
         </div>
         
         <div className="mt-8 relative">
           {selectedRoute ? (
              <>
                 <div className="mb-4 flex items-center justify-between px-2">
                    <h3 className="font-bold text-deepTeal flex items-center gap-2">
                       <Map size={18} /> Route Visualization: {selectedRoute.mode.toUpperCase()}
                    </h3>
                    <div className="text-sm text-gray-500">Distance: ~460km</div>
                 </div>
                 <div className="h-64 bg-stone-100 rounded-2xl overflow-hidden relative border border-stone-100">
                    <LeafletMap 
                       route={{
                         from: {lat: 48.8566, lng: 2.3522}, // Paris
                         to: {lat: 45.7640, lng: 4.8357}    // Lyon
                       }} 
                       zoom={6}
                    />
                 </div>
              </>
           ) : (
              <div className="h-24 flex items-center justify-center text-gray-400 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                 Select a route option to see details
              </div>
           )}
         </div>
      </div>
    </div>
  );
};

const ItineraryBuilder = () => {
  const { saveItinerary, updateItinerary, savedItineraries } = useContext(ItineraryContext);
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  // State
  const [loading, setLoading] = useState(false);
  const [builderMode, setBuilderMode] = useState<'ai' | 'manual'>('ai');
  const [destinations, setDestinations] = useState<string[]>(['']);
  const [days, setDays] = useState(3);
  const [tripPlan, setTripPlan] = useState<TripDay[]>([]);
  const [sourceLocation, setSourceLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetCurrency, setBudgetCurrency] = useState('USD');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  
  // Edit / Save state
  const [isEditing, setIsEditing] = useState(false);
  const [savedItineraryId, setSavedItineraryId] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');

  // Initialization
  useEffect(() => {
    const destParam = searchParams.get('destination');
    const loadId = searchParams.get('load');

    if (destParam) {
      setDestinations([destParam]);
    } else if (loadId) {
      const saved = savedItineraries.find(it => it.id === loadId);
      if (saved) {
        setIsEditing(true);
        setSavedItineraryId(saved.id);
        setSaveTitle(saved.title);
        setDestinations(saved.destinations);
        setDays(saved.days);
        if (saved.sourceLocation) setSourceLocation(saved.sourceLocation);
        if (saved.startDate) setStartDate(saved.startDate);
        if (saved.budget) {
            setBudgetAmount(saved.budget.amount.toString());
            setBudgetCurrency(saved.budget.currency);
        }
        if (saved.activities) setSelectedActivities(saved.activities);
        if (saved.notes) setNotes(saved.notes);
        if (saved.schedule) {
            setTripPlan(saved.schedule);
            setBuilderMode('manual'); // Assume manual if loading an existing plan to edit
        }
      }
    }
  }, [savedItineraries]);

  const activityOptions = ['Culture', 'Food', 'Nature', 'Adventure', 'Relax', 'Shopping', 'Nightlife', 'Family Friendly'];

  // Handlers
  const handleAddDestination = () => setDestinations([...destinations, '']);
  const handleRemoveDestination = (index: number) => {
    if (destinations.length > 1) setDestinations(destinations.filter((_, i) => i !== index));
  };
  const handleDestinationChange = (index: number, value: string) => {
    const newDestinations = [...destinations];
    newDestinations[index] = value;
    setDestinations(newDestinations);
  };

  const toggleActivity = (activity: string) => {
    if (selectedActivities.includes(activity)) {
      setSelectedActivities(selectedActivities.filter(a => a !== activity));
    } else {
      setSelectedActivities([...selectedActivities, activity]);
    }
  };

  const handleGenerate = async () => {
    const validDestinations = destinations.filter(d => d.trim() !== '');
    if (validDestinations.length === 0) return;
    
    setLoading(true);
    const config = {
      sourceLocation,
      startDate,
      budget: budgetAmount ? { amount: Number(budgetAmount), currency: budgetCurrency } : undefined,
      notes
    };
    
    const result = await generateItinerary(validDestinations, days, selectedActivities, config);
    setTripPlan(result);
    setLoading(false);
  };
  
  const initiateSave = () => {
      if (!saveTitle) {
          const destStr = destinations.filter(d => d).join(', ') || 'My Trip';
          setSaveTitle(`${days} Days in ${destStr}`);
      }
      setShowSaveModal(true);
  };
  
  const confirmSave = () => {
      const newItinerary: SavedItinerary = {
          id: savedItineraryId || Date.now().toString(),
          title: saveTitle,
          days: tripPlan.length || days,
          type: selectedActivities[0] || 'Custom',
          destinations: destinations.filter(d => d),
          sourceLocation,
          startDate,
          budget: budgetAmount ? { amount: Number(budgetAmount), currency: budgetCurrency } : undefined,
          activities: selectedActivities,
          notes,
          schedule: tripPlan
      };
      
      if (savedItineraryId) {
          updateItinerary(newItinerary);
      } else {
          saveItinerary(newItinerary);
      }
      setShowSaveModal(false);
      navigate('/profile');
  };

  // Manual Builder Helpers
  const addDay = () => setTripPlan([...tripPlan, { day: tripPlan.length + 1, activities: [] }]);
  const removeDay = (index: number) => {
      const newPlan = tripPlan.filter((_, i) => i !== index).map((d, i) => ({...d, day: i + 1}));
      setTripPlan(newPlan);
  };
  
  const addActivity = (dayIndex: number) => {
      const newPlan = [...tripPlan];
      newPlan[dayIndex].activities.push({
          id: Date.now().toString(),
          time: '09:00',
          title: 'New Activity',
          description: '',
          type: 'sightseeing'
      });
      setTripPlan(newPlan);
  };

  const updateActivity = (dayIndex: number, actIndex: number, field: keyof TripActivity, value: string) => {
      const newPlan = [...tripPlan];
      // @ts-ignore
      newPlan[dayIndex].activities[actIndex][field] = value;
      setTripPlan(newPlan);
  };

  const removeActivity = (dayIndex: number, actIndex: number) => {
      const newPlan = [...tripPlan];
      newPlan[dayIndex].activities.splice(actIndex, 1);
      setTripPlan(newPlan);
  };

  return (
    <div className="p-6 md:p-12 max-w-6xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
           <h1 className="text-3xl font-bold text-deepTeal">
             {isEditing ? 'Edit Itinerary' : 'Plan Your Trip'}
           </h1>
           <p className="text-gray-500">Design your perfect journey with AI or build it yourself.</p>
        </div>
        <div className="bg-white p-1 rounded-xl border border-stone-200 flex shadow-sm">
           <button 
             onClick={() => setBuilderMode('ai')}
             className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${builderMode === 'ai' ? 'bg-sage text-white shadow-md' : 'text-gray-500 hover:text-deepTeal'}`}
           >
             <Sparkles size={16} /> AI Generator
           </button>
           <button 
             onClick={() => {
                 setBuilderMode('manual');
                 if (tripPlan.length === 0) addDay();
             }}
             className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${builderMode === 'manual' ? 'bg-deepTeal text-white shadow-md' : 'text-gray-500 hover:text-deepTeal'}`}
           >
             <Edit size={16} /> Manual Builder
           </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Config Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-[24px] shadow-sm border border-stone-100 space-y-5">
             {builderMode === 'ai' ? (
             <>
                 {/* AI Configs */}
                 <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 block">Starting From</label>
                    <div className="flex gap-2">
                       <Input 
                          placeholder="Current Location" 
                          value={sourceLocation}
                          onChange={(e: any) => setSourceLocation(e.target.value)}
                          className="flex-1"
                       />
                       <Button onClick={() => {
                           if (navigator.geolocation) {
                               navigator.geolocation.getCurrentPosition(pos => setSourceLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`));
                           }
                       }} variant="secondary" icon={LocateFixed} className="px-3" />
                    </div>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 block">Destinations</label>
                    {destinations.map((dest, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                         <Input 
                           value={dest} 
                           onChange={(e: any) => handleDestinationChange(index, e.target.value)} 
                           placeholder="e.g. Rome" 
                         />
                         {destinations.length > 1 && (
                           <button onClick={() => handleRemoveDestination(index)} className="text-red-400 hover:text-red-600 p-2">
                             <Minus size={18} />
                           </button>
                         )}
                      </div>
                    ))}
                    <Button onClick={handleAddDestination} variant="secondary" size="sm" className="w-full mt-2 border-dashed" icon={Plus}>
                      Add Destination
                    </Button>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 block">Start Date</label>
                      <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full p-3 bg-white rounded-xl border border-stone-200 focus:outline-none focus:border-sage text-deepTeal"
                      />
                   </div>
                   <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 block">Duration (Days)</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="30" 
                        value={days} 
                        onChange={(e) => setDays(Number(e.target.value))} 
                        className="w-full p-3 bg-white rounded-xl border border-stone-200 focus:outline-none focus:border-sage text-deepTeal"
                      />
                   </div>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 block">Trip Vibe</label>
                    <div className="flex flex-wrap gap-2">
                       {activityOptions.map(opt => (
                         <button
                           key={opt}
                           onClick={() => toggleActivity(opt)}
                           className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                             selectedActivities.includes(opt) 
                               ? 'bg-sage text-white border-sage' 
                               : 'bg-white text-gray-500 border-stone-200 hover:border-sage hover:text-sage'
                           }`}
                         >
                           {opt}
                         </button>
                       ))}
                    </div>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 block">Notes</label>
                    <textarea 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Preferences, allergies..."
                      className="w-full p-4 h-24 bg-white rounded-2xl shadow-sm border border-stone-100 focus:ring-2 focus:ring-sage focus:border-transparent outline-none text-deepTeal placeholder-gray-400 resize-none"
                    />
                 </div>
                 <div className="pt-2">
                    <Button onClick={handleGenerate} className="w-full" icon={Sparkles} size="lg">
                      {isEditing ? 'Re-Generate Plan' : 'Generate Plan'}
                    </Button>
                 </div>
             </>
             ) : (
             <>
                 {/* Manual Configs */}
                 <h3 className="font-bold text-deepTeal text-lg mb-2">Trip Settings</h3>
                 <div>
                   <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Title</label>
                   <Input value={saveTitle} onChange={(e: any) => setSaveTitle(e.target.value)} placeholder="My Awesome Trip" />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Destinations</label>
                    <div className="text-sm text-gray-600 mb-2">{destinations.join(', ')}</div>
                 </div>
                 <div>
                   <Button onClick={addDay} variant="secondary" className="w-full" icon={Plus}>Add Day</Button>
                 </div>
                 <div>
                   <Button onClick={initiateSave} className="w-full" icon={Save}>Save Itinerary</Button>
                 </div>
             </>
             )}
          </div>
        </div>

        {/* Results / Builder Panel */}
        <div className="lg:col-span-2">
           {loading ? (
             <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-[32px] border border-stone-100 border-dashed">
                <div className="animate-spin text-sage mb-4"><Sparkles size={40} /></div>
                <p className="text-gray-500 animate-pulse font-medium">AI is crafting your perfect trip...</p>
             </div>
           ) : (
             <div className="space-y-6">
                {tripPlan.length > 0 && builderMode === 'ai' && (
                   <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-stone-100 shadow-sm">
                      <div className="text-sm font-medium text-gray-500">Generated {tripPlan.length} days</div>
                      <div className="flex gap-2">
                         <Button onClick={() => setBuilderMode('manual')} variant="secondary" size="sm" icon={Edit}>Edit Manually</Button>
                         <Button onClick={initiateSave} size="sm" icon={Save}>Save to Profile</Button>
                      </div>
                   </div>
                )}

                {tripPlan.length > 0 ? (
                  <div className="space-y-8 relative">
                    <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-stone-200"></div>
                    {tripPlan.map((day, dayIndex) => (
                      <div key={day.day} className="relative pl-12">
                         <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-sage text-white flex items-center justify-center font-bold z-10 shadow-md border-4 border-softSand">
                            {day.day}
                         </div>
                         <div className="flex justify-between items-center mb-4 pt-2">
                           <h3 className="font-bold text-gray-400">Day {day.day}</h3>
                           {builderMode === 'manual' && (
                             <button onClick={() => removeDay(dayIndex)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
                           )}
                         </div>
                         
                         <div className="space-y-4">
                            {day.activities.map((act, actIndex) => (
                              <div key={act.id} className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 hover:shadow-md hover:border-sage/30 transition-all group">
                                {builderMode === 'manual' ? (
                                  <div className="space-y-3">
                                     <div className="flex gap-2">
                                        <input 
                                          value={act.time} 
                                          onChange={(e) => updateActivity(dayIndex, actIndex, 'time', e.target.value)}
                                          className="w-20 p-2 border rounded-lg text-sm font-bold text-sage bg-sage/5"
                                        />
                                        <input 
                                          value={act.title} 
                                          onChange={(e) => updateActivity(dayIndex, actIndex, 'title', e.target.value)}
                                          className="flex-1 p-2 border rounded-lg text-sm font-bold text-deepTeal"
                                          placeholder="Activity Title"
                                        />
                                        <button onClick={() => removeActivity(dayIndex, actIndex)} className="text-gray-300 hover:text-red-500"><X size={16} /></button>
                                     </div>
                                     <textarea 
                                        value={act.description}
                                        onChange={(e) => updateActivity(dayIndex, actIndex, 'description', e.target.value)}
                                        className="w-full p-2 border rounded-lg text-sm text-gray-600 resize-none h-20"
                                        placeholder="Description..."
                                     />
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex justify-between items-start mb-2">
                                      <span className="text-xs font-bold text-sage bg-sage/10 px-2 py-1 rounded-lg">{act.time}</span>
                                      <span className="text-[10px] text-gray-400 uppercase tracking-wide border border-stone-200 px-2 py-0.5 rounded-full">{act.type}</span>
                                    </div>
                                    <h4 className="font-bold text-deepTeal text-lg">{act.title}</h4>
                                    <p className="text-sm text-gray-600 mt-1">{act.description}</p>
                                  </>
                                )}
                              </div>
                            ))}
                            {builderMode === 'manual' && (
                              <button 
                                onClick={() => addActivity(dayIndex)}
                                className="w-full py-3 border-2 border-dashed border-stone-200 rounded-xl text-gray-400 hover:border-sage hover:text-sage transition-colors flex items-center justify-center gap-2 font-medium"
                              >
                                <Plus size={18} /> Add Activity
                              </button>
                            )}
                         </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-stone-50 rounded-[32px] border-2 border-dashed border-stone-200 text-gray-400">
                     <Compass size={48} className="mb-4 opacity-50" />
                     <p>Enter details to start planning or build manually.</p>
                  </div>
                )}
             </div>
           )}
        </div>
      </div>

      {showSaveModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
           <div className="bg-white rounded-[32px] w-full max-w-md p-8 animate-slideUp">
              <h2 className="text-2xl font-bold text-deepTeal mb-2">Save Itinerary</h2>
              <p className="text-gray-500 mb-6">Give your trip a name to save it to your profile.</p>
              
              <div className="mb-6">
                 <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 block">Trip Title</label>
                 <Input 
                   value={saveTitle} 
                   onChange={(e: any) => setSaveTitle(e.target.value)}
                   placeholder="e.g. Summer in Rome"
                   autoFocus
                 />
              </div>

              <div className="flex gap-3">
                 <Button onClick={() => setShowSaveModal(false)} variant="secondary" className="flex-1">Cancel</Button>
                 <Button onClick={confirmSave} className="flex-1">Save Trip</Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const Community = () => {
  // Goal B: Community Feed Filters & Goal A: Images
  const [posts, setPosts] = useState<Post[]>([
    {
      id: '1', user: 'Sarah Jen', userAvatar: 'https://i.pravatar.cc/150?u=1', 
      location: 'Santorini, Greece', title: 'Sunset Magic in Oia', imageUrl: getPlaceImage('Santorini, Greece'),
      content: 'Found this hidden spot away from the crowds! The sunset view is unmatched.',
      likes: 243, likedByCurrentUser: false, saved: false,
      aiInsights: "This location is best visited around 6 PM for the sunset view.",
      comments: [],
      createdAt: '2023-10-15T10:00:00Z'
    },
    {
      id: '2', user: 'Mike Chen', userAvatar: 'https://i.pravatar.cc/150?u=2', 
      location: 'Kyoto, Japan', title: 'Bamboo Grove Morning', imageUrl: getPlaceImage('Kyoto, Japan'),
      content: 'Arashiyama Bamboo Grove is magical at 6 AM. Worth waking up early!',
      likes: 892, likedByCurrentUser: true, saved: true,
      comments: [{id: 'c1', user: 'TravelBot', text: 'Great tip!', timestamp: '2h ago'}],
      createdAt: '2023-10-18T08:30:00Z' 
    },
    {
      id: '3', user: 'Elena Rodriguez', userAvatar: 'https://i.pravatar.cc/150?u=3', 
      location: 'Amalfi Coast, Italy', title: 'The Best Pasta', imageUrl: getPlaceImage('Amalfi Coast'),
      content: 'The pasta here is life-changing. Definitely try the lemon delight dessert!',
      likes: 56, likedByCurrentUser: false, saved: false,
      comments: [],
      createdAt: '2023-10-20T19:15:00Z'
    }
  ]);

  const [commentInputs, setCommentInputs] = useState<{[key: string]: string}>({});
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [sortOption, setSortOption] = useState<string>('latest');
  
  // Create Post State
  const [isPostFormOpen, setIsPostFormOpen] = useState(false);
  const [newPost, setNewPost] = useState({
    location: '',
    title: '',
    content: ''
  });

  const handleCreatePost = () => {
    if (!newPost.location || !newPost.content) return;

    const post: Post = {
      id: Date.now().toString(),
      user: 'Alex Traveler',
      userAvatar: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?q=80&w=200', // Current user avatar
      location: newPost.location,
      title: newPost.title,
      imageUrl: getPlaceImage(newPost.location),
      content: newPost.content,
      likes: 0,
      likedByCurrentUser: false,
      saved: false,
      comments: [],
      createdAt: new Date().toISOString()
    };

    setPosts([post, ...posts]);
    setNewPost({ location: '', title: '', content: '' });
    setIsPostFormOpen(false);
  };

  const handleLike = (postId: string) => {
    setPosts(prev => prev.map(p => {
        if (p.id === postId) {
            return {
                ...p,
                likes: p.likedByCurrentUser ? p.likes - 1 : p.likes + 1,
                likedByCurrentUser: !p.likedByCurrentUser
            };
        }
        return p;
    }));
  };

  const toggleComments = (postId: string) => {
      setExpandedComments(prev => {
          const newSet = new Set(prev);
          if (newSet.has(postId)) newSet.delete(postId);
          else newSet.add(postId);
          return newSet;
      });
  };

  const handleAddComment = (postId: string) => {
      const text = commentInputs[postId];
      if (!text?.trim()) return;

      setPosts(prev => prev.map(p => {
          if (p.id === postId) {
              return {
                  ...p,
                  comments: [
                      ...p.comments,
                      {
                          id: Date.now().toString(),
                          user: 'Alex Traveler',
                          text: text,
                          timestamp: 'Just now'
                      }
                  ]
              };
          }
          return p;
      }));
      setCommentInputs(prev => ({...prev, [postId]: ''}));
  };

  // Sorting Logic
  const sortedPosts = [...posts].sort((a, b) => {
    if (sortOption === 'latest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortOption === 'popular') {
      return b.likes - a.likes;
    }
    return 0;
  });

  return (
    <div className="p-6 md:p-12 max-w-4xl mx-auto mb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-deepTeal">Community</h1>
          <p className="text-gray-500">Share your journey and get inspired.</p>
        </div>
        <Button onClick={() => setIsPostFormOpen(!isPostFormOpen)} icon={Plus}>
           {isPostFormOpen ? 'Cancel Post' : 'New Post'}
        </Button>
      </div>

      {isPostFormOpen && (
        <div className="bg-white rounded-3xl p-6 shadow-md border border-stone-100 mb-8 animate-slideUp">
           <h2 className="text-lg font-bold text-deepTeal mb-4">Create a New Post</h2>
           <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Destination / Place</label>
                <Input 
                   value={newPost.location} 
                   onChange={(e: any) => setNewPost({...newPost, location: e.target.value})}
                   placeholder="e.g. Paris, France"
                   icon={MapPin}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Title (Optional)</label>
                <Input 
                   value={newPost.title} 
                   onChange={(e: any) => setNewPost({...newPost, title: e.target.value})}
                   placeholder="e.g. Best Croissant Ever"
                />
              </div>
              <div>
                 <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Your Experience</label>
                 <textarea 
                   className="w-full p-4 bg-white rounded-2xl shadow-sm border border-stone-100 focus:ring-2 focus:ring-sage focus:border-transparent outline-none text-deepTeal placeholder-gray-400 resize-none h-32"
                   placeholder="Share your travel story, tips, or review..."
                   value={newPost.content}
                   onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                 />
              </div>
              <div className="flex justify-end pt-2">
                 <Button onClick={handleCreatePost} icon={Send} disabled={!newPost.location || !newPost.content}>
                   Post to Community
                 </Button>
              </div>
           </div>
        </div>
      )}

      <div className="flex gap-4 mb-6 overflow-x-auto pb-2 no-scrollbar">
         <button onClick={() => setSortOption('latest')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${sortOption === 'latest' ? 'bg-deepTeal text-white' : 'bg-white text-gray-500'}`}>Latest</button>
         <button onClick={() => setSortOption('popular')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${sortOption === 'popular' ? 'bg-deepTeal text-white' : 'bg-white text-gray-500'}`}>Popular</button>
      </div>

      <div className="space-y-6">
        {sortedPosts.map(post => (
          <div key={post.id} className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100">
             <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-3">
                 <img src={post.userAvatar} className="w-10 h-10 rounded-full" alt={post.user} />
                 <div>
                   <h4 className="font-bold text-deepTeal">{post.user}</h4>
                   <p className="text-xs text-gray-400">{post.location}</p>
                 </div>
               </div>
               <button className="text-gray-400 hover:text-deepTeal"><Share2 size={20} /></button>
             </div>
             
             {post.title && <h3 className="font-bold text-lg text-deepTeal mb-2">{post.title}</h3>}
             <p className="text-gray-700 mb-4 leading-relaxed">{post.content}</p>
             
             {post.imageUrl && (
               <div className="mb-4 rounded-2xl overflow-hidden h-64 relative">
                 <img src={post.imageUrl} className="w-full h-full object-cover" alt="Post" />
                 {post.aiInsights && (
                   <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-xl text-sm flex gap-2 items-start">
                      <Sparkles size={16} className="text-sage shrink-0 mt-0.5" />
                      <span className="text-deepTeal">{post.aiInsights}</span>
                   </div>
                 )}
               </div>
             )}

             <div className="flex items-center gap-6 pt-2 border-t border-stone-50">
                <button 
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${post.likedByCurrentUser ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                >
                  <Heart size={20} fill={post.likedByCurrentUser ? "currentColor" : "none"} /> {post.likes}
                </button>
                <button 
                  onClick={() => toggleComments(post.id)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-deepTeal transition-colors"
                >
                  <MessageCircle size={20} /> {post.comments.length}
                </button>
             </div>

             {/* Comments Section */}
             {expandedComments.has(post.id) && (
                 <div className="mt-4 pt-4 border-t border-stone-50 animate-slideUp">
                    <div className="space-y-4 mb-4">
                        {post.comments.length > 0 ? (
                            post.comments.map(comment => (
                                <div key={comment.id} className="flex gap-3">
                                   <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-xs font-bold text-gray-500">
                                      {comment.user.charAt(0)}
                                   </div>
                                   <div className="flex-1 bg-stone-50 p-3 rounded-2xl rounded-tl-sm">
                                      <div className="flex justify-between items-baseline mb-1">
                                         <span className="text-xs font-bold text-deepTeal">{comment.user}</span>
                                         <span className="text-[10px] text-gray-400">{comment.timestamp}</span>
                                      </div>
                                      <p className="text-sm text-gray-600">{comment.text}</p>
                                   </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-sm text-gray-400 py-2">No comments yet. Be the first!</p>
                        )}
                    </div>
                    
                    <div className="flex gap-2">
                        <Input 
                           value={commentInputs[post.id] || ''}
                           onChange={(e: any) => setCommentInputs({...commentInputs, [post.id]: e.target.value})}
                           placeholder="Write a comment..."
                           className="flex-1"
                           onKeyDown={(e: any) => e.key === 'Enter' && handleAddComment(post.id)}
                        />
                        <button 
                          onClick={() => handleAddComment(post.id)}
                          disabled={!commentInputs[post.id]?.trim()}
                          className="bg-deepTeal text-white p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-90"
                        >
                           <Send size={18} />
                        </button>
                    </div>
                 </div>
             )}
          </div>
        ))}
      </div>
    </div>
  );
};

const Profile = () => {
  const { savedItineraries } = useContext(ItineraryContext);
  const [selectedItinerary, setSelectedItinerary] = useState<SavedItinerary | null>(null);
  const navigate = useNavigate();

  const user = {
    name: "Alex Traveler",
    bio: "Adventure Seeker • Foodie • Photographer",
    stats: { trips: savedItineraries.length, reviews: 48, followers: "2.4k" },
    avatar: "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?q=80&w=200"
  };

  const preferences = [
    { label: 'Travel Style', value: 'Adventure' },
    { label: 'Budget', value: 'Mid-Range' },
    { label: 'Dietary', value: 'Vegetarian' },
  ];

  const handleEdit = (itinerary: SavedItinerary) => {
    navigate(`/itinerary?load=${itinerary.id}`);
  };

  return (
    <div className="p-6 md:p-12 max-w-6xl mx-auto mb-20">
      {/* Profile Header Card */}
      <div className="bg-white rounded-[32px] shadow-sm border border-stone-100 overflow-hidden mb-8 p-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-stone-100 shadow-sm">
                 <img src={user.avatar} className="w-full h-full object-cover" alt="Profile" />
              </div>
              <div className="text-center md:text-left">
                 <h1 className="text-3xl font-bold text-deepTeal">{user.name}</h1>
                 <p className="text-gray-500 font-medium">{user.bio}</p>
              </div>
           </div>
           <div className="flex gap-8 w-full md:w-auto justify-center">
              <div className="text-center">
                 <div className="font-bold text-xl text-deepTeal">{user.stats.trips}</div>
                 <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Trips</div>
              </div>
              <div className="text-center">
                 <div className="font-bold text-xl text-deepTeal">{user.stats.reviews}</div>
                 <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Reviews</div>
              </div>
              <div className="text-center">
                 <div className="font-bold text-xl text-deepTeal">{user.stats.followers}</div>
                 <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Followers</div>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         {/* Saved Itineraries */}
         <div>
            <h2 className="text-xl font-bold text-deepTeal mb-6">Saved Itineraries</h2>
            <div className="space-y-4">
               {savedItineraries.length === 0 ? (
                 <div className="text-gray-400 text-center py-8 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                   No saved trips yet.
                 </div>
               ) : (
                savedItineraries.map(itinerary => (
                 <div 
                   key={itinerary.id} 
                   onClick={() => setSelectedItinerary(itinerary)}
                   className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-4 group"
                 >
                    <div className="w-16 h-16 rounded-xl bg-stone-200 overflow-hidden flex-shrink-0">
                       <img src={getPlaceImage(itinerary.destinations[0])} className="w-full h-full object-cover" alt={itinerary.title} />
                    </div>
                    <div className="flex-1">
                       <h3 className="font-bold text-deepTeal group-hover:text-sage transition-colors">{itinerary.title}</h3>
                       <p className="text-xs text-gray-500">{itinerary.days} Days • {itinerary.type}</p>
                    </div>
                    <ChevronRight className="text-gray-300 group-hover:text-sage" />
                 </div>
               )))}
            </div>
         </div>

         {/* Preferences */}
         <div>
            <h2 className="text-xl font-bold text-deepTeal mb-6">Preferences</h2>
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
               {preferences.map((pref, i) => (
                 <div key={i} className="flex justify-between items-center p-5 border-b border-stone-100 last:border-0">
                    <span className="text-gray-500 font-medium">{pref.label}</span>
                    <span className="text-deepTeal font-bold">{pref.value}</span>
                 </div>
               ))}
            </div>
         </div>
      </div>

      {/* Itinerary Popup */}
      {selectedItinerary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           {/* Backdrop */}
           <div 
             className="absolute inset-0 bg-stone-900/40 backdrop-blur-md transition-opacity"
             onClick={() => setSelectedItinerary(null)}
           ></div>
           
           {/* Modal Content */}
           <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[85vh] shadow-2xl relative z-10 flex flex-col overflow-hidden animate-slideUp">
              {/* Header */}
              <div className="h-40 relative flex-shrink-0">
                 <img src={getPlaceImage(selectedItinerary.destinations[0])} className="w-full h-full object-cover" alt="Cover" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                 <button 
                   onClick={() => setSelectedItinerary(null)} 
                   className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-md transition-all"
                 >
                   <X size={20} />
                 </button>
                 <div className="absolute bottom-6 left-6 text-white">
                    <h2 className="text-3xl font-bold">{selectedItinerary.title}</h2>
                    <p className="opacity-90">{selectedItinerary.days} Days • {selectedItinerary.type}</p>
                 </div>
              </div>

              {/* Body */}
              <div className="p-8 overflow-y-auto">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-deepTeal text-lg">Itinerary Overview</h3>
                    <Button 
                      size="sm" 
                      icon={Edit} 
                      onClick={() => handleEdit(selectedItinerary)}
                    >
                      Edit Itinerary
                    </Button>
                 </div>

                 <div className="space-y-6 relative border-l-2 border-stone-100 ml-3 pl-8 py-2">
                    {selectedItinerary.schedule && selectedItinerary.schedule.length > 0 ? (
                      selectedItinerary.schedule.map((day) => (
                        <div key={day.day} className="relative">
                          <div className="absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-sage text-white text-xs flex items-center justify-center font-bold border-2 border-white shadow-sm">
                            {day.day}
                          </div>
                          <h4 className="font-bold text-gray-800 mb-2">Day {day.day}</h4>
                          <div className="space-y-3">
                             {day.activities.map(act => (
                               <div key={act.id} className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Clock size={14} className="text-sage"/> <span className="text-xs font-bold text-gray-500">{act.time}</span>
                                    <span className="text-[10px] uppercase border border-stone-200 px-1 rounded text-gray-400">{act.type}</span>
                                  </div>
                                  <div className="font-bold text-deepTeal">{act.title}</div>
                                  <div className="text-xs text-gray-500">{act.description}</div>
                               </div>
                             ))}
                             {day.activities.length === 0 && <div className="text-xs text-gray-400 italic">No activities planned.</div>}
                          </div>
                        </div>
                      ))
                    ) : (
                       // Fallback for legacy items without schedule
                       [...Array(selectedItinerary.days)].map((_, i) => (
                          <div key={i} className="relative">
                             <div className="absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-sage text-white text-xs flex items-center justify-center font-bold border-2 border-white shadow-sm">
                               {i + 1}
                             </div>
                             <h4 className="font-bold text-gray-800 mb-2">Day {i + 1}: Exploration</h4>
                             <p className="text-gray-500 text-sm leading-relaxed">
                               Overview not available for legacy itinerary. Click Edit to build the details.
                             </p>
                          </div>
                       ))
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const App = () => {
  const [savedItineraries, setSavedItineraries] = useState<SavedItinerary[]>(MOCK_SAVED_ITINERARIES);

  const saveItinerary = (itinerary: SavedItinerary) => {
    setSavedItineraries(prev => [itinerary, ...prev]);
  };

  const updateItinerary = (updated: SavedItinerary) => {
    setSavedItineraries(prev => prev.map(it => it.id === updated.id ? updated : it));
  };

  const deleteItinerary = (id: string) => {
    setSavedItineraries(prev => prev.filter(it => it.id !== id));
  };

  return (
    <ItineraryContext.Provider value={{ savedItineraries, saveItinerary, deleteItinerary, updateItinerary }}>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route element={<Layout />}>
             <Route path="/home" element={<Home />} />
             <Route path="/destination" element={<DestinationDetails />} />
             <Route path="/stays" element={<Stays />} />
             <Route path="/food" element={<Food />} />
             <Route path="/routes" element={<RoutesPage />} />
             <Route path="/itinerary" element={<ItineraryBuilder />} />
             <Route path="/community" element={<Community />} />
             <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>
      </HashRouter>
    </ItineraryContext.Provider>
  );
};

export default App;
