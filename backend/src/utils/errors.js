/**
 * Custom Error Classes
 * Standardized error handling across the application
 */

const { ERROR_CODES, HTTP_STATUS } = require('./constants');

/**
 * Base Application Error
 */
class AppError extends Error {
  constructor(message, statusCode, errorCode, isOperational = true, data = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.data = data;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: {
        message: this.message,
        code: this.errorCode,
        data: this.data,
      },
      metadata: {
        timestamp: this.timestamp,
      },
    };
  }
}

/**
 * Authentication Errors
 */
class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed', errorCode = ERROR_CODES.AUTH_INVALID_CREDENTIALS, data = null) {
    super(message, HTTP_STATUS.UNAUTHORIZED, errorCode, true, data);
    this.name = 'AuthenticationError';
  }
}

class InvalidCredentialsError extends AuthenticationError {
  constructor(message = 'Invalid email or password') {
    super(message, ERROR_CODES.AUTH_INVALID_CREDENTIALS);
    this.name = 'InvalidCredentialsError';
  }
}

class AccountLockedError extends AuthenticationError {
  constructor(message = 'Account locked due to too many failed login attempts', lockoutDuration) {
    super(message, ERROR_CODES.AUTH_ACCOUNT_LOCKED, { lockoutDuration });
    this.name = 'AccountLockedError';
  }
}

class TokenExpiredError extends AuthenticationError {
  constructor(message = 'Access token has expired') {
    super(message, ERROR_CODES.AUTH_TOKEN_EXPIRED);
    this.name = 'TokenExpiredError';
  }
}

class TokenInvalidError extends AuthenticationError {
  constructor(message = 'Invalid or malformed token') {
    super(message, ERROR_CODES.AUTH_TOKEN_INVALID);
    this.name = 'TokenInvalidError';
  }
}

class MFARequiredError extends AuthenticationError {
  constructor(message = 'Two-factor authentication required', mfaToken) {
    super(message, ERROR_CODES.AUTH_MFA_REQUIRED, { mfaToken });
    this.name = 'MFARequiredError';
  }
}

class MFAInvalidError extends AuthenticationError {
  constructor(message = 'Invalid MFA token') {
    super(message, ERROR_CODES.AUTH_MFA_INVALID);
    this.name = 'MFAInvalidError';
  }
}

/**
 * Authorization Errors
 */
class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions', errorCode = ERROR_CODES.AUTHZ_INSUFFICIENT_PERMISSIONS, data = null) {
    super(message, HTTP_STATUS.FORBIDDEN, errorCode, true, data);
    this.name = 'AuthorizationError';
  }
}

class InsufficientPermissionsError extends AuthorizationError {
  constructor(message = 'You do not have permission to perform this action', requiredRole) {
    super(message, ERROR_CODES.AUTHZ_INSUFFICIENT_PERMISSIONS, { requiredRole });
    this.name = 'InsufficientPermissionsError';
  }
}

class ResourceForbiddenError extends AuthorizationError {
  constructor(message = 'Access to this resource is forbidden', resource) {
    super(message, ERROR_CODES.AUTHZ_RESOURCE_FORBIDDEN, { resource });
    this.name = 'ResourceForbiddenError';
  }
}

/**
 * Validation Errors
 */
class ValidationError extends AppError {
  constructor(message = 'Validation failed', errorCode = ERROR_CODES.VAL_INVALID_INPUT, errors = []) {
    super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, errorCode, true, { errors });
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

class InvalidInputError extends ValidationError {
  constructor(message = 'Invalid input provided', fieldErrors = []) {
    super(message, ERROR_CODES.VAL_INVALID_INPUT, fieldErrors);
    this.name = 'InvalidInputError';
  }
}

class MissingFieldError extends ValidationError {
  constructor(message = 'Required field is missing', field) {
    super(message, ERROR_CODES.VAL_MISSING_FIELD, [{ field, message: 'Field is required' }]);
    this.name = 'MissingFieldError';
  }
}

class InvalidFormatError extends ValidationError {
  constructor(message = 'Invalid format', field, expectedFormat) {
    super(message, ERROR_CODES.VAL_INVALID_FORMAT, [{ field, expectedFormat }]);
    this.name = 'InvalidFormatError';
  }
}

/**
 * Business Logic Errors
 */
class BusinessLogicError extends AppError {
  constructor(message, errorCode, statusCode = HTTP_STATUS.BAD_REQUEST, data = null) {
    super(message, statusCode, errorCode, true, data);
    this.name = 'BusinessLogicError';
  }
}

class InsufficientBalanceError extends BusinessLogicError {
  constructor(message = 'Insufficient balance', currentBalance, requiredBalance) {
    super(message, ERROR_CODES.BIZ_INSUFFICIENT_BALANCE, HTTP_STATUS.BAD_REQUEST, {
      currentBalance,
      requiredBalance,
    });
    this.name = 'InsufficientBalanceError';
  }
}

class PlanLimitExceededError extends BusinessLogicError {
  constructor(message = 'Plan limit exceeded', limitType, currentUsage, maxAllowed) {
    super(message, ERROR_CODES.BIZ_PLAN_LIMIT_EXCEEDED, HTTP_STATUS.BAD_REQUEST, {
      limitType,
      currentUsage,
      maxAllowed,
    });
    this.name = 'PlanLimitExceededError';
  }
}

class SubscriptionInactiveError extends BusinessLogicError {
  constructor(message = 'Subscription is not active', subscriptionId, status) {
    super(message, ERROR_CODES.BIZ_SUBSCRIPTION_INACTIVE, HTTP_STATUS.BAD_REQUEST, {
      subscriptionId,
      status,
    });
    this.name = 'SubscriptionInactiveError';
  }
}

class DuplicateResourceError extends BusinessLogicError {
  constructor(message = 'Resource already exists', resourceType, identifier) {
    super(message, ERROR_CODES.BIZ_DUPLICATE_RESOURCE, HTTP_STATUS.CONFLICT, {
      resourceType,
      identifier,
    });
    this.name = 'DuplicateResourceError';
  }
}

/**
 * Resource Errors
 */
class ResourceNotFoundError extends AppError {
  constructor(message = 'Resource not found', resource) {
    super(message, HTTP_STATUS.NOT_FOUND, 'RESOURCE_NOT_FOUND', true, { resource });
    this.name = 'ResourceNotFoundError';
  }
}

/**
 * Payment Errors
 */
class PaymentError extends AppError {
  constructor(message = 'Payment processing failed', errorCode = ERROR_CODES.PAY_TRANSACTION_FAILED, data = null) {
    super(message, HTTP_STATUS.BAD_REQUEST, errorCode, true, data);
    this.name = 'PaymentError';
  }
}

class PaymentGatewayError extends PaymentError {
  constructor(message = 'Payment gateway error', gateway, gatewayError) {
    super(message, ERROR_CODES.PAY_GATEWAY_ERROR, { gateway, gatewayError });
    this.name = 'PaymentGatewayError';
  }
}

class PaymentTransactionFailedError extends PaymentError {
  constructor(message = 'Payment transaction failed', transactionId, reason) {
    super(message, ERROR_CODES.PAY_TRANSACTION_FAILED, { transactionId, reason });
    this.name = 'PaymentTransactionFailedError';
  }
}

class InvalidAmountError extends PaymentError {
  constructor(message = 'Invalid payment amount', amount, minAmount, maxAmount) {
    super(message, ERROR_CODES.PAY_INVALID_AMOUNT, { amount, minAmount, maxAmount });
    this.name = 'InvalidAmountError';
  }
}

/**
 * CDR Processing Errors
 */
class CDRError extends AppError {
  constructor(message = 'CDR processing failed', errorCode = ERROR_CODES.CDR_INVALID_FORMAT, data = null) {
    super(message, HTTP_STATUS.BAD_REQUEST, errorCode, true, data);
    this.name = 'CDRError';
  }
}

class InvalidCDRFormatError extends CDRError {
  constructor(message = 'Invalid CDR format', missingFields = []) {
    super(message, ERROR_CODES.CDR_INVALID_FORMAT, { missingFields });
    this.name = 'InvalidCDRFormatError';
  }
}

class DuplicateCDRError extends CDRError {
  constructor(message = 'Duplicate CDR detected', cdrUuid) {
    super(message, ERROR_CODES.CDR_DUPLICATE, { cdrUuid });
    this.name = 'DuplicateCDRError';
  }
}

class CDRCustomerNotFoundError extends CDRError {
  constructor(message = 'Customer not found for CDR', callingNumber) {
    super(message, ERROR_CODES.CDR_CUSTOMER_NOT_FOUND, { callingNumber });
    this.name = 'CDRCustomerNotFoundError';
  }
}

/**
 * System Errors
 */
class SystemError extends AppError {
  constructor(message = 'System error occurred', errorCode = ERROR_CODES.SYS_INTERNAL_ERROR, data = null) {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, errorCode, false, data);
    this.name = 'SystemError';
  }
}

class DatabaseError extends SystemError {
  constructor(message = 'Database error', operation, originalError) {
    super(message, ERROR_CODES.SYS_DATABASE_ERROR, { operation, originalError: originalError.message });
    this.name = 'DatabaseError';
  }
}

class ExternalServiceError extends SystemError {
  constructor(message = 'External service error', service, originalError) {
    super(message, ERROR_CODES.SYS_EXTERNAL_SERVICE_ERROR, { service, originalError: originalError.message });
    this.name = 'ExternalServiceError';
  }
}

/**
 * Rate Limiting Error
 */
class RateLimitError extends AppError {
  constructor(message = 'Too many requests', retryAfter) {
    super(message, HTTP_STATUS.TOO_MANY_REQUESTS, 'RATE_LIMIT_EXCEEDED', true, { retryAfter });
    this.name = 'RateLimitError';
  }
}

module.exports = {
  AppError,
  AuthenticationError,
  InvalidCredentialsError,
  AccountLockedError,
  TokenExpiredError,
  TokenInvalidError,
  MFARequiredError,
  MFAInvalidError,
  AuthorizationError,
  InsufficientPermissionsError,
  ResourceForbiddenError,
  ValidationError,
  InvalidInputError,
  MissingFieldError,
  InvalidFormatError,
  BusinessLogicError,
  InsufficientBalanceError,
  PlanLimitExceededError,
  SubscriptionInactiveError,
  DuplicateResourceError,
  ResourceNotFoundError,
  PaymentError,
  PaymentGatewayError,
  PaymentTransactionFailedError,
  InvalidAmountError,
  CDRError,
  InvalidCDRFormatError,
  DuplicateCDRError,
  CDRCustomerNotFoundError,
  SystemError,
  DatabaseError,
  ExternalServiceError,
  RateLimitError,
};
