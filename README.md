# SafeHerRoute 🛡️

**SafeHerRoute** is a web-based safety mapping application designed to empower women with real-time road safety information. It focuses on providing safety ratings, community-driven alerts, and safe navigation options for roads in Vijayawada.

## 🌟 Features

*   **Interactive Safety Map**: Visualizes roads with safety ratings (Green: Very Safe, Orange: Moderate, Red: Unsafe).
*   **📍 Live Geolocation**: Instantly center the map on your customized location to find safe routes nearby.
*   **⚠️ Community Alerts**:
    *   **Report Issues**: Users can report hazards like poor lighting, harassment, or accidents.
    *   **Real-time Updates**: View recent alerts reported by others directly on the map popup.
*   **🗺️ Navigation**: Integrated "Get Directions" button to easily navigate to safe roads using Google Maps.
*   **Detailed Road Insights**: View ratings for day vs. night, street light availability, and population density.

## 🛠️ Technologies Used

-   **Frontend**: HTML5, CSS3 (Custom Gradient UI), JavaScript (ES6+), MapLibre GL JS (for maps).
-   **Backend**: Node.js, Express.js.
-   **Database**: MongoDB (Mongoose) for storing ratings and alerts.
-   **API**: RESTful API for fetching road data, ratings, and alerts.

## 🚀 Getting Started

### Prerequisites

-   Node.js (v14 or higher)
-   MongoDB (running locally or a compiled connection string)

### Installation

1.  **Clone the repository** (if applicable) or download the source code.

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment**:
    -   Ensure you have a `.env` file or valid environment variables set up for `MONGODB_URI`.
    -   Default fallback: `mongodb://localhost:27017/fullstack-app` (check `server.js`).

4.  **Run the Application**:
    ```bash
    npm run dev
    ```
    or
    ```bash
    node server.js
    ```

5.  **Access the App**:
    -   Open your browser and navigate to: `http://localhost:3000`

## 📱 How to Use

1.  **Explore**: Drag and zoom around the map to see road colors indicating safety levels.
2.  **Select a Road**: Click on any road segment to open the **Safety Popup**.
3.  **Check Alerts**: Read "Recent Alerts" in the popup to stay informed.
4.  **Action**:
    -   Click **⚠️ Report Alert** to warn others about a safety issue.
    -   Click **⭐ Rate this Road** to contribute your own safety experience.
    -   Click **🗺️ Get Directions** to navigate to that location via Google Maps.

## Project Structure

```
├── server.js           # Express server & MongoDB setup
├── models/
│   ├── RoadRating.js   # Schema for road safety ratings
│   └── RoadAlert.js    # Schema for user-reported alerts
├── routes/
│   └── api.js          # API endpoints for ratings & alerts
└── public/
    ├── index.html      # Main UI
    ├── style.css       # Custom styling & animations
    └── app.js          # Map logic & frontend functionality
```

---
*SafeHerRoute - Navigating Safety Together.*
