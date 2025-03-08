const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const turnstileMiddleware = require('./middleware/turnstileVerification');
require('dotenv').config();

const ButtonPress = require('./models/ButtonPress');
const CountryStats = require('./models/CountryStats');

const app = express();
const server = http.createServer(app);

// Session configuration
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 24 * 60 * 60, // Session TTL (1 day)
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
});

// Apply session middleware to express
app.use(sessionMiddleware);

const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
    transports: ['websocket', 'polling']
  },
  allowEIO3: true,
  path: '/socket.io/',
  handlePreflightRequest: (req, res) => {
    res.writeHead(200, {
      "Access-Control-Allow-Origin": process.env.CORS_ORIGIN,
      "Access-Control-Allow-Methods": "GET,POST",
      "Access-Control-Allow-Credentials": true
    });
    res.end();
  }
});

// Share session between Express and Socket.IO
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// MongoDB Connection with retry logic and production settings
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      },
      // Production-ready settings with SSL/TLS
      maxPoolSize: 50,
      wtimeoutMS: 2500,
      retryWrites: true,
      ssl: true,
      tls: true,
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      directConnection: false
    });
    
    console.log('Connected to MongoDB Atlas');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    // Retry connection after 5 seconds
    setTimeout(connectDB, 5000);
  }
};

// Handle MongoDB connection errors
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
  connectDB();
});

// Initial connection
connectDB();

// Track connected sockets with a Set for more accurate counting
const connectedSockets = new Set();

// Socket.io connection handling
io.on('connection', async (socket) => {
  console.log('New client connected');
  
  // Add socket to tracking set and broadcast updated count
  connectedSockets.add(socket.id);
  io.emit('connectedUsers', connectedSockets.size);

  // Handle request for current connected users count
  socket.on('requestConnectedUsers', () => {
    socket.emit('connectedUsers', connectedSockets.size);
  });

  try {
    // Check MongoDB connection before sending initial stats
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB not connected');
    }
    
    // Send initial stats to the new client
    const stats = await CountryStats.find().sort('-pressCount');
    socket.emit('initialStats', stats);
  } catch (error) {
    console.error('Error sending initial stats:', error);
    socket.emit('error', { message: 'Database connection error' });
  }

  socket.on('buttonPress', async (data) => {
    // Verify Turnstile token
    if (!socket.request.session?.turnstileVerified) {
      const token = data.turnstileToken;
      if (!token) {
        socket.emit('error', { 
          message: 'Verification required',
          needsVerification: true
        });
        return;
      }

      try {
        const verification = await verifyTurnstileToken(token);
        if (!verification.success) {
          socket.emit('error', { 
            message: 'Verification failed',
            needsVerification: true
          });
          return;
        }
        // Store verification in session
        socket.request.session.turnstileVerified = true;
        socket.request.session.turnstileVerifiedAt = verification.challengeTs;
        await socket.request.session.save();
      } catch (error) {
        console.error('Turnstile verification error:', error);
        socket.emit('error', { 
          message: 'Verification failed',
          needsVerification: true
        });
        return;
      }
    }

    // Check MongoDB connection before processing
    if (mongoose.connection.readyState !== 1) {
      socket.emit('error', { message: 'Database connection error' });
      return;
    }

    try {
      // Create new button press record with timeout
      const buttonPress = new ButtonPress({
        country: data.country,
        location: {
          type: 'Point',
          coordinates: [data.longitude, data.latitude]
        },
        clientId: data.clientId
      });
      
      await Promise.race([
        buttonPress.save(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Save operation timed out')), 5000)
        )
      ]);

      // Update country stats with timeout
      const stats = await Promise.race([
        CountryStats.findOneAndUpdate(
          { country: data.country },
          { 
            $inc: { pressCount: 1 },
            $set: { lastPressed: Date.now() }
          },
          { 
            upsert: true,
            new: true
          }
        ),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Update operation timed out')), 5000)
        )
      ]);

      // Broadcast the event to all clients
      io.emit('buttonPressed', {
        country: data.country,
        location: buttonPress.location,
        pressedAt: buttonPress.pressedAt,
        stats: stats,
        clientId: data.clientId
      });

    } catch (error) {
      console.error('Error handling button press:', error);
      socket.emit('error', { 
        message: 'Failed to process button press',
        details: error.message 
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    // Remove socket from tracking set and broadcast updated count
    connectedSockets.delete(socket.id);
    io.emit('connectedUsers', connectedSockets.size);
  });

  // Handle errors and unexpected disconnects
  socket.on('error', () => {
    connectedSockets.delete(socket.id);
    io.emit('connectedUsers', connectedSockets.size);
  });
});

// API Routes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/stats', turnstileMiddleware(), async (req, res) => {
  console.log('Received request for /api/stats');
  try {
    const stats = await CountryStats.find().sort('-pressCount');
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/lastButtonPress', turnstileMiddleware(), async (req, res) => {
  try {
    const lastPress = await ButtonPress.findOne()
      .sort('-pressedAt')
      .select('country location pressedAt');
    
    if (!lastPress) {
      return res.status(404).json({ error: 'No button presses found' });
    }

    res.json({
      country: lastPress.country,
      location: lastPress.location,
      timestamp: lastPress.pressedAt
    });
  } catch (error) {
    console.error('Error fetching last button press:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/recent-presses', turnstileMiddleware(), async (req, res) => {
  try {
    const recentPresses = await ButtonPress.find()
      .sort('-pressedAt')
      .limit(100);
    res.json(recentPresses);
  } catch (error) {
    console.error('Error fetching recent presses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 