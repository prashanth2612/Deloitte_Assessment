const useAppSettings = () => {
  let settings = {};
  settings['idurar_app_email'] = process.env.MAIL_FROM || 'no-reply@coffewithcorporates.com';
  settings['idurar_base_url'] = process.env.PUBLIC_SERVER_FILE || 'http://localhost:8888';
  return settings;
};

module.exports = useAppSettings;
