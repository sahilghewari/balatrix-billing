/**
 * FreeSWITCH ESL Configuration
 * Central configuration for FreeSWITCH Event Socket Layer connection
 */

module.exports = {
  // ESL Connection Settings
  esl: {
    host: process.env.FREESWITCH_HOST || '127.0.0.1',
    port: parseInt(process.env.FREESWITCH_PORT) || 8021,
    password: process.env.FREESWITCH_PASSWORD || 'ClueCon',
    
    // Connection Pool Settings
    pool: {
      min: 2,
      max: 5,
      acquireTimeout: 30000,
      idleTimeout: 300000,
    },
    
    // Reconnection Settings
    reconnect: {
      enabled: true,
      maxAttempts: 10,
      delay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
    },
    
    // Health Check Settings
    healthCheck: {
      enabled: true,
      interval: 30000, // 30 seconds
      timeout: 5000,
    },
  },

  // Event Subscriptions
  events: {
    subscribe: [
      'CHANNEL_CREATE',
      'CHANNEL_ANSWER',
      'CHANNEL_HANGUP',
      'CHANNEL_HANGUP_COMPLETE',
      'CHANNEL_BRIDGE',
      'CHANNEL_UNBRIDGE',
      'CHANNEL_PROGRESS',
      'CHANNEL_PROGRESS_MEDIA',
      'DTMF',
      'CUSTOM sofia::register',
      'CUSTOM sofia::unregister',
      'CUSTOM sofia::expire',
      'CUSTOM callcenter::info',
      'RECORD_START',
      'RECORD_STOP',
      'PLAYBACK_START',
      'PLAYBACK_STOP',
    ],
  },

  // Outbound Socket Settings (for advanced IVR)
  outboundSocket: {
    enabled: true,
    host: process.env.OUTBOUND_SOCKET_HOST || '0.0.0.0',
    port: parseInt(process.env.OUTBOUND_SOCKET_PORT) || 8022,
  },

  // Call Recording Settings
  recording: {
    enabled: true,
    path: process.env.RECORDING_PATH || '/usr/local/freeswitch/recordings',
    format: 'wav', // wav, mp3
    sampleRate: 8000,
    channels: 1,
    autoUpload: true, // Upload to cloud storage after recording
  },

  // Audio Prompts Settings
  audio: {
    basePath: process.env.AUDIO_BASE_PATH || '/usr/local/freeswitch/sounds',
    customPath: process.env.AUDIO_CUSTOM_PATH || '/usr/local/freeswitch/sounds/custom',
    defaultLanguage: 'en',
    defaultVoice: 'female',
  },

  // SIP Settings
  sip: {
    domain: process.env.SIP_DOMAIN || 'voip.balatrix.com',
    context: process.env.SIP_CONTEXT || 'default',
    profile: process.env.SIP_PROFILE || 'internal',
    codec: 'PCMU,PCMA,G729',
    dtmfType: 'rfc2833',
  },

  // CDR Settings
  cdr: {
    enabled: true,
    format: 'json',
    endpoint: process.env.CDR_WEBHOOK_URL || 'http://localhost:3000/api/freeswitch/cdr',
    retryAttempts: 3,
    retryDelay: 5000,
  },

  // Dial Plan Settings
  dialplan: {
    context: {
      public: 'public',
      default: 'default',
      custom: 'custom',
    },
    endpoint: process.env.DIALPLAN_WEBHOOK_URL || 'http://localhost:3000/api/freeswitch/dialplan',
  },

  // Directory Settings (for SIP authentication)
  directory: {
    endpoint: process.env.DIRECTORY_WEBHOOK_URL || 'http://localhost:3000/api/freeswitch/directory',
    cacheTTL: 300, // 5 minutes
  },

  // Call Limits
  limits: {
    maxCallDuration: 14400, // 4 hours in seconds
    maxConcurrentCalls: 1000,
    maxCallsPerSecond: 10,
  },

  // Voicemail Settings
  voicemail: {
    enabled: true,
    maxDuration: 300, // 5 minutes
    emailNotification: true,
    transcription: false,
  },

  // Call Queue Settings
  queue: {
    maxWaitTime: 1800, // 30 minutes
    maxQueueSize: 100,
    tierRulesApply: true,
    announcePosition: true,
    announceWaitTime: true,
  },

  // Logging
  logging: {
    level: process.env.FREESWITCH_LOG_LEVEL || 'info',
    eslCommands: false, // Log all ESL commands
    events: true, // Log events
  },

  // Feature Flags
  features: {
    callRecording: true,
    callTransfer: true,
    callConference: true,
    callQueue: true,
    ivr: true,
    voicemail: true,
    sms: false,
    video: false,
  },
};
