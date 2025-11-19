/**
 * FreeSWITCH Event Collector
 * Connects to FreeSWITCH ESL and collects real-time events
 */

const esl = require('esl');
const logger = require('../utils/logger');
const freeSwitchConfig = require('./config/freeswitchConfig');

class FSEventCollector {
  constructor() {
    this.connection = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = freeSwitchConfig.esl.reconnect.maxAttempts;
    this.reconnectDelay = freeSwitchConfig.esl.reconnect.delay;
    this.onEventCallback = null;
    this.stopRequested = false;
  }

  /**
   * Set the event callback
   * @param {Function} callback - Function to call with each event
   */
  setEventCallback(callback) {
    this.onEventCallback = callback;
  }

  /**
   * Connect to FreeSWITCH ESL
   */
  async connect() {
    try {
      this.connection = esl.createClient();
      
      // Set up error handler before connecting
      this.connection.on('error', (error) => {
        logger.error('FreeSWITCH ESL connection error:', error);
        this.isConnected = false;
        this.handleDisconnect();
      });

      this.connection.connect({
        host: freeSwitchConfig.esl.host,
        port: freeSwitchConfig.esl.port,
        password: freeSwitchConfig.esl.password,
      }, (err) => {
        if (err) {
          logger.error('FreeSWITCH ESL connection failed:', err);
          this.isConnected = false;
          this.handleDisconnect();
          return;
        }
        
        this.isConnected = true;
        this.reconnectAttempts = 0;
        logger.info('FreeSWITCH ESL connected for event collection', {
          host: freeSwitchConfig.esl.host,
          port: freeSwitchConfig.esl.port
        });
        this.setupEventHandlers();
        this.subscribeToEvents();
      });
    } catch (error) {
      logger.error('FreeSWITCH ESL connection setup error:', error);
      this.handleDisconnect();
    }
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    if (!this.connection) return;

    this.connection.on('end', () => {
      logger.warn('FreeSWITCH ESL connection ended');
      this.handleDisconnect();
    });

    // Handle all events
    this.connection.on('event', (event) => {
      this.handleEvent(event);
    });
  }

  /**
   * Subscribe to FreeSWITCH events
   */
  subscribeToEvents() {
    if (!this.connection || !this.isConnected) return;

    // Subscribe to all events for monitoring
    this.connection.write('event plain all\n\n');
    this.connection.once('reply', (response) => {
      if (response && response.getBody().startsWith('+OK')) {
        logger.info('Subscribed to all FreeSWITCH events for monitoring');
      } else {
        logger.error('FreeSWITCH event subscription error:', response ? response.getBody() : 'No response');
      }
    });
  }

  /**
   * Handle incoming event
   * @param {Object} event - ESL event
   */
  handleEvent(event) {
    try {
      // Convert ESL event to plain object
      const eventData = {};
      event.headers.forEach((value, key) => {
        eventData[key] = value;
      });

      // Add body if present
      if (event.body) {
        eventData._body = event.body;
      }

      // Log event
      logger.debug('FreeSWITCH event received', {
        eventName: eventData['Event-Name'],
        uuid: eventData['Unique-ID'] || eventData['Channel-Call-UUID']
      });

      // Call the callback if set
      if (this.onEventCallback) {
        this.onEventCallback(eventData);
      }
    } catch (error) {
      logger.error('Error processing FreeSWITCH event:', error);
    }
  }

  /**
   * Handle disconnect and reconnect
   */
  handleDisconnect() {
    this.isConnected = false;

    if (this.stopRequested) {
      logger.info('Event collector stop requested, not reconnecting');
      return;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(
        this.reconnectDelay * Math.pow(freeSwitchConfig.esl.reconnect.backoffMultiplier, this.reconnectAttempts - 1),
        freeSwitchConfig.esl.reconnect.maxDelay
      );

      logger.info(`Attempting to reconnect to FreeSWITCH (${this.reconnectAttempts}/${this.maxReconnectAttempts})`, {
        delay,
      });

      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      logger.error('Max reconnection attempts reached for FreeSWITCH event collector');
    }
  }

  /**
   * Start the collector
   */
  async start() {
    this.stopRequested = false;
    await this.connect();
  }

  /**
   * Stop the collector
   */
  stop() {
    this.stopRequested = true;
    if (this.connection) {
      this.connection.disconnect();
      this.isConnected = false;
      logger.info('FreeSWITCH event collector stopped');
    }
  }

  /**
   * Check connection status
   * @returns {boolean} Connection status
   */
  isHealthy() {
    return this.isConnected;
  }
}

module.exports = FSEventCollector;