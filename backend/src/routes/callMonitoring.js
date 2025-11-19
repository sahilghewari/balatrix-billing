/**
 * Call Monitoring Routes
 * REST endpoints for call monitoring
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { authenticate } = require('../middleware/auth');
const { TollFreeNumber, Customer, Subscription, Tenant } = require('../models');

// This will be set when the monitoring server is initialized
let callMonitoringServer = null;

/**
 * Set the call monitoring server instance
 * @param {CallMonitoringServer} server
 */
function setCallMonitoringServer(server) {
  callMonitoringServer = server;
}

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  if (!callMonitoringServer) {
    return res.status(503).json({
      status: 'error',
      message: 'Call monitoring server not initialized',
      timestamp: new Date().toISOString()
    });
  }

  const isHealthy = callMonitoringServer.collector.isHealthy();
  res.json({
    status: isHealthy ? 'ok' : 'degraded',
    freeswitch_connected: isHealthy,
    timestamp: new Date().toISOString(),
    service: 'call-monitoring'
  });
});

/**
 * Get current call metrics
 */
router.get('/metrics', (req, res) => {
  try {
    if (!callMonitoringServer) {
      return res.status(503).json({
        error: 'Call monitoring server not available',
        timestamp: new Date().toISOString()
      });
    }

    const snapshot = callMonitoringServer.getSnapshot();
    const isConnected = callMonitoringServer.collector.isHealthy();

    res.json({
      ...snapshot,
      freeswitch_connected: isConnected,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting call metrics:', error);
    res.status(500).json({
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get active calls (filtered by customer or user/number)
 */
router.get('/calls', async (req, res) => {
  try {
    // Check if user is authenticated
    const authHeader = req.headers.authorization;
    let user = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const jwt = require('jsonwebtoken');
        user = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        // Token invalid, continue as unauthenticated
      }
    }

    if (!callMonitoringServer) {
      return res.status(503).json({
        error: 'Call monitoring server not available',
        timestamp: new Date().toISOString()
      });
    }

    const { user: filterUser, number } = req.query;
    const snapshot = callMonitoringServer.getSnapshot();
    const isConnected = callMonitoringServer.collector.isHealthy();

    let filteredCalls = snapshot.active_calls;

    // If user is authenticated and not admin, filter by their toll-free numbers
    if (user && user.role !== 'admin') {
      try {
        // Get customer's toll-free numbers directly
        const tollFreeNumbers = await TollFreeNumber.findAll({
          where: { status: 'inactive' }, // assigned numbers
          attributes: ['number']
        });

        const customerNumbers = tollFreeNumbers.map(tfn => tfn.number);
        filteredCalls = filteredCalls.filter(call =>
          customerNumbers.includes(call.callee)
        );
      } catch (error) {
        logger.error('Error filtering calls by customer:', error);
        // Return empty if we can't filter
        filteredCalls = [];
      }
    } else {
      // Admin can filter by user or number if specified
      if (user) {
        filteredCalls = filteredCalls.filter(call =>
          call.caller === user || call.callee === user
        );
      }
      if (number) {
        filteredCalls = filteredCalls.filter(call =>
          call.caller === number || call.callee === number
        );
      }
    }

    res.json({
      active_call_count: filteredCalls.length,
      active_calls: filteredCalls,
      freeswitch_connected: isConnected,
      filters: user ? (user.role === 'admin' ? { user: filterUser, number } : { customer: user.userId }) : {},
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting active calls:', error);
    res.status(500).json({
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Simulate a call event for testing (development only)
 * POST /api/call-monitoring/simulate-call
 */
router.post('/simulate-call', (req, res) => {
  try {
    const { caller, callee, direction = 'inbound' } = req.body;

    if (!callee) {
      return res.status(400).json({
        error: 'callee number is required',
        timestamp: new Date().toISOString()
      });
    }

    // Create a fake call event
    const fakeEvent = {
      'Event-Name': 'CHANNEL_CREATE',
      'Unique-ID': `test-${Date.now()}`,
      'Channel-Call-UUID': `test-${Date.now()}`,
      'Caller-Caller-ID-Number': caller || '555-TEST',
      'Caller-Destination-Number': callee,
      'Caller-Direction': direction,
      'Channel-Call-State': 'ACTIVE',
      'Event-Date-Local': new Date().toISOString(),
      'Channel-State': 'CS_EXECUTE'
    };

    // Send to call monitoring server
    if (callMonitoringServer) {
      callMonitoringServer.handleEvent(fakeEvent);
    }

    res.json({
      message: 'Call simulation triggered',
      event: fakeEvent,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error simulating call:', error);
    res.status(500).json({
      error: 'Failed to simulate call',
      timestamp: new Date().toISOString()
    });
  }
});