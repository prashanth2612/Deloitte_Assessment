const useDate = ({ settings }) => {
  // Support both old key ('_app_date_format') and new key ('idurar_app_date_format')
  const dateFormat =
    settings['idurar_app_date_format'] || settings['_app_date_format'] || 'DD/MM/YYYY';

  return {
    dateFormat,
  };
};

module.exports = useDate;
