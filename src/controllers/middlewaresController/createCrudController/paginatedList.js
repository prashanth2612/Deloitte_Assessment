const paginatedList = async (Model, req, res) => {
  const page  = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, parseInt(req.query.items, 10) || 10);
  const skip  = (page - 1) * limit;

  const sortBy    = req.query.sortBy    || 'createdAt';
  const sortValue = parseInt(req.query.sortValue, 10) || -1;

  const { filter, equal } = req.query;
  const filterClause = filter && equal ? { [filter]: equal } : {};

  const fieldsArray = req.query.fields ? req.query.fields.split(',') : [];
  let searchClause = {};
  if (fieldsArray.length > 0 && req.query.q) {
    const regex = new RegExp(req.query.q, 'i');
    searchClause = { $or: fieldsArray.map((f) => ({ [f]: { $regex: regex } })) };
  }

  const query = { removed: false, ...filterClause, ...searchClause };

  const [result, count] = await Promise.all([
    Model.find(query).skip(skip).limit(limit).sort({ [sortBy]: sortValue }).exec(),
    Model.countDocuments(query),
  ]);

  const pages = Math.ceil(count / limit);
  const pagination = { page, pages, count };

  return res.status(200).json({
    success: true,
    result,
    pagination,
    message: count > 0 ? 'Successfully retrieved documents.' : 'No documents found.',
  });
};

module.exports = paginatedList;
