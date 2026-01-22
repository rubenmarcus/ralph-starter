import { createServer, type Server, type IncomingMessage, type ServerResponse } from 'node:http';
import { URL } from 'node:url';

export interface OAuthCallbackResult {
  code: string;
  state?: string;
}

export interface OAuthServerOptions {
  port: number;
  timeoutMs?: number;
  successHtml?: string;
  errorHtml?: string;
}

const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

const DEFAULT_SUCCESS_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Authentication Successful</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .container {
      background: white;
      padding: 2rem 3rem;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      text-align: center;
    }
    h1 {
      color: #22c55e;
      margin-bottom: 0.5rem;
    }
    p {
      color: #64748b;
      margin-top: 0;
    }
    .icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">✓</div>
    <h1>Authentication Successful!</h1>
    <p>You can close this window and return to the terminal.</p>
  </div>
</body>
</html>
`;

const DEFAULT_ERROR_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Authentication Failed</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    }
    .container {
      background: white;
      padding: 2rem 3rem;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      text-align: center;
    }
    h1 {
      color: #ef4444;
      margin-bottom: 0.5rem;
    }
    p {
      color: #64748b;
      margin-top: 0;
    }
    .icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">✗</div>
    <h1>Authentication Failed</h1>
    <p>{{ERROR_MESSAGE}}</p>
    <p>Please close this window and try again.</p>
  </div>
</body>
</html>
`;

/**
 * Start a local HTTP server to receive OAuth callbacks
 * Returns a promise that resolves with the authorization code
 */
export function startOAuthServer(options: OAuthServerOptions): Promise<OAuthCallbackResult> {
  const {
    port,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    successHtml = DEFAULT_SUCCESS_HTML,
    errorHtml = DEFAULT_ERROR_HTML,
  } = options;

  return new Promise((resolve, reject) => {
    let server: Server | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (server) {
        server.close();
        server = null;
      }
    };

    const handleRequest = (req: IncomingMessage, res: ServerResponse) => {
      const reqUrl = new URL(req.url || '/', `http://localhost:${port}`);

      // Only handle the callback path
      if (reqUrl.pathname !== '/callback') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
        return;
      }

      const code = reqUrl.searchParams.get('code');
      const state = reqUrl.searchParams.get('state');
      const error = reqUrl.searchParams.get('error');
      const errorDescription = reqUrl.searchParams.get('error_description');

      if (error) {
        const errorMessage = errorDescription || error;
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(errorHtml.replace('{{ERROR_MESSAGE}}', errorMessage));
        cleanup();
        reject(new Error(`OAuth error: ${errorMessage}`));
        return;
      }

      if (!code) {
        const errorMessage = 'No authorization code received';
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(errorHtml.replace('{{ERROR_MESSAGE}}', errorMessage));
        cleanup();
        reject(new Error(errorMessage));
        return;
      }

      // Success!
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(successHtml);

      cleanup();
      resolve({ code, state: state || undefined });
    };

    server = createServer(handleRequest);

    server.on('error', (err) => {
      cleanup();
      reject(new Error(`Failed to start OAuth server: ${err.message}`));
    });

    server.listen(port, '127.0.0.1', () => {
      // Set timeout
      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('OAuth authentication timed out. Please try again.'));
      }, timeoutMs);
    });
  });
}

/**
 * Get the callback URL for an OAuth server on a given port
 */
export function getCallbackUrl(port: number): string {
  return `http://127.0.0.1:${port}/callback`;
}
