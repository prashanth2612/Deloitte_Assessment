const create = async (Model, req, res) => {
  try {
    req.body.removed = false;
    const result = await new Model({ ...req.body }).save();
    return res.status(201).json({
      success: true,
      result,
      message: 'Successfully created the document.',
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Validation failed. Check required fields.',
        errorMessage: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      result: null,
      message: 'An error occurred while creating the document.',
      errorMessage: error.message,
    });
  }
};

module.exports = create;
