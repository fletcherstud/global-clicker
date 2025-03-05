# I Am His - Real-time Global Follower Map

An interactive web application that displays a real-time 3D globe showing locations of people declaring themselves as followers of Christ.

## Features

- Real-time 3D globe visualization using Globe.gl
- Live updates using Socket.io
- Modern, responsive UI with Tailwind CSS
- MongoDB for data persistence
- Express.js backend

## Tech Stack

- Frontend:
  - React
  - Globe.gl
  - Tailwind CSS
  - Socket.io-client

- Backend:
  - Node.js
  - Express
  - Socket.io
  - MongoDB

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. Create a `.env` file in the backend directory with:
   ```
   MONGODB_URI=your_mongodb_uri
   PORT=5000
   ```

4. Start the development servers:
   ```bash
   # Start backend server
   cd backend
   npm run dev

   # Start frontend server
   cd frontend
   npm run dev
   ```

5. Open http://localhost:5173 in your browser

## Project Structure

```
iamhis/
├── frontend/           # React frontend application
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/           # Node.js backend application
│   ├── src/
│   ├── config/
│   └── package.json
└── README.md
``` 