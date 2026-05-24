// ===============================
// Destination → Image Mapping
// ===============================

// All keys are lowercase & simplified for easier matching
export const destinationImages: Record<string, string> = {
  // --- Destinations ---
  "japan": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800",
  "kyoto": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800",

  "santorini": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=800",
  "santorini greece": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=800",

  "bali indonesia": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=800",

  "amalfi coast": "https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=800",
  "amalfi coast italy": "https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=800",

  "maui": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800",
  "maui usa": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800",

  "swiss alps": "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=800",
  "aspen": "https://images.unsplash.com/photo-1614444894791-c0c4d4286c35?q=80&w=800",
  "reykjavik": "https://images.unsplash.com/photo-1476610182048-b716b8518aae?q=80&w=800",
  "tokyo": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=800",
  "rome": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=800",

  "paris": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800",
  "paris france": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800",

  "lyon": "https://images.unsplash.com/photo-1569087306794-db9947393580?q=80&w=800",

  // --- Stays ---
  "grand view resort": "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=800",
  "city center loft": "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800",
  "cozy cabin": "https://images.unsplash.com/photo-1631630259742-c0f0b17c6c10?q=80&w=800",

  // --- Food ---
  "the local bistro": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800",
  "sakura sushi": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=800",
  "le petit café": "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?q=80&w=800",
  "mama's pizza": "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?q=80&w=800",
};

// Default fallback image (generic travel picture)
export const defaultDestinationImage =
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800";


// ===============================
// Normalization Helper
// ===============================

/**
 * Normalizes strings:
 * - lowercase
 * - removes commas, extra symbols
 * - trims spaces
 */
const normalize = (str: string) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ") // remove commas, accents, symbols
    .trim();


// ===============================
// Main Lookup Function
// ===============================

export const getPlaceImage = (name: string): string => {
  if (!name) return defaultDestinationImage;

  const normalizedName = normalize(name);

  // 1. Exact match
  if (destinationImages[normalizedName]) {
    return destinationImages[normalizedName];
  }

  // 2. Partial match
  const keys = Object.keys(destinationImages);
  const matchedKey = keys.find((key) => {
    const normalizedKey = normalize(key);
    return (
      normalizedKey === normalizedName ||
      normalizedKey.includes(normalizedName) ||
      normalizedName.includes(normalizedKey)
    );
  });

  if (matchedKey) return destinationImages[matchedKey];

  // 3. Fallback
  return defaultDestinationImage;
};
