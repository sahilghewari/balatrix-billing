/**
 * Call Registry
 * Maintains an in-memory snapshot of active calls based on FreeSWITCH events
 */

const logger = require('../utils/logger');

class CallRegistry {
  constructor() {
    this.calls = new Map(); // uuid -> call data
    this.CALL_START_EVENTS = new Set([
      'CHANNEL_CREATE',
      'CHANNEL_BRIDGE',
      'CHANNEL_ANSWER'
    ]);
    this.CALL_END_EVENTS = new Set([
      'CHANNEL_DESTROY',
      'CHANNEL_HANGUP',
      'CHANNEL_HANGUP_COMPLETE'
    ]);
    this.CALL_STATE_STARTS = new Set([
      'EARLY',
      'RINGING',
      'ACTIVE'
    ]);
    this.CALL_STATE_ENDS = new Set([
      'HANGUP',
      'DOWN'
    ]);
    this.CHANNEL_STATE_ENDS = new Set([
      'CS_HANGUP',
      'CS_DESTROY',
      'CS_REPORTING'
    ]);
    this.EXTRA_UUID_KEYS = [
      'Other-Leg-Unique-ID',
      'variable_bridge_uuid',
      'Bridge-A-Unique-ID',
      'Bridge-B-Unique-ID',
      'variable_signal_bond',
    ];
  }

  /**
   * Extract UUID from event
   * @param {Object} event - Event data
   * @returns {string|null} UUID or null
   */
  _extractUuid(event) {
    return (
      event['Unique-ID'] ||
      event['Channel-Call-UUID'] ||
      event['variable_uuid'] ||
      event['Caller-Unique-ID']
    );
  }

  /**
   * Normalize string value
   * @param {string} value - Value to normalize
   * @returns {string} Normalized value
   */
  _normalize(value) {
    return (value || '').trim().toUpperCase();
  }

  /**
   * Get direction values
   * @param {Object} event - Event data
   * @returns {Object} Direction info
   */
  _directionValues(event) {
    const rawDirection = (
      event['Call-Direction'] ||
      event['Caller-Direction'] ||
      event['variable_direction'] ||
      ''
    );
    const clean = rawDirection.trim();
    return {
      raw: clean,
      normalized: clean.toLowerCase()
    };
  }

  /**
   * Check if state matches candidates
   * @param {string} state - State to check
   * @param {Set} candidates - Candidate states
   * @returns {boolean} True if matches
   */
  _stateMatches(state, candidates) {
    if (!state) return false;
    for (const token of candidates) {
      if (!token) continue;
      if (state === token || state.startsWith(`${token}_`) || state.startsWith(`${token} `)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Apply event to registry
   * @param {Object} event - Event data
   * @returns {Object|null} Snapshot if changed, null otherwise
   */
  applyEvent(event) {
    const uuid = this._extractUuid(event);
    if (!uuid) return null;

    const eventName = (event['Event-Name'] || '').toUpperCase();
    if (!eventName) return null;

    const rawCallState = event['Channel-Call-State'];
    const channelState = this._normalize(event['Channel-State']);
    const callState = this._normalize(rawCallState);
    const callStateIsEnd = this._stateMatches(callState, this.CALL_STATE_ENDS);
    const channelStateIsEnd = this._stateMatches(channelState, this.CHANNEL_STATE_ENDS);
    const callStateIsStart = this._stateMatches(callState, this.CALL_STATE_STARTS);
    const directionInfo = this._directionValues(event);
    const directionNorm = directionInfo.normalized;
    const directionRaw = directionInfo.raw;

    // Handle end events
    if (
      this.CALL_END_EVENTS.has(eventName) ||
      channelStateIsEnd ||
      callStateIsEnd
    ) {
      const targets = new Set([uuid]);
      for (const key of this.EXTRA_UUID_KEYS) {
        const otherUuid = event[key];
        if (otherUuid) {
          targets.add(otherUuid);
        }
      }
      for (const entryUuid of targets) {
        this.calls.delete(entryUuid);
      }
      return this.snapshot(event);
    }

    // Handle start events
    if (this.CALL_START_EVENTS.has(eventName) || callStateIsStart) {
      if (directionNorm && directionNorm !== 'inbound') {
        return this.snapshot(event);
      }
      const callInfo = {
        uuid,
        state: rawCallState || eventName,
        direction: directionRaw || event['Call-Direction'] || event['Caller-Direction'],
        caller: event['Caller-Caller-ID-Number'] || event['Caller-ANI'],
        callee: event['Caller-Destination-Number'] || event['variable_sip_to_user'],
        created_at: event['Event-Date-Local'] || event['Event-Date-Timestamp'],
      };
      this.calls.set(uuid, callInfo);
      return this.snapshot(event);
    }

    // Update existing call
    if (this.calls.has(uuid)) {
      const call = this.calls.get(uuid);
      call.state = rawCallState || eventName;
      if (directionRaw && directionNorm === 'inbound') {
        call.direction = directionRaw;
      }
      if (callStateIsEnd) {
        this.calls.delete(uuid);
        return this.snapshot(event);
      }
      return this.snapshot(event);
    }

    return null;
  }

  /**
   * Get current snapshot
   * @param {Object} lastEvent - Last event (optional)
   * @returns {Object} Snapshot
   */
  snapshot(lastEvent = null) {
    const data = {
      active_call_count: this.calls.size,
      active_calls: Array.from(this.calls.values()),
    };
    if (lastEvent) {
      data.last_event = lastEvent;
    }
    return data;
  }

  /**
   * Get active calls count
   * @returns {number} Count
   */
  getActiveCallsCount() {
    return this.calls.size;
  }

  /**
   * Get all active calls
   * @returns {Array} Active calls
   */
  getActiveCalls() {
    return Array.from(this.calls.values());
  }
}

module.exports = CallRegistry;