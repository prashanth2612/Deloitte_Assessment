const { migrate } = require('./migrate');

const read = async (Model, req, res) => {
  // Populate people and company sub-docs so all fields (email, phone, address, country) are available
  let result = await Model.findOne({
    _id: req.params.id,
    removed: false,
  })
    .populate('people')
    .populate('company')
    .exec();

  if (!result) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'No document found',
    });
  }

  const migratedData = migrate(result);

  return res.status(200).json({
    success: true,
    result: migratedData,
    message: 'we found this document',
  });
};

module.exports = read;