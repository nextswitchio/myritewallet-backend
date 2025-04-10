module.exports = (req, res, next) => {
  try {
    const { page, limit } = req.query;

    // Validate `page` and `limit` are positive integers
    if (page && (!Number.isInteger(Number(page)) || Number(page) <= 0)) {
      return res.status(400).json({ error: '`page` must be a positive integer' });
    }

    if (limit && (!Number.isInteger(Number(limit)) || Number(limit) <= 0)) {
      return res.status(400).json({ error: '`limit` must be a positive integer' });
    }

    // Set default values if not provided
    req.query.page = page ? Number(page) : 1;
    req.query.limit = limit ? Number(limit) : 10;

    next();
  } catch (err) {
    console.error('Error validating pagination:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};