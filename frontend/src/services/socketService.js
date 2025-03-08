import io from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL;

class SocketService {
  constructor() {
    this.socket = null;
    this.statsCallback = null;
    this.buttonPressCallback = null;
    this.connectedUsersCallback = null;
    this.isConnected = false;
    this.lastPressTime = null;
    this.cooldownPeriod = 5000; // 5 seconds cooldown
    this.turnstileRequests = 0;
    this.lastTurnstileRequestTime = null;
    this.turnstileToken = null;
    
    // Get existing clientId from localStorage or generate a new one
    let storedClientId = localStorage.getItem('globalClickerClientId');
    if (!storedClientId) {
      storedClientId = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('globalClickerClientId', storedClientId);
    }
    this.clientId = storedClientId;
    
    // Get last press client ID from localStorage
    this.lastPressClientId = localStorage.getItem('globalClickerLastPressId');
  }

  connect() {
    if (!this.socket) {
      this.socket = io(API_URL, {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ['websocket', 'polling'],
        upgrade: false,
        extraHeaders: this.turnstileToken ? {
          'cf-turnstile-token': this.turnstileToken
        } : {}
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        // Request current connected users count on connection
        this.socket.emit('requestConnectedUsers');
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
      });

      this.socket.on('reconnect', () => {
        this.isConnected = true;
        // Request current connected users count on reconnection
        this.socket.emit('requestConnectedUsers');
      });

      this.socket.on('initialStats', (stats) => {
        if (this.statsCallback) {
          this.statsCallback(this.formatStats(stats));
        }
      });

      this.socket.on('connectedUsers', (count) => {
        if (this.connectedUsersCallback) {
          this.connectedUsersCallback(count);
        }
      });

      this.socket.on('buttonPressed', (data) => {
        // Update and persist the last press client ID
        this.lastPressClientId = data.clientId;
        localStorage.setItem('globalClickerLastPressId', data.clientId);
        
        if (this.statsCallback) {
          this.statsCallback(prevStats => ({
            ...prevStats,
            [data.stats.country]: data.stats.pressCount
          }));
        }
        if (this.buttonPressCallback) {
          this.buttonPressCallback(data);
        }
      });

      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      // Reset Turnstile counters periodically
      setInterval(() => {
        const now = Date.now();
        if (this.lastTurnstileRequestTime && (now - this.lastTurnstileRequestTime > 60000)) {
          this.turnstileRequests = 0;
          this.lastTurnstileRequestTime = null;
        }
      }, 60000); // Check every minute
    }
  }

  formatStats(stats) {
    return stats.reduce((acc, stat) => {
      acc[stat.country] = stat.pressCount;
      return acc;
    }, {});
  }

  onStatsUpdate(callback) {
    this.statsCallback = callback;
    if (this.socket) {
      this.socket.on('stats', callback);
    }
  }

  onButtonPress(callback) {
    this.buttonPressCallback = callback;
    if (this.socket) {
      this.socket.on('buttonPress', callback);
    }
  }

  onConnectedUsersUpdate(callback) {
    this.connectedUsersCallback = callback;
    if (this.socket) {
      this.socket.on('connectedUsers', callback);
    }
  }

  canPressButton() {
    if (!this.lastPressTime) return true;
    const now = Date.now();
    return now - this.lastPressTime >= this.cooldownPeriod;
  }

  emitButtonPress(location) {
    if (this.socket && this.canPressButton()) {
      this.lastPressTime = Date.now();
      this.socket.emit('buttonPress', {
        ...location,
        turnstileToken: this.turnstileToken
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  incrementTurnstileRequest() {
    const now = Date.now();
    this.turnstileRequests++;
    this.lastTurnstileRequestTime = now;
  }

  getTurnstileStats() {
    return {
      requestCount: this.turnstileRequests,
      lastRequestTime: this.lastTurnstileRequestTime
    };
  }

  setTurnstileToken(token) {
    this.turnstileToken = token;
    // Reconnect with new token if already connected
    if (this.socket && this.isConnected) {
      this.disconnect();
      this.connect();
    }
  }
}

export const socketService = new SocketService(); 