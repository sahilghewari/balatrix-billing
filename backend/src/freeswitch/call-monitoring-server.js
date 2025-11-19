/**
 * Call Monitoring WebSocket Server
 * Provides real-time call monitoring via Socket.IO
 */

const { Server } = require('socket.io');
const logger = require('../utils/logger');
const FSEventCollector = require('./fs-event-collector');
const CallRegistry = require('./call-registry');

class CallMonitoringServer {
  constructor(httpServer) {
    this.io = null;
    this.collector = new FSEventCollector();
    this.registry = new CallRegistry();
    this.eventQueue = [];
    this.isProcessing = false;
    this.init(httpServer);
  }

  /**
   * Initialize the server
   * @param {Object} httpServer - HTTP server instance
   */
  init(httpServer) {
    // Initialize Socket.IO
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      path: '/socket.io/call-monitoring'
    });

    // Set up collector callback
    this.collector.setEventCallback((event) => {
      this.handleEvent(event);
    });

    // Set up Socket.IO
    this.setupSocketIO();

    logger.info('Call monitoring WebSocket server initialized');
  }

  /**
   * Set up Socket.IO event handlers
   */
  setupSocketIO() {
    this.io.on('connection', (socket) => {
      logger.info('Client connected to call monitoring', { socketId: socket.id });

      // Send initial snapshot
      socket.emit('snapshot', this.registry.snapshot());

      // Handle client events
      socket.on('disconnect', () => {
        logger.info('Client disconnected from call monitoring', { socketId: socket.id });
      });

      socket.on('ping', () => {
        socket.emit('pong');
      });
    });
  }

  /**
   * Handle incoming FreeSWITCH event
   * @param {Object} event - Event data
   */
  async handleEvent(event) {
    // Add to queue for processing
    this.eventQueue.push(event);
    await this.processQueue();
  }

  /**
   * Process event queue
   */
  async processQueue() {
    if (this.isProcessing || this.eventQueue.length === 0) return;

    this.isProcessing = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      try {
        const snapshot = this.registry.applyEvent(event);
        if (snapshot) {
          // Broadcast to all connected clients
          this.io.emit('snapshot', snapshot);
          logger.debug('Call snapshot broadcasted', {
            activeCalls: snapshot.active_call_count,
            eventName: snapshot.last_event?.['Event-Name']
          });
        }
      } catch (error) {
        logger.error('Error processing call event:', error);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Start the monitoring server
   */
  async start() {
    try {
      await this.collector.start();
      logger.info('Call monitoring server started - waiting for FreeSWITCH connection');
    } catch (error) {
      logger.error('Failed to initialize FreeSWITCH event collector:', error);
      throw error;
    }
  }

  /**
   * Stop the monitoring server
   */
  stop() {
    this.collector.stop();
    if (this.io) {
      this.io.close();
    }
    logger.info('Call monitoring server stopped');
  }

  /**
   * Get current snapshot
   * @returns {Object} Snapshot
   */
  getSnapshot() {
    return this.registry.snapshot();
  }

  /**
   * Get active calls count
   * @returns {number} Count
   */
  getActiveCallsCount() {
    return this.registry.getActiveCallsCount();
  }
}

module.exports = CallMonitoringServer;