# TravelMind – Smart Travel Planner

TravelMind is a smart travel planning web app built with React + TypeScript.  
It helps users:

- Discover places
- Generate AI-based itineraries
- Plan routes, stays, and food
- Share and explore community travel posts

All in one clean, interactive interface.

---

## Key Features

### Home

- **Daily AI suggestion** for a destination, with details and map link.
- **Explore by season**: curated summer/winter destinations with images relevant to each place.
- Location-based content with improved image accuracy so cards visually match the mentioned locations.

---

### Itinerary Builder

- **Create New Itinerary**
  - Current Location / Source location (with an option to use your current location).
  - One or more Destinations.
  - Trip Dates / Duration.
  - **Budget** (amount + currency) used by the AI to generate a cost-aware plan.
  - **Activities / Trip Purpose** (multi-select — e.g. adventure, food, culture, sightseeing, shopping, nature, relaxation).
  - **Notes** – extra details or preferences for the AI (e.g. mobility issues, must-visit landmarks, strict veg food, etc.).

- **Edit Existing Itinerary**
  - Open a saved itinerary with all fields pre-filled.
  - Edit any detail (current location, destinations, budget, dates, activities, notes).
  - Save changes and regenerate a new AI-powered plan.

- **AI-Generated Plan**
  - Uses destination(s), current location, budget, selected activities, and notes to build a personalized day-by-day itinerary.

---

### Routes

- Editable **From** and **To** fields at the top (source & destination).
- Route options per mode of transport (e.g. Train, Bus, Car, etc.) with:
  - Cost and duration.
  - **Popular travel apps** used in that destination’s country for each mode  
    (e.g. Train → SNCF/Trainline in France, Bus → FlixBus, Taxi → Uber/Bolt, etc.).
- Route visual/summary that adapts to the itinerary’s chosen destination(s) and current location where applicable.

---

### Stays

- List of stays/hotels/accommodation related to the selected destination.
- Buttons/cards to view more details (implementation may vary).
- Prepared for future filtering (by price, rating, type) and potential budget-aware suggestions.

---

### Food

- Destination-based restaurant and café suggestions.
- **Food-based search**:
  - Search by a dish or cuisine (e.g. “sushi”, “pizza”, “ramen”).
  - Shows top restaurants/cafes in the selected destination where that food is available.
- Integrates location and food preferences to help users find relevant places to eat.

---

### Community

- **Community feed** of travel posts (reviews, photos, experiences).
- Users can:
  - **Create posts** (destination, optional title, review/experience).
  - See their post immediately added to the feed.
  - **Like** and **comment** on posts (including their own).
- Works with existing filters/sorting (e.g. Latest / Most Popular) and image logic so new posts behave like the original seeded ones.

---

### Profile & Saved Itineraries

- View previously saved itineraries.
- Each itinerary card can show:
  - Destination, days, type, budget, and possibly an image matching the main destination.
- Open a saved itinerary to:
  - Review the plan.
  - Edit it in the Itinerary Builder.

---

## Tech Stack

- **Frontend:** React + TypeScript
- **Styling:** Tailwind CSS (or CSS utility classes, depending on your setup)
- **Routing:** React Router
- **State:** React hooks (`useState`, `useEffect`, `useContext`)
- **AI / Itinerary Generation:** Integrated with an AI API (e.g. OpenAI/Gemini – configured via environment variables)
- **Build Tools:** Vite / CRA (adjust this section to match your setup)

---

## Getting Started

### 1. Prerequisites

- **Node.js** (v16+ recommended; v18+ preferred)
- **npm** or **yarn**

### 2. Install Dependencies

```bash
# using npm
npm install

# or using yarn
yarn install
