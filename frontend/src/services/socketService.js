import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.statsCallback = null;
    this.buttonPressCallback = null;
    this.clientId = Math.random().toString(36).substring(2, 15); // Generate a random client ID
    this.lastPressClientId = null;
  }

  connect() {
    this.socket = io('http://localhost:5001');

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    this.socket.on('initialStats', (stats) => {
      if (this.statsCallback) {
        this.statsCallback(this.formatStats(stats));
      }
    });

    this.socket.on('buttonPressed', (data) => {
      // Update the last press client ID
      this.lastPressClientId = data.clientId;
      
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