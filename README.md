# PathFinder

PathFinder is a full-stack MERN application for AI-assisted career and course recommendations. Students complete an assessment, the backend computes RIASEC and aptitude scores, and the recommendation engine returns the best career/course matches using Gemini, Groq, or a local fallback.

## What is included

- Secure Express + MongoDB backend with JWT auth and refresh-token rotation
- Assessment module with deterministic RIASEC and aptitude scoring
- Multi-provider recommendation engine with `Gemini -> Groq -> rule-based fallback`
- React frontend with auth, assessment flow, results dashboard, bookmarks, history, and admin panel
- Seed and verification scripts for local development
- Production-ready Express static serving for the built React app
- Docker deployment support

## Project structure

```text
/server
  /config
  /controllers
  /middleware
  /models
  /routes
  /utils
  app.js
  server.js
/client
  /src
  /public
/scripts
.env.example
Dockerfile
package.json
README.md
```

## Prerequisites

- Node.js 20 or newer
- MongoDB local instance or MongoDB Atlas
- Gemini API key
- Groq API key

## Environment setup

### 1. Backend environment

Create the root `.env` file from `.env.example`.

Required backend variables:

- `PORT`
- `MONGO_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `CLIENT_URL`
- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL` (a verified Brevo sender address)
- `BREVO_SENDER_NAME` (optional; defaults to `PathFinder`)
- `NODE_ENV`
- `GEMINI_API_KEY`
- `GEMINI_MODEL` (defaults to `gemini-3.6-flash`)
- `GROQ_API_KEY`

Optional backend testing flags:

- `GEMINI_REQUEST_TIMEOUT_MS` (defaults to `45000`)
- `GROQ_REQUEST_TIMEOUT_MS` (defaults to `30000`)
- `AI_REQUEST_TIMEOUT_MS` (optional shared fallback)
- `AI_RETRY_BASE_DELAY_MS`
- `FORCE_GEMINI_FAILURE`
- `FORCE_GROQ_FAILURE`

### Brevo password-reset email setup

1. In Brevo, go to **SMTP & API** -> **API Keys** and create an API key.
2. Add that key as `BREVO_API_KEY` in the root `.env` file.
3. Verify a sender email address in Brevo, then use it for `BREVO_SENDER_EMAIL`.
4. Restart the server. Password-reset emails are sent through Brevo's HTTPS API, not SMTP.

### 2. Frontend environment

Create `client/.env` from `client/.env.example`.

Development value:

```bash
VITE_API_URL=http://localhost:5000
```

Production note:

- If the React app is served by the same Express server, you can leave `VITE_API_URL` unset during the production build.
- The frontend now defaults to a relative API base in production, so same-origin deployment works without hardcoding `localhost`.

## Installation

Install everything from the project root:

```bash
npm install
```

The root `postinstall` script installs the frontend dependencies automatically.

## Local development

### Run both frontend and backend

```bash
npm run dev
```

This starts:

- Express API on `http://localhost:5000`
- Vite frontend on `http://localhost:5173`

### Run only the backend

```bash
npm run dev:server
```

### Run only the frontend

```bash
npm run dev:client
```

## Seed demo data

Before demoing the app, seed the database so questions, careers, and courses exist:

```bash
npm run seed
```

The seed script populates:

- 20+ assessment questions
- 15+ careers
- 30+ courses

## Verification scripts

### Auth verification

```bash
npm run verify:auth
```

Checks:

- register
- login
- `/api/auth/me`
- refresh
- logout

### Assessment + fallback verification

```bash
npm run verify:assessment
```

Checks:

- seeded question bank
- secure question fetch
- assessment submission
- cached results
- local fallback output

### Provider failover verification

```bash
npm run verify:providers
```

Checks:

- Gemini success path
- Groq fallback path
- final rule-based fallback path

### Frontend verification

```bash
npm run build
npm run lint:client
```

## Full local demo flow

1. Run `npm install`
2. Configure `.env` and `client/.env`
3. Run `npm run seed`
4. Run `npm run dev`
5. Open `http://localhost:5173`
6. Register a student account
7. If you want admin access, promote a registered user:

```bash
npm run make-admin -- your-email@example.com
```

8. Complete the assessment
9. View recommendations, bookmarks, and history
10. Log in with the promoted admin account and open `/admin`

## API routes

### Health

- `GET /api/health`

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password/:token`
- `GET /api/auth/me`

### Assessment

- `GET /api/questions`
- `POST /api/assessment/submit`
- `GET /api/assessment/history`
- `GET /api/assessment/:id/results`

### Admin

- `GET /api/admin/analytics`
- `GET|POST /api/admin/questions`
- `PUT|DELETE /api/admin/questions/:id`
- `GET|POST /api/admin/careers`
- `PUT|DELETE /api/admin/careers/:id`
- `GET|POST /api/admin/courses`
- `PUT|DELETE /api/admin/courses/:id`

## Recommendation failover architecture

PathFinder uses a three-step recommendation chain:

1. Gemini is tried first.
2. If Gemini fails, rate-limits, times out, or returns invalid JSON, the same request is sent to Groq.
3. If both providers fail, a local rule-based matcher returns the top career matches from the database.

The selected provider is saved to `Assessment.aiProvider` so the result history clearly shows whether the response came from:

- `gemini`
- `groq`
- `fallback`

## Production build

Build the frontend:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

In production, Express serves:

- API routes under `/api/*`
- the built React frontend from `client/dist`

## Deployment options

### Option A: Single-service deployment

This project now supports a simple single-service deployment:

- build the React app
- run the Express server
- serve the frontend and API from the same domain

This is the easiest option for demos and portfolios.

Recommended setup:

- MongoDB Atlas for the database
- one Node or Docker web service for the app

### Option B: Split deployment

You can also deploy:

- backend separately as a Node service
- frontend separately as a static/Vite deployment

If you do this:

- set backend `CLIENT_URL` to the frontend domain
- set frontend `VITE_API_URL` to the backend base URL
- keep cookies and CORS configured for the deployed domains

## Docker deployment

### Build the image

```bash
docker build -t pathfinder .
```

### Run the container

```bash
docker run --env-file .env -p 5000:5000 pathfinder
```

The Docker image:

- builds the React app
- installs backend runtime dependencies
- serves the compiled frontend from Express

Open the app at:

```text
http://localhost:5000
```

## Deployment checklist

- MongoDB connection string points to the production database
- `NODE_ENV=production`
- `CLIENT_URL` matches the deployed frontend origin
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are long random secrets
- `GEMINI_API_KEY` and `GROQ_API_KEY` are present
- SMTP values are valid if password reset emails should work
- Seed data has been added if the production database is empty
- `npm run build` passes before deployment

## Notes for viva / project report

Good demo talking points:

- secure authentication with refresh-token rotation
- role-based admin vs student flows
- cached AI results in MongoDB
- provider failover with graceful degradation
- deterministic local fallback so the demo never fully breaks
- admin content management for question, career, and course data

## Client-only note

The frontend-specific details are also summarized in [client/README.md](client/README.md).
