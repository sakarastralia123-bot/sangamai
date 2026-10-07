// Vercel serverless entry — wraps the Express app as a function.
// IMPORTANT: imports app (no listen), NOT src/server.js.
// connectDB() caches its promise at module level, so warm invocations
// reuse the existing Mongo connection instead of reconnecting.
const app = require('../src/app');
const { connectDB } = require('../src/config/db');

let ready = null;

module.exports = async (req, res) => {
  try {
    if (!ready) ready = connectDB();
    await ready;
    return app(req, res);
  } catch (err) {
    // connectDB exits the process on failure in long-lived servers;
    // in serverless we must answer the request instead. Reset so the
    // next invocation retries the connection.
    ready = null;
    return res.status(500).json({ success: false, message: 'Service unavailable' });
  }
};
