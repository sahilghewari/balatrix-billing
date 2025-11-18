/**
 * FreeSWITCH Dialplan Templates
 * Templates for generating XML dialplans with dynamic extension routing
 */

const dialplanTemplates = {
  'incoming_generic': {
    name: 'Generic Incoming Call',
    description: 'Standard template for routing incoming calls to extensions',
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<document type="freeswitch/xml">
  <section name="dialplan">
    <context name="public">
      <extension name="incoming_generic">
        <condition field="destination_number" expression="^\${destination_number}$">
          <action application="set" data="hangup_after_bridge=true"/>
          <action application="set" data="continue_on_fail=true"/>
          <action application="set" data="call_timeout=10"/>
          <action application="bridge" data="{fail_on_single_reject=true,hangup_after_bridge=true,ignore_early_media=true}sofia/internal/{{extension}}@10.10.0.4"/>
          <action application="answer"/>
          <action application="playback" data="/opt/ext_na.wav"/>
          <action application="hangup" data="NORMAL_CLEARING"/>
        </condition>
      </extension>
    </context>
  </section>
</document>`,
    placeholders: ['extension']
  },

  'incoming_with_ivr_fallback': {
    name: 'IVR Fallback',
    description: 'Routes to extension first, falls back to IVR if extension unavailable',
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<document type="freeswitch/xml">
  <section name="dialplan">
    <context name="public">
      <extension name="incoming_ivr_fallback">
        <condition field="destination_number" expression="^\${destination_number}$">
          <action application="set" data="hangup_after_bridge=true"/>
          <action application="set" data="continue_on_fail=true"/>
          <action application="set" data="call_timeout=10"/>
          <action application="bridge" data="{fail_on_single_reject=true,hangup_after_bridge=true,ignore_early_media=true}sofia/internal/{{extension}}@10.10.0.4"/>
          <action application="answer"/>
          <action application="playback" data="/opt/ivr_welcome.wav"/>
          <action application="ivr" data="main_menu"/>
          <action application="hangup" data="NORMAL_CLEARING"/>
        </condition>
      </extension>
    </context>
  </section>
</document>`,
    placeholders: ['extension']
  },

  'incoming_queue': {
    name: 'Call Queue',
    description: 'Routes calls to a call queue instead of direct extension',
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<document type="freeswitch/xml">
  <section name="dialplan">
    <context name="public">
      <extension name="incoming_queue">
        <condition field="destination_number" expression="^\${destination_number}$">
          <action application="set" data="hangup_after_bridge=true"/>
          <action application="set" data="continue_on_fail=true"/>
          <action application="set" data="call_timeout=30"/>
          <action application="callcenter" data="support_queue"/>
          <action application="answer"/>
          <action application="playback" data="/opt/queue_full.wav"/>
          <action application="hangup" data="NORMAL_CLEARING"/>
        </condition>
      </extension>
    </context>
  </section>
</document>`,
    placeholders: []
  },

  'incoming_voicemail': {
    name: 'Direct Voicemail',
    description: 'Routes directly to voicemail for the specified extension',
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<document type="freeswitch/xml">
  <section name="dialplan">
    <context name="public">
      <extension name="incoming_voicemail">
        <condition field="destination_number" expression="^\${destination_number}$">
          <action application="set" data="hangup_after_bridge=true"/>
          <action application="set" data="continue_on_fail=true"/>
          <action application="answer"/>
          <action application="voicemail" data="default \${domain} {{extension}}"/>
          <action application="hangup" data="NORMAL_CLEARING"/>
        </condition>
      </extension>
    </context>
  </section>
</document>`,
    placeholders: ['extension']
  }
};

/**
 * Get all available templates
 */
const getAllTemplates = () => {
  return Object.keys(dialplanTemplates).map(key => ({
    id: key,
    name: dialplanTemplates[key].name,
    description: dialplanTemplates[key].description,
    placeholders: dialplanTemplates[key].placeholders
  }));
};

/**
 * Get a specific template by ID
 */
const getTemplate = (templateId) => {
  return dialplanTemplates[templateId] || null;
};

/**
 * Generate XML from template with replacements
 */
const generateXmlFromTemplate = (templateId, replacements = {}) => {
  const template = getTemplate(templateId);
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  let xml = template.xml;

  // Replace placeholders
  template.placeholders.forEach(placeholder => {
    const value = replacements[placeholder];
    if (value === undefined) {
      throw new Error(`Missing replacement for placeholder: ${placeholder}`);
    }
    xml = xml.replace(new RegExp(`{{${placeholder}}}`, 'g'), value);
  });

  return xml;
};

module.exports = {
  dialplanTemplates,
  getAllTemplates,
  getTemplate,
  generateXmlFromTemplate
};