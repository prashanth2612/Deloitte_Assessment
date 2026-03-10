const filter = async (Model, req, res) => {
  if (req.query.filter === undefined || req.query.equall === undefined) {
    return res.status(403).json({
      success: false,
      result: null,
      message: 'Filter is not Provided Properly',
    });
  }

  const result = await Model.find({
    removed: false,
  })
    .where(req.query.filter)
    .equals(req.query.equal)
    .exec();

  if (!result) {
    return res.status(400).json({
      success: false,
      result: null,
      message: 'No Document Found',
    });
  } else {
    return res.status(200).json({
      success: true,
      result,
      message: 'SucessFully Found All Documents',
    });
  }
};

module.exports = filter;
