
// Centralized mapping for all place-related images in the app
export const destinationImages: Record<string, string> = {
  // --- Destinations (Home, Itineraries, Profile) ---
  "Kyoto, Japan": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800",
  "Kyoto": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800",
  "Santorini": "https://images.unsplash.com/photo-1613395877344-13d4c79e4284?q=80&w=800",
  "Santorini, Greece": "https://images.unsplash.com/photo-1613395877344-13d4c79e4284?q=80&w=800",
  "Bali": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=800",
  "Bali, Indonesia": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=800",
  "Amalfi Coast": "https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=800",
  "Amalfi Coast, Italy": "https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=800",
  "Maui": "https://images.unsplash.com/photo-1542259548-648243983a5e?q=80&w=800",
  "Maui, USA": "https://images.unsplash.com/photo-1542259548-648243983a5e?q=80&w=800",
  "Swiss Alps": "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=800",
  "Aspen": "https://images.unsplash.com/photo-1585324527961-7509d3b0e3f5?q=80&w=800",
  "Reykjavik": "https://images.unsplash.com/photo-1476610182048-b716b8518aae?q=80&w=800",
  "Tokyo": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=800",
  "Tokyo, Japan": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=800",
  "Rome": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=800",
  "Paris, France": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800",
  "Paris": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800",
  "Lyon, France": "https://images.unsplash.com/photo-1605650170068-d0554c0e625a?q=80&w=800",
  "Lyon": "https://images.unsplash.com/photo-1605650170068-d0554c0e625a?q=80&w=800",

  // --- Stays ---
  "Grand View Resort": "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=800",
  "City Center Loft": "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800",
  "Cozy Cabin": "https://images.unsplash.com/photo-1449156493391-d2cfa28e468b?q=80&w=800",

  // --- Food ---
  "The Local Bistro": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800",
  "Sakura Sushi": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=800",
  "Le Petit Café": "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?q=80&w=800",
  "Mama's Pizza": "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?q=80&w=800",
};

export const defaultDestinationImage = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800"; // Generic travel

// Helper to get image safely
export const getPlaceImage = (name: string): string => {
  if (!name) return defaultDestinationImage;
  
  // 1. Direct match
  if (destinationImages[name]) return destinationImages[name];

  // 2. Partial match (e.g., "Paris" matches "Paris, France")
  const keys = Object.keys(destinationImages);
  const foundKey = keys.find(key => 
    key.toLowerCase() === name.toLowerCase() || 
    key.toLowerCase().includes(name.toLowerCase()) || 
    name.toLowerCase().includes(key.toLowerCase())
  );
  
  if (foundKey) return destinationImages[foundKey];

  // 3. Fallback
  return defaultDestinationImage;
};
