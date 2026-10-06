// Vercel serverless entry — wraps the Express app as a function.
// Root package.json is ESM ("type": "module") while backend/src is
// CommonJS, so load it through createRequire. Imports app (no listen),
// NOT backend/src/server.js. connectDB() caches its promise at module
// level, so warm invocations reuse the Mongo connection.
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const app = require('../backend/src/app.js');
const { connectDB } = require('../backend/src/config/db.js');

let ready = null;

export default async function handler(req, res) {
  try {
    if (!ready) ready = connectDB();
    await ready;
    return app(req, res);
  } catch (err) {
    // Reset so the next invocation retries the connection instead of
    // reusing a rejected promise.
    ready = null;
    return res.status(500).json({ success: false, message: 'Service unavailable' });
  }
}
