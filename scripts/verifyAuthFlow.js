const { spawn } = require('child_process');
const path = require('path');
const { setTimeout: delay } = require('timers/promises');

process.env.MONGOMS_DOWNLOAD_DIR = path.join(
  __dirname,
  '..',
  'node_modules',
  '.cache',
  'mongodb-memory-server'
);

const { MongoMemoryServer } = require('mongodb-memory-server');

const serverPath = path.join(__dirname, '..', 'server', 'server.js');
const apiBaseUrl = 'http://127.0.0.1:5050';

const cookieJar = new Map();

const updateCookieJar = (response) => {
  const setCookies =
    typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : [];

  for (const cookie of setCookies) {
    const [pair] = cookie.split(';');
    const [name, value] = pair.split('=');

    if (!value) {
      cookieJar.delete(name);
      continue;
    }

    cookieJar.set(name, value);
  }
};

const buildCookieHeader = () =>
  Array.from(cookieJar.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');

const request = async (pathname, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const cookieHeader = buildCookieHeader();

  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }

  const response = await fetch(`${apiBaseUrl}${pathname}`, {
    ...options,
    headers
  });

  updateCookieJar(response);
  return response;
};

const assertStatus = async (response, expectedStatus, label) => {
  if (response.status !== expectedStatus) {
    const body = await response.text();
    throw new Error(`${label} failed. Expected ${expectedStatus}, received ${response.status}. Body: ${body}`);
  }
};

const waitForServer = async () => {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${apiBaseUrl}/api/health`);

      if (response.ok) {
        return;
      }
    } catch (error) {
      // Server not ready yet.
    }

    await delay(1000);
  }

  throw new Error('Server did not become ready in time.');
};

const main = async () => {
  console.log('Starting in-memory MongoDB...');
  const mongoServer = await MongoMemoryServer.create();
  console.log(`MongoDB ready at ${mongoServer.getUri('pathfinder')}`);

  const child = spawn(process.execPath, [serverPath], {
    env: {
      ...process.env,
      PORT: '5050',
      MONGO_URI: mongoServer.getUri('pathfinder'),
      JWT_ACCESS_SECRET: 'test-access-secret-for-verification-only',
      JWT_REFRESH_SECRET: 'test-refresh-secret-for-verification-only',
      CLIENT_URL: 'http://localhost:5173',
      BREVO_API_KEY: 'test-brevo-key-not-used-in-auth-flow',
      BREVO_SENDER_EMAIL: 'noreply@example.com',
      BREVO_SENDER_NAME: 'PathFinder Test',
      NODE_ENV: 'development'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  child.stdout.on('data', (chunk) => {
    process.stdout.write(chunk);
  });

  child.stderr.on('data', (chunk) => {
    process.stderr.write(chunk);
  });

  try {
    console.log('Waiting for API health check...');
    await waitForServer();
    console.log('API is responding. Running auth flow...');

    const credentials = {
      name: 'Test Student',
      email: 'student@example.com',
      password: 'SecurePass123'
    };

    let response = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    await assertStatus(response, 201, 'Register');
    console.log('Register ok');

    response = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password
      })
    });
    await assertStatus(response, 200, 'Login');
    console.log('Login ok');

    response = await request('/api/auth/me', {
      method: 'GET'
    });
    await assertStatus(response, 200, 'Current user');
    console.log('/me ok');

    response = await request('/api/auth/refresh', {
      method: 'POST'
    });
    await assertStatus(response, 200, 'Refresh');
    console.log('Refresh ok');

    response = await request('/api/auth/logout', {
      method: 'POST'
    });
    await assertStatus(response, 200, 'Logout');
    console.log('Logout ok');

    response = await request('/api/auth/me', {
      method: 'GET'
    });
    await assertStatus(response, 401, 'Protected route after logout');

    console.log('Auth verification completed successfully.');
  } finally {
    child.kill('SIGINT');
    await mongoServer.stop();
  }
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
