import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.statsCallback = null;
    this.buttonPressCallback = null;
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
      if (this.statsCallback) {
        this.statsCallback(this.formatStats([data.stats]));
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

  emitButtonPress(data) {
    if (this.socket) {
      this.socket.emit('buttonPress', data);
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