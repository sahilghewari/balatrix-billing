/**
 * FreeSWITCH Event Socket Library Configuration
 * Real-time integration with FreeSWITCH for call authorization and CDR
 */

const esl = require('esl');
const logger = require('../utils/logger');
const { SYSTEM_EVENTS } = require('../utils/constants');
const EventEmitter = require('events');

class FreeSwitchService extends EventEmitter {
  constructor() {
    super();
    this.connection = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 5000;

    // Configuration
    this.config = {
      host: process.env.FREESWITCH_ESL_HOST || 'localhost',
      port: parseInt(process.env.FREESWITCH_ESL_PORT, 10) || 8021,
      password: process.env.FREESWITCH_ESL_PASSWORD || 'ClueCon',
    };
  }

  /**
   * Connect to FreeSWITCH ESL
   */
  async connect() {
    try {
      this.connection = new esl.Connection(
        this.config.host,
        this.config.port,
        this.config.password,
        () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          logger.info('FreeSWITCH ESL connected', { host: this.config.host });
          this.emit('connected');
          this.subscribeToEvents();
        }
      );

      this.setupEventHandlers();
    } catch (error) {
      logger.error('FreeSWITCH connection error:', error);
      this.handleDisconnect();
    }
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    if (!this.connection) return;

    this.connection.on('error', (error) => {
      logger.error('FreeSWITCH ESL error:', error);
      this.isConnected = false;
      this.emit('error', error);
    });

    this.connection.on('end', () => {
      logger.warn('FreeSWITCH ESL connection ended');
      this.handleDisconnect();
    });

    this.connection.on('esl::event::CHANNEL_HANGUP_COMPLETE::*', (event) => {
      this.handleCDREvent(event);
    });

    this.connection.on('esl::event::CHANNEL_ANSWER::*', (event) => {
      this.handleCallAnswerEvent(event);
    });

    this.connection.on('esl::event::CHANNEL_PARK::*', (event) => {
      this.handleCallAuthorizationEvent(event);
    });
  }

  /**
   * Subscribe to FreeSWITCH events
   */
  subscribeToEvents() {
    if (!this.connection || !this.isConnected) return;

    const events = [
      'CHANNEL_HANGUP_COMPLETE',
      'CHANNEL_ANSWER',
      'CHANNEL_PARK',
      'HEARTBEAT',
    ];

    this.connection.subscribe(events, (err) => {
      if (err) {
        logger.error('FreeSWITCH event subscription error:', err);
      } else {
        logger.info('Subscribed to FreeSWITCH events', { events });
      }
    });
  }

  /**
   * Handle disconnect and reconnect
   */
  handleDisconnect() {
    this.isConnected = false;
    this.emit('disconnected');

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * this.reconnectAttempts;

      logger.info(`Attempting to reconnect to FreeSWITCH (${this.reconnectAttempts}/${this.maxReconnectAttempts})`, {
        delay,
      });

      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      logger.error('Max reconnection attempts reached for FreeSWITCH');
      this.emit('max_reconnect_attempts');
    }
  }

  /**
   * Handle CDR event (call completed)
   * @param {Object} event - ESL event
   */
  handleCDREvent(event) {
    try {
      const cdrData = {
        uuid: event.getHeader('Unique-ID'),
        callingNumber: event.getHeader('Caller-Caller-ID-Number'),
        calledNumber: event.getHeader('Caller-Destination-Number'),
        startTime: new Date(parseInt(event.getHeader('Caller-Channel-Created-Time'), 10) / 1000),
        answerTime: event.getHeader('Caller-Channel-Answered-Time')
          ? new Date(parseInt(event.getHeader('Caller-Channel-Answered-Time'), 10) / 1000)
          : null,
        endTime: new Date(parseInt(event.getHeader('Caller-Channel-Hangup-Time'), 10) / 1000),
        duration: parseInt(event.getHeader('variable_duration'), 10) || 0,
        billsec: parseInt(event.getHeader('variable_billsec'), 10) || 0,
        hangupCause: event.getHeader('Hangup-Cause') || 'UNKNOWN',
        direction: event.getHeader('Call-Direction'),
        accountCode: event.getHeader('variable_accountcode'),
      };

      logger.info('CDR event received', { uuid: cdrData.uuid });
      this.emit('cdr', cdrData);
    } catch (error) {
      logger.error('Error handling CDR event:', error);
    }
  }

  /**
   * Handle call answer event
   * @param {Object} event - ESL event
   */
  handleCallAnswerEvent(event) {
    try {
      const callData = {
        uuid: event.getHeader('Unique-ID'),
        callingNumber: event.getHeader('Caller-Caller-ID-Number'),
        calledNumber: event.getHeader('Caller-Destination-Number'),
        answerTime: new Date(),
      };

      logger.info('Call answered', { uuid: callData.uuid });
      this.emit('call_answered', callData);
    } catch (error) {
      logger.error('Error handling call answer event:', error);
    }
  }

  /**
   * Handle call authorization event (when call is parked for authorization)
   * @param {Object} event - ESL event
   */
  handleCallAuthorizationEvent(event) {
    try {
      const authData = {
        uuid: event.getHeader('Unique-ID'),
        callingNumber: event.getHeader('Caller-Caller-ID-Number'),
        calledNumber: event.getHeader('Caller-Destination-Number'),
        accountCode: event.getHeader('variable_accountcode'),
      };

      logger.info('Call authorization requested', { uuid: authData.uuid });
      this.emit('authorization_required', authData);
    } catch (error) {
      logger.error('Error handling authorization event:', error);
    }
  }

  /**
   * Execute API command
   * @param {string} command - FreeSWITCH API command
   * @returns {Promise<string>} Command result
   */
  async executeApi(command) {
    return new Promise((resolve, reject) => {
      if (!this.connection || !this.isConnected) {
        return reject(new Error('FreeSWITCH not connected'));
      }

      this.connection.api(command, (response) => {
        const body = response.getBody();
        logger.debug('FreeSWITCH API response', { command, body });
        resolve(body);
      });
    });
  }

  /**
   * Authorize call
   * @param {string} uuid - Call UUID
   * @param {boolean} authorized - Authorization status
   * @param {string} reason - Rejection reason
   */
  async authorizeCall(uuid, authorized = true, reason = null) {
    try {
      if (authorized) {
        await this.executeApi(`uuid_transfer ${uuid} continue`);
        logger.info('Call authorized', { uuid });
      } else {
        const hangupCause = reason || 'CALL_REJECTED';
        await this.executeApi(`uuid_kill ${uuid} ${hangupCause}`);
        logger.info('Call rejected', { uuid, reason: hangupCause });
      }
    } catch (error) {
      logger.error('Error authorizing call:', error);
      throw error;
    }
  }

  /**
   * Set channel variable
   * @param {string} uuid - Call UUID
   * @param {string} variable - Variable name
   * @param {string} value - Variable value
   */
  async setChannelVariable(uuid, variable, value) {
    try {
      await this.executeApi(`uuid_setvar ${uuid} ${variable} ${value}`);
      logger.debug('Channel variable set', { uuid, variable, value });
    } catch (error) {
      logger.error('Error setting channel variable:', error);
      throw error;
    }
  }

  /**
   * Get channel variable
   * @param {string} uuid - Call UUID
   * @param {string} variable - Variable name
   * @returns {Promise<string>} Variable value
   */
  async getChannelVariable(uuid, variable) {
    try {
      const value = await this.executeApi(`uuid_getvar ${uuid} ${variable}`);
      return value.trim();
    } catch (error) {
      logger.error('Error getting channel variable:', error);
      throw error;
    }
  }

  /**
   * Hangup call
   * @param {string} uuid - Call UUID
   * @param {string} cause - Hangup cause
   */
  async hangupCall(uuid, cause = 'NORMAL_CLEARING') {
    try {
      await this.executeApi(`uuid_kill ${uuid} ${cause}`);
      logger.info('Call hangup initiated', { uuid, cause });
    } catch (error) {
      logger.error('Error hanging up call:', error);
      throw error;
    }
  }

  /**
   * Get active calls count
   * @returns {Promise<number>} Number of active calls
   */
  async getActiveCallsCount() {
    try {
      const response = await this.executeApi('show channels count');
      const match = response.match(/(\d+) total/);
      return match ? parseInt(match[1], 10) : 0;
    } catch (error) {
      logger.error('Error getting active calls count:', error);
      return 0;
    }
  }

  /**
   * Disconnect from FreeSWITCH
   */
  disconnect() {
    if (this.connection) {
      this.connection.disconnect();
      this.isConnected = false;
      logger.info('Disconnected from FreeSWITCH');
    }
  }

  /**
   * Check connection status
   * @returns {boolean} Connection status
   */
  checkConnection() {
    return this.isConnected;
  }
}

// Export singleton instance
const freeSwitchService = new FreeSwitchService();

module.exports = freeSwitchService;
