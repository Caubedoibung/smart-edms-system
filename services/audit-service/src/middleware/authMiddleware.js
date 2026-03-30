const authMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const validKey = process.env.AUDIT_SECRET_KEY || 'SmartEDMS_SuperSecret_2026';

  if (!apiKey || apiKey !== validKey) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing API Key' });
  }

  next();
};

module.exports = authMiddleware;
