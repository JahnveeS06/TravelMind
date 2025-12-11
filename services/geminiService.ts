
import { GoogleGenAI, Type } from "@google/genai";
import { Destination, TripDay, PackingItem, Place } from "../types";

const apiKey = import.meta.env.VITE_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to calculate distance between two coordinates in km
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export const getDestinationInsights = async (query: string): Promise<Destination> => {
  if (!apiKey) {
    // Mock return
    return {
      name: query,
      description: "A beautiful location with rich history and vibrant culture.",
      imageUrl: `https://picsum.photos/800/600?random=${Math.random()}`,
      rating: 4.8,
      tags: ["History", "Culture", "Food"],
      bestTime: "Spring/Autumn",
      weather: { condition: 'sunny', temp: '24°C' },
      coordinates: { lat: 48.8566, lng: 2.3522 } // Default to Paris for mock
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a brief travel overview for ${query}. Include description, best time to visit, current typical weather, 3 distinct tags, and approximate latitude/longitude coordinates.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            bestTime: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            rating: { type: Type.NUMBER },
            weather: { 
              type: Type.OBJECT, 
              properties: {
                condition: { type: Type.STRING, enum: ['sunny', 'cloudy', 'rainy'] },
                temp: { type: Type.STRING }
              }
            },
            coordinates: {
              type: Type.OBJECT,
              properties: {
                lat: { type: Type.NUMBER },
                lng: { type: Type.NUMBER }
              }
            }
          },
          required: ["name", "description", "bestTime", "tags", "rating", "weather"]
        }
      }
    });
    
    const data = JSON.parse(response.text || '{}');
    return {
      ...data,
      imageUrl: `https://picsum.photos/800/600?random=${Math.random()}`
    };
  } catch (error) {
    console.error("AI Error:", error);
    return {
      name: query,
      description: "Could not load AI insights.",
      imageUrl: "https://picsum.photos/800/600",
      rating: 4.5,
      tags: [],
      bestTime: "-",
      weather: { condition: 'sunny', temp: '--' },
      coordinates: { lat: 48.8566, lng: 2.3522 }
    };
  }
};

export const generatePackingList = async (destination: string, season: string): Promise<PackingItem[]> => {
  if (!apiKey) return [
    { category: "Clothing", items: ["T-shirts", "Jeans", "Jacket"] },
    { category: "Essentials", items: ["Passport", "Charger", "Toiletries"] }
  ];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Suggest a packing list for ${destination} in ${season}. Group by category.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              items: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (e) {
    return [];
  }
};

export const generateItinerary = async (
  destinations: string[], 
  days: number, 
  interests: string[],
  config?: {
    sourceLocation?: string;
    startDate?: string;
    budget?: { amount: number; currency: string };
    notes?: string;
  }
): Promise<TripDay[]> => {
  if (!apiKey) return [];

  const destinationStr = destinations.join(' and ');
  let prompt = `Create a ${days}-day itinerary for a trip to ${destinationStr}.`;
  
  if (config?.sourceLocation) prompt += ` The trip starts from ${config.sourceLocation}.`;
  if (config?.startDate) prompt += ` The trip starts on ${config.startDate}.`;
  if (config?.budget) prompt += ` The total budget is ${config.budget.currency} ${config.budget.amount}.`;
  if (interests.length > 0) prompt += ` Focus on these interests: ${interests.join(', ')}.`;
  if (config?.notes) prompt += ` Additional notes/preferences: ${config.notes}.`;
  
  prompt += ` Split the days across the destinations logically. Include specific activity timings.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.INTEGER },
              activities: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    time: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['food', 'sightseeing', 'relax', 'adventure'] },
                    location: { type: Type.STRING }
                  },
                  required: ["time", "title", "description", "type"]
                }
              }
            },
            required: ["day", "activities"]
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Itinerary Gen Error:", error);
    return [];
  }
};

export const getStays = async (location: string): Promise<Place[]> => {
  if (!location) return [];

  if (!apiKey) {
    return [
      {
        id: 'mock-1', name: `Grand Hotel ${location}`, imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800',
        rating: 4.8, price: '$200/night', type: 'Resort',
        description: `A lovely stay in the heart of ${location}.`,
        amenities: ['Wifi', 'Pool', 'Spa'], location: location,
        coordinates: { lat: 48.85, lng: 2.35 },
        isAiPick: false
      },
      {
        id: 'mock-2', name: `${location} Boutique Stay`, imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=800',
        rating: 4.5, price: '$150/night', type: 'Apartment',
        description: `Charming boutique hotel in ${location}.`,
        amenities: ['Breakfast', 'Wifi'], location: location,
        coordinates: { lat: 48.86, lng: 2.36 },
        isAiPick: false
      },
      {
        id: 'mock-3', name: `The ${location} Inn`, imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=800',
        rating: 4.2, price: '$90/night', type: 'Cabin',
        description: `Budget friendly inn near ${location} center.`,
        amenities: ['Wifi'], location: location,
        coordinates: { lat: 48.84, lng: 2.34 },
        isAiPick: false
      }
    ];
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Find 3 distinct places to stay in ${location}. Include a mix of luxury, boutique, and budget options. Classify each as strictly one of these types: 'Hotel', 'Resort', 'Apartment', or 'Cabin'. Provide real or realistic names, prices, and descriptions.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              rating: { type: Type.NUMBER },
              price: { type: Type.STRING },
              type: { type: Type.STRING, enum: ['Hotel', 'Resort', 'Apartment', 'Cabin'] },
              amenities: { type: Type.ARRAY, items: { type: Type.STRING } },
              location: { type: Type.STRING },
              coordinates: {
                  type: Type.OBJECT,
                  properties: { lat: { type: Type.NUMBER }, lng: { type: Type.NUMBER } }
              }
            },
            required: ["name", "description", "rating", "price", "type", "amenities", "location"]
          }
        }
      }
    });
    
    const rawStays = JSON.parse(response.text || '[]');
    return rawStays.map((stay: any, index: number) => ({
        ...stay,
        id: `ai-${Date.now()}-${index}`,
        imageUrl: `https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&random=${index}`, // Generic hotel image
        isAiPick: true
    }));
  } catch (e) {
      console.error(e);
      return [];
  }
};

export const getFoodRecommendations = async (query: string, searchType: 'city' | 'nearby', userLocation?: {lat: number, lng: number}): Promise<Place[]> => {
  if (!apiKey) {
    // Mock Data based on input
    const mockType = searchType === 'nearby' ? "Near You" : query;
    return [
      { id: 'f1', name: `Best ${query} Spot`, type: 'Restaurant', price: '$$', rating: 4.8, coordinates: userLocation || { lat: 48.8566, lng: 2.3522 }, imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800', description: `Top rated for ${query}`, location: searchType === 'nearby' ? '1.2 km away' : 'Paris' },
      { id: 'f2', name: `${mockType} Eats`, type: 'Bistro', price: '$$$', rating: 4.5, coordinates: userLocation ? {lat: userLocation.lat + 0.01, lng: userLocation.lng + 0.01} : { lat: 48.8606, lng: 2.3376 }, imageUrl: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?q=80&w=800', description: `Famous local favorite`, location: searchType === 'nearby' ? '0.8 km away' : 'Paris' },
    ];
  }

  let prompt = "";
  if (searchType === 'nearby' && userLocation) {
    prompt = `I am at latitude ${userLocation.lat}, longitude ${userLocation.lng}. Suggest 4 excellent food spots strictly within a 5km radius of this location that serve '${query}'. Provide realistic names, cuisines, and coordinates. ensure the coordinates are numerically close to the provided latitude/longitude.`;
  } else {
    prompt = `Find 4 popular food spots in '${query}'. This could be a city (like "Paris") or a neighborhood. If the query implies a specific food (like "Pizza in NYC"), respect that. Provide realistic names, cuisine types, ratings, and coordinates.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              type: { type: Type.STRING, description: "Cuisine or Restaurant Type" },
              price: { type: Type.STRING },
              rating: { type: Type.NUMBER },
              description: { type: Type.STRING },
              coordinates: {
                  type: Type.OBJECT,
                  properties: { lat: { type: Type.NUMBER }, lng: { type: Type.NUMBER } }
              }
            },
            required: ["name", "type", "price", "rating", "description", "coordinates"]
          }
        }
      }
    });

    const rawData = JSON.parse(response.text || '[]');
    let places = rawData.map((place: any, index: number) => ({
      ...place,
      id: `food-${Date.now()}-${index}`,
      imageUrl: `https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&random=${index}`,
      isAiPick: true
    }));

    if (searchType === 'nearby' && userLocation) {
      places = places.map((place: Place) => {
        if (place.coordinates) {
          const dist = getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, place.coordinates.lat, place.coordinates.lng);
          return { ...place, distanceVal: dist, location: `${dist.toFixed(1)} km away` };
        }
        return place;
      }).filter((place: any) => place.distanceVal !== undefined && place.distanceVal <= 5);
    }

    return places;
  } catch (error) {
    console.error("Food Gen Error:", error);
    return [];
  }
};

export const chatWithAI = async (message: string, context?: string): Promise<string> => {
  if (!apiKey) return "I can help you plan your trip! Please configure your API key.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are TravelMind, a helpful travel assistant. Context: ${context || 'General travel help'}. User: ${message}`,
      config: {
        systemInstruction: "Keep responses concise, friendly, and helpful for travelers."
      }
    });
    return response.text || "I'm having trouble connecting to the travel network right now.";
  } catch (error) {
    return "Sorry, I encountered an error.";
  }
};
