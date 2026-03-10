const { migrate } = require('./migrate');

const paginatedList = async (Model, req, res) => {
  const page = req.query.page || 1;
  const limit = parseInt(req.query.items) || 10;
  const skip = page * limit - limit;

  const { sortBy = 'enabled', sortValue = -1, filter, equal } = req.query;

  const fieldsArray = req.query.fields ? req.query.fields.split(',') : [];
  let fields = fieldsArray.length === 0 ? {} : { $or: [] };
  for (const field of fieldsArray) {
    fields.$or.push({ [field]: { $regex: new RegExp(req.query.q, 'i') } });
  }

  const query = { removed: false, [filter]: equal, ...fields };

  const resultsPromise = Model.find(query)
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortValue })
    .populate('people')
    .populate('company')
    .exec();

  const countPromise = Model.countDocuments(query);
  const [result, count] = await Promise.all([resultsPromise, countPromise]);

  const pages = Math.ceil(count / limit);
  const pagination = { page, pages, count };

  if (count > 0) {
    const migratedData = result.map((x) => migrate(x));
    return res.status(200).json({
      success: true,
      result: migratedData,
      pagination,
      message: 'Successfully found all documents',
    });
  } else {
    return res.status(203).json({
      success: true,
      result: [],
      pagination,
      message: 'Collection is Empty',
    });
  }
};

module.exports = paginatedList;