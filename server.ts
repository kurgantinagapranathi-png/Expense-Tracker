import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Server-side Proxy for n8n Webhook: Completely eliminates CORS "Failed to fetch" in browser
  app.post('/api/n8n-chat', async (req, res) => {
    try {
      const { webhookUrl, chatInput, message, sessionId, context } = req.body;
      const targetUrl =
        webhookUrl ||
        'https://pranathi2007.app.n8n.cloud/webhook/fd742814-53d4-47f0-9351-77128c49fd9a/chat:';

      const payload = {
        chatInput: chatInput || message || '',
        message: message || chatInput || '',
        sessionId: sessionId || 'default-session',
        context: context || {},
      };

      // Try targetUrl first, then alternate (without/with trailing colon)
      const urlsToTry = [targetUrl];
      const altUrl = targetUrl.endsWith(':') ? targetUrl.slice(0, -1) : `${targetUrl}:`;
      if (!urlsToTry.includes(altUrl)) urlsToTry.push(altUrl);

      let lastStatus = 404;
      let lastBody: any = null;
      let successfulData: any = null;

      for (const url of urlsToTry) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 6000);
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json, text/plain, */*',
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });
          clearTimeout(timeout);

          lastStatus = response.status;
          const text = await response.text();
          try {
            lastBody = JSON.parse(text);
          } catch {
            lastBody = text;
          }

          if (response.ok) {
            successfulData = lastBody;
            break;
          }
        } catch (err: any) {
          lastBody = { error: err.message };
        }
      }

      if (successfulData !== null) {
        if (typeof successfulData === 'string') {
          return res.json({ output: successfulData });
        }
        return res.json(successfulData);
      }

      // If n8n returned 500 (e.g. Error in workflow) or 404 (draft mode)
      return res.status(200).json({
        output: lastBody?.message || lastBody?.hint || 'n8n workflow error',
        status: lastStatus,
        n8nError: lastBody?.message || 'Error in workflow',
        hint: lastBody?.hint,
      });
    } catch (err: any) {
      console.error('Proxy error:', err);
      return res.status(200).json({
        output: 'Proxy connection error',
        error: err.message || 'Internal proxy error',
        n8nError: 'Proxy connection error',
      });
    }
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: Date.now() });
  });

  // Mount Vite middleware for dev or static for prod
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
