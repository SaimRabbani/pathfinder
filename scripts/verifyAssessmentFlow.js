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

const { seedDatabase } = require('./seedData');

const serverPath = path.join(__dirname, '..', 'server', 'server.js');
const apiBaseUrl = 'http://127.0.0.1:5050';

const cookieJar = new Map();

const updateCookieJar = (response) => {
  const setCookies =
    typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : [];

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
    throw new Error(
      `${label} failed. Expected ${expectedStatus}, received ${response.status}. Body: ${body}`
    );
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

const buildAnswersPayload = (questions) =>
  questions.map((question) => {
    let selectedOption = question.options[0];

    if (question.category === 'interest') {
      selectedOption = 'Agree';
    } else if (question.category === 'personality') {
      selectedOption = 'Neutral';
    } else if (question.category === 'aptitude') {
      selectedOption = question.correctOption;
    }

    return {
      questionId: question._id.toString(),
      selectedOption
    };
  });

const main = async () => {
  console.log('Starting in-memory MongoDB for assessment testing...');
  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri('pathfinder');
  console.log(`MongoDB ready at ${mongoUri}`);

  process.env.MONGO_URI = mongoUri;

  console.log('Seeding database...');
  const seeded = await seedDatabase({
    connect: true,
    disconnect: true,
    clearExisting: true
  });
  console.log(
    `Database seeded with ${seeded.careers.length} careers, ${seeded.courses.length} courses, and ${seeded.questions.length} questions.`
  );

  console.log('Spawning API server...');
  const child = spawn(process.execPath, [serverPath], {
    env: {
      ...process.env,
      PORT: '5050',
      MONGO_URI: mongoUri,
      JWT_ACCESS_SECRET: 'test-access-secret-for-verification-only',
      JWT_REFRESH_SECRET: 'test-refresh-secret-for-verification-only',
      CLIENT_URL: 'http://localhost:5173',
      BREVO_API_KEY: 'test-brevo-key-not-used-in-assessment-flow',
      BREVO_SENDER_EMAIL: 'noreply@example.com',
      BREVO_SENDER_NAME: 'PathFinder Test',
      NODE_ENV: 'development',
      GEMINI_API_KEY: '',
      GROQ_API_KEY: '',
      FORCE_GEMINI_FAILURE: 'true',
      FORCE_GROQ_FAILURE: 'true',
      AI_RETRY_BASE_DELAY_MS: '50'
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
    console.log('API is responding. Registering student user...');

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

    response = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password
      })
    });
    await assertStatus(response, 200, 'Login');
    console.log('User authenticated successfully.');

    console.log('Fetching questions bank from /api/questions...');
    response = await request('/api/questions', {
      method: 'GET'
    });
    await assertStatus(response, 200, 'Get Questions');
    const questionsRes = await response.json();

    if (questionsRes.count < 20) {
      throw new Error(`Expected at least 20 questions, received ${questionsRes.count}.`);
    }

    const leakedCorrectOption = questionsRes.questions.some(
      (question) => 'correctOption' in question && question.correctOption !== undefined
    );

    if (leakedCorrectOption) {
      throw new Error('SECURITY VIOLATION: correctOption leaked from /api/questions.');
    }

    console.log(
      `Successfully fetched ${questionsRes.questions.length} questions. No answer key leaked.`
    );

    const answersPayload = buildAnswersPayload(seeded.questions);

    console.log('Submitting assessment to /api/assessment/submit...');
    response = await request('/api/assessment/submit', {
      method: 'POST',
      body: JSON.stringify({ answers: answersPayload })
    });
    await assertStatus(response, 200, 'Submit Assessment');
    const submitRes = await response.json();
    const assessment = submitRes.assessment;

    if (assessment.aiProvider !== 'fallback') {
      throw new Error(`Expected fallback provider, received ${assessment.aiProvider}.`);
    }

    if (!Array.isArray(assessment.recommendations) || assessment.recommendations.length !== 5) {
      throw new Error(
        `Expected exactly 5 recommendations, received ${assessment.recommendations?.length || 0}.`
      );
    }

    const invalidRecommendation = assessment.recommendations.find(
      (recommendation) =>
        !Array.isArray(recommendation.courses) ||
        recommendation.courses.length < 3 ||
        recommendation.courses.length > 5
    );

    if (invalidRecommendation) {
      throw new Error('At least one recommendation has an invalid course count.');
    }

    console.log('Assessment submission and fallback recommendation generation verified.');

    console.log('Checking /api/assessment/history...');
    response = await request('/api/assessment/history', {
      method: 'GET'
    });
    await assertStatus(response, 200, 'Assessment History');
    const historyRes = await response.json();

    if (historyRes.history.length === 0) {
      throw new Error('Assessment history should contain at least one item.');
    }

    console.log('Checking /api/assessment/:id/results...');
    response = await request(`/api/assessment/${assessment._id}/results`, {
      method: 'GET'
    });
    await assertStatus(response, 200, 'Assessment Results');
    const resultsRes = await response.json();

    if (
      !Array.isArray(resultsRes.assessment.recommendations) ||
      resultsRes.assessment.recommendations.length !== 5
    ) {
      throw new Error('Cached assessment results are incomplete.');
    }

    console.log('\n======================================================');
    console.log('Assessment and recommendation engine verification PASSED!');
    console.log('======================================================\n');
  } finally {
    child.kill('SIGINT');
    await mongoServer.stop();
  }
};

main().catch((error) => {
  console.error('Test execution failed:', error.message);
  process.exit(1);
});
