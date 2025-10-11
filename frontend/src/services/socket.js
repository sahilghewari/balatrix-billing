import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(token) {
    if (this.socket?.connected) {
      return this.socket;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

    this.socket = io(socketUrl, {
      auth: {
        token,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Setup event listeners
    this.setupListeners();

    return this.socket;
  }

  setupListeners() {
    // Balance updates
    this.socket.on('balance:updated', (data) => {
      this.emit('balance:updated', data);
    });

    // Call events
    this.socket.on('call:started', (data) => {
      this.emit('call:started', data);
    });

    this.socket.on('call:ended', (data) => {
      this.emit('call:ended', data);
    });

    // Invoice events
    this.socket.on('invoice:created', (data) => {
      this.emit('invoice:created', data);
    });

    this.socket.on('invoice:paid', (data) => {
      this.emit('invoice:paid', data);
    });

    // Payment events
    this.socket.on('payment:success', (data) => {
      this.emit('payment:success', data);
    });

    this.socket.on('payment:failed', (data) => {
      this.emit('payment:failed', data);
    });

    // Subscription events
    this.socket.on('subscription:updated', (data) => {
      this.emit('subscription:updated', data);
    });

    this.socket.on('subscription:expired', (data) => {
      this.emit('subscription:expired', data);
    });

    // Alerts
    this.socket.on('alert:low_balance', (data) => {
      this.emit('alert:low_balance', data);
    });

    this.socket.on('alert:usage_limit', (data) => {
      this.emit('alert:usage_limit', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  send(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected. Cannot send event:', event);
    }
  }
}

export const socketService = new SocketService();
