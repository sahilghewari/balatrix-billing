const express = require('express');
const router = express.Router();

const { TollFreeNumber, RoutingRule, Extension, Customer, DialplanXml } = require('../models');
const { authenticate } = require('../middleware/auth');
const { successResponse, errorResponse, forbiddenResponse, notFoundResponse } = require('../utils/responseHandler');
const logger = require('../utils/logger');
const { generateXmlFromTemplate, getAllTemplates } = require('../utils/dialplanTemplates');

/**
 * Get available dialplan templates
 * GET /api/routing/templates
 */
router.get('/templates', (req, res) => {
	try {
		const templates = getAllTemplates();
		return successResponse(res, templates, 'Templates retrieved successfully');
	} catch (error) {
		logger.logError(error, { context: 'Routing.getTemplates' });
		return errorResponse(res, 'Failed to retrieve templates');
	}
});

/**
 * Resolve routing for an inbound call
 * Expected body: { number: "+18001234567" }
 * This endpoint is intended to be called by the SIP proxy (Kamailio) during call setup.
 * It returns the first matching active routing rule (by priority) or a simple forwarding target
 * stored on the TollFreeNumber.config as a fallback.
 */
router.post('/resolve', async (req, res) => {
	try {
		// Log incoming resolve request
		logger.logRequest(req, 'Routing resolve called');
		logger.info('Routing.resolve.payload', { body: req.body });
		const { number } = req.body;

		if (!number) {
			logger.warn('Routing.resolve.missing_number', { body: req.body });
			return errorResponse(res, 'Missing number in request', 400);
		}

		const tfn = await TollFreeNumber.findOne({ where: { number } });
		logger.info('Routing.resolve.tfn.lookup', { number, found: !!tfn, tfnId: tfn?.id });
		if (!tfn) {
			return successResponse(res, { action: 'none' }, 'No matching toll-free number');
		}

			// Try routing rules first (if table exists)
			try {
				if (RoutingRule && typeof RoutingRule.findActiveByNumber === 'function') {
					const rules = await RoutingRule.findActiveByNumber(tfn.id);
					if (rules && rules.length > 0) {
						logger.info('Routing.resolve.rules_found', { count: rules.length, tfnId: tfn.id });
						const rule = rules[0]; // highest priority
						// If rule points to an extension, return extension target
						if (rule.ruleType === 'extension') {
							const extVal = (rule.actions && (rule.actions.extension || rule.actions.extensionId)) || null;
							if (extVal) {
								logger.info('Routing.resolve.rule_target', { ruleId: rule.id, extension: extVal });
								return successResponse(res, {
									action: 'route',
									target: { type: 'extension', value: extVal },
									tenantId: rule.tenantId,
									ruleId: rule.id,
								}, 'Routing rule matched');
							}
						}

						// Other rule types (ivr/queue) can be expanded here
						return successResponse(res, { action: 'none' }, 'Routing rule found but no actionable target');
					}
				}
			} catch (err) {
				// If the RoutingRule table doesn't exist, log and continue using fallback
				logger.logError(err, { context: 'Routing.resolve.RoutingRuleLookup' });
				logger.warn('RoutingRule lookup failed (table may be missing), falling back to TollFreeNumber.config', { err: err.message });
			}

		// Fallback: check simple config on the TollFreeNumber (quick test mapping)
		if (tfn.config && tfn.config.forwardToExtension) {
			logger.info('Routing.resolve.fallback_config', { tfnId: tfn.id, forwardToExtension: tfn.config.forwardToExtension });
			return successResponse(res, {
				action: 'route',
				target: { type: 'extension', value: tfn.config.forwardToExtension },
				tenantId: tfn.tenantId,
			}, 'ForwardToExtension mapping returned from toll-free config');
		}

		return successResponse(res, { action: 'none' }, 'No routing configured');
	} catch (error) {
		logger.logError(error, { context: 'Routing.resolve' });
		return errorResponse(res, 'Routing resolve failed');
	}
});


/**
 * Customer/tenant-scoped mapping setter
 * Set a simple extension-forward mapping for a toll-free number.
 * Body: { extension: '100101', template: 'incoming_generic' }
 */
router.post('/toll-free-numbers/:id/route', authenticate, async (req, res) => {
	try {
		// Log the incoming request and user context
		logger.logRequest(req, 'Set routing mapping called');
		logger.info('Routing.setMapping.payload', { params: req.params, body: req.body, userId: req.userId, userRole: req.userRole });

		const id = req.params.id;
		const { extension, template = 'incoming_generic' } = req.body;

		if (!extension) {
			logger.warn('Routing.setMapping.missing_extension', { id, body: req.body });
			return errorResponse(res, 'Missing extension in request', 400);
		}

		const tfn = await TollFreeNumber.findByPk(id);
		logger.info('Routing.setMapping.tfn_lookup', { id, found: !!tfn, tfnId: tfn?.id });
		if (!tfn) {
			return notFoundResponse(res, 'Toll-free number not found');
		}

		// Admins (super_admin/admin) may bypass tenant check
		if (!['super_admin', 'admin'].includes(req.userRole)) {
			// Find customer record for this user to determine tenant ownership
			const customer = await Customer.findOne({ where: { userId: req.userId } });
			if (!customer) {
				return forbiddenResponse(res, 'Only customers or admins can modify routing for their numbers');
			}

			if (String(customer.tenantId) !== String(tfn.tenantId)) {
				return forbiddenResponse(res, 'You do not own this toll-free number');
			}
		}

		// Validate extension exists and belongs to tenant (best-effort)
		const extRecord = await Extension.findOne({ where: { extension, tenantId: tfn.tenantId, isActive: true } });
		logger.info('Routing.setMapping.extension_lookup', { extension, found: !!extRecord, tenantId: tfn.tenantId });
		if (!extRecord) {
			return notFoundResponse(res, 'Target extension not found for this tenant');
		}

		// Create or update a simple routing rule of type 'extension' with priority 1
		let rule = null;
		try {
			if (RoutingRule && typeof RoutingRule.findOne === 'function') {
				logger.info('Routing.setMapping.attempt_rule_persist', { tfnId: tfn.id });
				rule = await RoutingRule.findOne({ where: { tollFreeNumberId: tfn.id, ruleType: 'extension' } });
				logger.info('Routing.setMapping.existing_rule', { rule: !!rule, ruleId: rule?.id });
				if (rule) {
					rule.actions = { extension };
					rule.isActive = true;
					rule.tenantId = tfn.tenantId;
					await rule.save();
					logger.info('Routing.setMapping.rule_updated', { ruleId: rule.id, tfnId: tfn.id, extension });
				} else {
					rule = await RoutingRule.create({
						tollFreeNumberId: tfn.id,
						tenantId: tfn.tenantId,
						ruleType: 'extension',
						priority: 1,
						actions: { extension },
						isActive: true,
					});
					logger.info('Routing.setMapping.rule_created', { ruleId: rule.id, tfnId: tfn.id, extension });
				}
			}
		} catch (err) {
			// Table might not exist (common during initial dev). Log and continue with config-only persistence.
			logger.logError(err, { context: 'Routing.setMapping.RoutingRulePersist' });
			logger.warn('RoutingRule persistence failed (table may be missing). Saved mapping to TollFreeNumber.config only.', { err: err.message });
		}

		// Also update quick config for easier testing compatibility
		tfn.config = { ...(tfn.config || {}), forwardToExtension: extension, template };
		await tfn.save();

		// Generate and save FreeSWITCH dialplan XML using selected template
		try {
			const replacements = {};
			const templateInfo = require('../utils/dialplanTemplates').getTemplate(template);
			if (templateInfo.placeholders.includes('extension')) {
				replacements.extension = extension;
			}
			const xmlContent = generateXmlFromTemplate(template, replacements);
			await DialplanXml.upsertByNumber(
				BigInt(tfn.number.replace(/^\+/, '')), // Remove + if present
				template,
				xmlContent,
				`Routing for ${tfn.number} using template ${template}${replacements.extension ? ` to extension ${extension}` : ''}`
			);
			logger.info('Routing.setMapping.xml_saved', { dialplanId: BigInt(tfn.number.replace(/^\+/, '')), template, extension: replacements.extension });
		} catch (err) {
			logger.logError(err, { context: 'Routing.setMapping.XmlSave' });
			// Don't fail the whole request if XML save fails
		}

		logger.info('Routing.setMapping.completed', { tfnId: tfn.id, ruleId: rule?.id || null });
		return successResponse(res, { rule: rule || null, tollFreeNumber: tfn }, 'Routing mapping saved (config updated)');
	} catch (error) {
		logger.logError(error, { context: 'Routing.setMapping' });
		return errorResponse(res, 'Failed to set routing mapping');
	}
});

module.exports = router;
