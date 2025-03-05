import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.statsCallback = null;
    this.buttonPressCallback = null;
    this.connectedUsersCallback = null;
    this.isConnected = false;
    
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
    if (this.socket) {
      return; // Already connected or connecting
    }

    this.socket = io('http://localhost:5001', {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.isConnected = true;
      // Request current connected users count on connection
      this.socket.emit('requestConnectedUsers');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      this.isConnected = false;
    });

    this.socket.on('reconnect', () => {
      console.log('Reconnected to WebSocket server');
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
      console.log('Received connected users update:', count);
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
  }

  formatStats(stats) {
    return stats.reduce((acc, stat) => {
      acc[stat.country] = stat.pressCount;
      return acc;
    }, {});
  }

  onStatsUpdate(callback) {
    this.statsCallback = callback;
  }

  onButtonPress(callback) {
    this.buttonPressCallback = callback;
  }

  onConnectedUsersUpdate(callback) {
    this.connectedUsersCallback = callback;
  }

  canPressButton() {
    return this.lastPressClientId === null || this.lastPressClientId !== this.clientId;
  }

  emitButtonPress(data) {
    if (this.socket && this.canPressButton()) {
      this.socket.emit('buttonPress', {
        ...data,
        clientId: this.clientId
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService(); 