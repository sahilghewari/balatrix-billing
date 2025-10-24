/**
 * Validation Middleware
 * Request validation using Joi schemas
 */

const Joi = require('joi');
const { REGEX_PATTERNS: REGEX, SECURITY } = require('../utils/constants');
const { validationErrorResponse } = require('../utils/responseHandler');

/**
 * Validate request against Joi schema
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const dataToValidate = req[source];

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // Return all errors
      stripUnknown: true, // Remove unknown fields
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type,
      }));

      return validationErrorResponse(res, 'Validation failed', errors);
    }

    // Replace req data with validated and sanitized data
    req[source] = value;
    next();
  };
};

/**
 * Validation schemas
 */
const schemas = {
  // Authentication schemas
  register: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),
    password: Joi.string()
      .min(12)
      .pattern(SECURITY.PASSWORD_REGEX)
      .required()
      .messages({
        'string.min': 'Password must be at least 12 characters long',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'Password is required',
      }),
    firstName: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.min': 'First name must be at least 2 characters',
        'string.max': 'First name cannot exceed 50 characters',
        'any.required': 'First name is required',
      }),
    lastName: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.min': 'Last name must be at least 2 characters',
        'string.max': 'Last name cannot exceed 50 characters',
        'any.required': 'Last name is required',
      }),
    phoneNumber: Joi.string()
      .pattern(REGEX.PHONE_E164)
      .required()
      .messages({
        'string.pattern.base': 'Please provide a valid phone number in E.164 format (e.g., +919876543210)',
        'any.required': 'Phone number is required',
      }),
    role: Joi.string()
      .valid('admin', 'customer', 'support')
      .default('customer'),
  }),

  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required',
      }),
    mfaCode: Joi.string()
      .length(6)
      .pattern(/^[0-9]+$/)
      .optional()
      .messages({
        'string.length': 'MFA code must be 6 digits',
        'string.pattern.base': 'MFA code must contain only numbers',
      }),
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string()
      .required()
      .messages({
        'any.required': 'Refresh token is required',
      }),
  }),

  forgotPassword: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),
  }),

  resetPassword: Joi.object({
    token: Joi.string()
      .required()
      .messages({
        'any.required': 'Reset token is required',
      }),
    password: Joi.string()
      .min(12)
      .pattern(SECURITY.PASSWORD_REGEX)
      .required()
      .messages({
        'string.min': 'Password must be at least 12 characters long',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'Password is required',
      }),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string()
      .required()
      .messages({
        'any.required': 'Current password is required',
      }),
    newPassword: Joi.string()
      .min(12)
      .pattern(SECURITY.PASSWORD_REGEX)
      .required()
      .messages({
        'string.min': 'Password must be at least 12 characters long',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'New password is required',
      }),
  }),

  verifyMFA: Joi.object({
    code: Joi.string()
      .length(6)
      .pattern(/^[0-9]+$/)
      .required()
      .messages({
        'string.length': 'MFA code must be 6 digits',
        'string.pattern.base': 'MFA code must contain only numbers',
        'any.required': 'MFA code is required',
      }),
  }),

  // Customer schemas
  createCustomer: Joi.object({
    companyName: Joi.string()
      .min(2)
      .max(100)
      .required(),
    displayName: Joi.string()
      .max(100)
      .optional(),
    gstin: Joi.string()
      .length(15)
      .pattern(REGEX.GSTIN)
      .optional()
      .allow(null, ''),
    pan: Joi.string()
      .length(10)
      .pattern(REGEX.PAN)
      .optional()
      .allow(null, ''),
    billingAddress: Joi.object({
      addressLine1: Joi.string().required(),
      addressLine2: Joi.string().optional().allow(''),
      city: Joi.string().required(),
      state: Joi.string().required(),
      postalCode: Joi.string().required(),
      country: Joi.string().default('India'),
    }).required(),
    shippingAddress: Joi.object({
      addressLine1: Joi.string().required(),
      addressLine2: Joi.string().optional().allow(''),
      city: Joi.string().required(),
      state: Joi.string().required(),
      postalCode: Joi.string().required(),
      country: Joi.string().default('India'),
    }).optional(),
    creditLimit: Joi.number()
      .min(0)
      .default(0),
    preferredPaymentGateway: Joi.string()
      .valid('razorpay', 'stripe')
      .default('razorpay'),
  }),

  updateCustomer: Joi.object({
    companyName: Joi.string().min(2).max(100).optional(),
    displayName: Joi.string().max(100).optional(),
    gstin: Joi.string().length(15).pattern(REGEX.GSTIN).optional().allow(null, ''),
    pan: Joi.string().length(10).pattern(REGEX.PAN).optional().allow(null, ''),
    billingAddress: Joi.object({
      addressLine1: Joi.string().required(),
      addressLine2: Joi.string().optional().allow(''),
      city: Joi.string().required(),
      state: Joi.string().required(),
      postalCode: Joi.string().required(),
      country: Joi.string().default('India'),
    }).optional(),
    shippingAddress: Joi.object({
      addressLine1: Joi.string().required(),
      addressLine2: Joi.string().optional().allow(''),
      city: Joi.string().required(),
      state: Joi.string().required(),
      postalCode: Joi.string().required(),
      country: Joi.string().default('India'),
    }).optional(),
    creditLimit: Joi.number().min(0).optional(),
    preferredPaymentGateway: Joi.string().valid('razorpay', 'stripe').optional(),
  }).min(1), // At least one field must be provided

  // Subscription schemas
  createSubscription: Joi.object({
    customerId: Joi.string().uuid().required(),
    ratePlanId: Joi.string().uuid().required(),
    billingCycle: Joi.string()
      .valid('monthly', 'annual')
      .default('monthly'),
    autoRenew: Joi.boolean().default(true),
    trialDays: Joi.number().min(0).max(90).default(0),
  }),

  updateSubscription: Joi.object({
    ratePlanId: Joi.string().uuid().optional(),
    billingCycle: Joi.string().valid('monthly', 'annual').optional(),
    autoRenew: Joi.boolean().optional(),
  }).min(1),

  // Payment schemas
  createPayment: Joi.object({
    amount: Joi.number().positive().required(),
    currency: Joi.string().length(3).default('INR'),
    paymentMethodId: Joi.string().uuid().optional(),
    customerId: Joi.string().uuid().required(),
    subscriptionId: Joi.string().uuid().optional(),
    invoiceId: Joi.string().uuid().optional(),
  }),

  // CDR schemas
  submitCDR: Joi.object({
    uuid: Joi.string().required(),
    callingNumber: Joi.string().pattern(REGEX.PHONE_E164).required(),
    calledNumber: Joi.string().pattern(REGEX.PHONE_E164).required(),
    callStartTime: Joi.date().iso().required(),
    callAnswerTime: Joi.date().iso().optional(),
    callEndTime: Joi.date().iso().required(),
    duration: Joi.number().integer().min(0).required(),
    billsec: Joi.number().integer().min(0).required(),
    hangupCause: Joi.string().required(),
    direction: Joi.string().valid('inbound', 'outbound').required(),
    accountId: Joi.string().uuid().required(),
    didId: Joi.string().uuid().optional(),
  }),

  // Pagination and filtering
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC'),
  }),

  dateRange: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
  }),

  // Extension schemas
  createExtension: Joi.object({
    tenantId: Joi.string().uuid().required()
      .messages({
        'any.required': 'Tenant ID is required',
        'string.uuid': 'Tenant ID must be a valid UUID',
      }),
    extension: Joi.string().pattern(/^[0-9]{3,10}$/).required()
      .messages({
        'any.required': 'Extension number is required',
        'string.pattern.base': 'Extension must be 3-10 digits',
      }),
    password: Joi.string().min(6).max(255).required()
      .messages({
        'any.required': 'Password is required',
        'string.min': 'Password must be at least 6 characters',
        'string.max': 'Password must be less than 255 characters',
      }),
    displayName: Joi.string().max(100).optional()
      .messages({
        'string.max': 'Display name must be less than 100 characters',
      }),
    config: Joi.object().optional(),
  }),

  updateExtension: Joi.object({
    extension: Joi.string().pattern(/^[0-9]{3,10}$/).optional()
      .messages({
        'string.pattern.base': 'Extension must be 3-10 digits',
      }),
    password: Joi.string().min(6).max(255).optional()
      .messages({
        'string.min': 'Password must be at least 6 characters',
        'string.max': 'Password must be less than 255 characters',
      }),
    displayName: Joi.string().max(100).optional()
      .messages({
        'string.max': 'Display name must be less than 100 characters',
      }),
    isActive: Joi.boolean().optional(),
    config: Joi.object().optional(),
  }).min(1),

  resetExtensionPassword: Joi.object({
    newPassword: Joi.string().min(6).max(255).required()
      .messages({
        'any.required': 'New password is required',
        'string.min': 'Password must be at least 6 characters',
        'string.max': 'Password must be less than 255 characters',
      }),
  }),
};

/**
 * Validation middleware functions
 */
const validateExtension = validate(schemas.createExtension);
const validateExtensionUpdate = validate(schemas.updateExtension);
const validateResetExtensionPassword = validate(schemas.resetExtensionPassword);

module.exports = {
  validate,
  schemas,
  validateExtension,
  validateExtensionUpdate,
  validateResetExtensionPassword,
};
