<<<<<<< HEAD
# Full-Stack Web App

A simple full-stack web application built with Node.js, Express, MongoDB, and vanilla HTML/CSS/JavaScript.

## Features

- RESTful API with Express
- MongoDB database integration with Mongoose
- Create and view items
- Modern, responsive UI with gradient design
- CORS enabled for API access

## Project Structure

```
├── server.js           # Express server and MongoDB connection
├── package.json        # Project dependencies
├── .env               # Environment variables
├── models/
│   └── Item.js        # Mongoose model for items
├── routes/
│   └── api.js         # API routes
└── public/
    ├── index.html     # Frontend HTML
    ├── style.css      # Styling
    └── app.js         # Frontend JavaScript
```

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or MongoDB Atlas connection string)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - Update `.env` file with your MongoDB connection string if needed
   - Default: `mongodb://localhost:27017/fullstack-app`

3. Make sure MongoDB is running locally, or update the connection string in `.env`

## Running the Application

Start the server:
```bash
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- API: http://localhost:3000/api

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/items` - Get all items
- `POST /api/items` - Create a new item
  - Body: `{ "name": "Item name", "description": "Item description" }`

## Technologies Used

- **Backend**: Node.js, Express.js, Mongoose
- **Database**: MongoDB
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Middleware**: CORS, body-parser

## Notes

- The server will start even if MongoDB is not connected, but database operations will fail
- Make sure MongoDB is running before testing database functionality
- For production, update the MongoDB connection string and add proper error handling
=======
# women_safetyroadmap_vijayawada
>>>>>>> 207129ffb4d03328cdbd2f9aa8373e5da184f0e2
