const listAllSettings = require('./listAllSettings');

/**
 * Load all settings as a flat object keyed by settingKey.
 * Also creates alias entries for legacy key names (with/without 'idurar_' prefix)
 * so that code using either convention works correctly.
 */
const loadSettings = async () => {
  const allSettings = {};
  const datas = await listAllSettings();
  datas.forEach(({ settingKey, settingValue }) => {
    allSettings[settingKey] = settingValue;

    // Alias: '_app_X' <-> 'idurar_app_X'
    if (settingKey.startsWith('idurar_app_')) {
      const legacyKey = settingKey.replace('idurar_app_', '_app_');
      if (!(legacyKey in allSettings)) allSettings[legacyKey] = settingValue;
    } else if (settingKey.startsWith('_app_')) {
      const modernKey = settingKey.replace('_app_', 'idurar_app_');
      if (!(modernKey in allSettings)) allSettings[modernKey] = settingValue;
    }
  });
  return allSettings;
};

module.exports = loadSettings;
