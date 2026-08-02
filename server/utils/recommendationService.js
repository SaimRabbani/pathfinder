const Career = require('../models/Career');
const Course = require('../models/Course');

const MAX_RECOMMENDATIONS = 5;
const MIN_COURSES_PER_RECOMMENDATION = 3;
const MAX_COURSES_PER_RECOMMENDATION = 5;
const DEFAULT_GEMINI_MODEL = 'gemini-3.6-flash';
const DEFAULT_GEMINI_REQUEST_TIMEOUT_MS = 45000;
const DEFAULT_GROQ_REQUEST_TIMEOUT_MS = 30000;
const RIASEC_KEYS = [
  'realistic',
  'investigative',
  'artistic',
  'social',
  'enterprising',
  'conventional'
];
const APTITUDE_KEYS = ['logical', 'numerical', 'verbal'];
const SYSTEM_PROMPT = [
  'You are PathFinder, an AI career counselor.',
  'You must recommend only from the supplied database entries.',
  'Never invent careers or courses.',
  `Return strict JSON with exactly ${MAX_RECOMMENDATIONS} career recommendations.`,
  `Each recommendation must contain ${MIN_COURSES_PER_RECOMMENDATION}-${MAX_COURSES_PER_RECOMMENDATION} related real courses for that exact career.`,
  'If the input data is incomplete, still answer using only the provided careers and courses.'
].join(' ');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseBooleanEnv(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
}

function getTimeoutMs(providerLabel) {
  const providerName = String(providerLabel || '').trim().toUpperCase();
  const providerTimeout = Number(process.env[`${providerName}_REQUEST_TIMEOUT_MS`]);
  const sharedTimeout = Number(process.env.AI_REQUEST_TIMEOUT_MS);
  const defaultTimeout =
    providerName === 'GEMINI'
      ? DEFAULT_GEMINI_REQUEST_TIMEOUT_MS
      : DEFAULT_GROQ_REQUEST_TIMEOUT_MS;

  if (Number.isFinite(providerTimeout) && providerTimeout >= 1000) {
    return providerTimeout;
  }

  // Do not let an older shared setting shorten Gemini's longer request window.
  if (Number.isFinite(sharedTimeout) && sharedTimeout >= 1000) {
    return Math.max(sharedTimeout, defaultTimeout);
  }

  return defaultTimeout;
}

function getRetryBaseDelayMs() {
  const parsed = Number(process.env.AI_RETRY_BASE_DELAY_MS);
  return Number.isFinite(parsed) && parsed >= 50 ? parsed : 500;
}

function getGeminiModel() {
  const configuredModel = String(process.env.GEMINI_MODEL || '').trim();

  // Keep the production default current while allowing deployments to pin a model explicitly.
  return configuredModel || DEFAULT_GEMINI_MODEL;
}

function cleanJsonResponse(text) {
  let cleaned = String(text || '').trim();

  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/, '');
  }

  return cleaned.trim();
}

function parseJsonPayload(text) {
  const cleaned = cleanJsonResponse(text);

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    }

    throw error;
  }
}

function toPlainScoreObject(source, keys) {
  const plain = {};

  keys.forEach((key) => {
    if (source && typeof source.get === 'function') {
      plain[key] = Number(source.get(key) || 0);
      return;
    }

    plain[key] = Number((source && source[key]) || 0);
  });

  return plain;
}

function toPlainCareer(career) {
  return {
    id: career._id.toString(),
    title: career.title,
    description: career.description,
    riasecWeights: toPlainScoreObject(career.riasecWeights, RIASEC_KEYS),
    requiredAptitude: toPlainScoreObject(career.requiredAptitude, APTITUDE_KEYS),
    avgSalary: career.avgSalary,
    growthOutlook: career.growthOutlook
  };
}

function toPlainCourse(course) {
  return {
    id: course._id.toString(),
    title: course.title,
    provider: course.provider,
    link: course.link,
    duration: course.duration,
    level: course.level,
    relatedCareers: (course.relatedCareers || []).map((careerId) => careerId.toString())
  };
}

function getRelatedCoursesForCareer(careerId, allCourses) {
  return allCourses.filter((course) => course.relatedCareers.includes(careerId));
}

function buildPromptParts(riasecScores, aptitudeScores, careers, courses) {
  const careersWithAllowedCourses = careers.map((career) => ({
    ...career,
    allowedCourses: getRelatedCoursesForCareer(career.id, courses).map((course) => ({
      id: course.id,
      title: course.title,
      provider: course.provider,
      link: course.link,
      duration: course.duration,
      level: course.level
    }))
  }));

  const userPrompt = [
    'Student scores:',
    JSON.stringify(
      {
        riasecScores,
        aptitudeScores
      },
      null,
      2
    ),
    '',
    'Career catalog with the complete, allowed course list for each career:',
    JSON.stringify(careersWithAllowedCourses, null, 2),
    '',
    'For every recommendation, choose course IDs only from that career\'s allowedCourses list.',
    'Return strict JSON with this shape and no extra text:',
    JSON.stringify(
      {
        recommendations: [
          {
            careerId: 'career-id',
            careerTitle: 'Career title',
            matchPercentage: 86,
            explanation: 'Two or three sentences explaining why the student fits this career.',
            courses: [
              {
                courseId: 'course-id',
                title: 'Course title',
                provider: 'Course provider',
                link: 'https://example.com/course'
              }
            ]
          }
        ]
      },
      null,
      2
    )
  ].join('\n');

  return {
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    combinedPrompt: `${SYSTEM_PROMPT}\n\n${userPrompt}`
  };
}

function shouldRetryResponse(response) {
  return response.status === 408 || response.status === 429 || response.status >= 500;
}

async function fetchWithRetry(url, options, providerLabel) {
  const retries = 3;
  const timeoutMs = getTimeoutMs(providerLabel);
  let delayMs = getRetryBaseDelayMs();

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (shouldRetryResponse(response) && attempt < retries) {
        console.warn(
          `[recommendationService] ${providerLabel} returned ${response.status}. Retrying in ${delayMs}ms...`
        );
        await sleep(delayMs);
        delayMs *= 2;
        continue;
      }

      return response;
    } catch (error) {
      clearTimeout(timeout);

      if (attempt === retries) {
        throw error;
      }

      console.warn(
        `[recommendationService] ${providerLabel} request failed on attempt ${attempt}. Retrying in ${delayMs}ms...`,
        error.message
      );
      await sleep(delayMs);
      delayMs *= 2;
    }
  }

  throw new Error(`${providerLabel} request failed after retries.`);
}

function calculateCosineSimilarity(vectorA, vectorB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let index = 0; index < vectorA.length; index += 1) {
    dotProduct += vectorA[index] * vectorB[index];
    normA += vectorA[index] * vectorA[index];
    normB += vectorB[index] * vectorB[index];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function getTopScoreKey(scores, keys) {
  return keys.reduce(
    (best, key) => {
      const value = Number(scores[key] || 0);
      return value > best.value ? { key, value } : best;
    },
    { key: keys[0], value: Number(scores[keys[0]] || 0) }
  );
}

function buildFallbackExplanation(career, topRiasec, topAptitude) {
  return [
    `Your strongest interest pattern is ${topRiasec.key}, which lines up well with the core activities in ${career.title}.`,
    `Your ${topAptitude.key} aptitude score also supports the problem-solving and learning style this path usually demands.`
  ].join(' ');
}

function ensureRecommendationDataset(allCareers, allCourses) {
  if (allCareers.length < MAX_RECOMMENDATIONS) {
    throw new Error(`At least ${MAX_RECOMMENDATIONS} careers are required to generate recommendations.`);
  }

  const careersWithEnoughCourses = allCareers.filter((career) => {
    const relatedCourses = getRelatedCoursesForCareer(career.id, allCourses);
    return relatedCourses.length >= MIN_COURSES_PER_RECOMMENDATION;
  });

  if (careersWithEnoughCourses.length < MAX_RECOMMENDATIONS) {
    throw new Error(
      `At least ${MAX_RECOMMENDATIONS} careers must each have ${MIN_COURSES_PER_RECOMMENDATION}+ related courses.`
    );
  }

  return careersWithEnoughCourses;
}

async function generateFallbackRecommendations(riasecScores, aptitudeScores, allCareers, allCourses) {
  console.log('[recommendationService] Running rule-based local fallback recommendation...');

  const eligibleCareers = ensureRecommendationDataset(allCareers, allCourses);
  const studentVector = [
    ...RIASEC_KEYS.map((key) => Number(riasecScores[key] || 0)),
    ...APTITUDE_KEYS.map((key) => Number(aptitudeScores[key] || 0))
  ];
  const topRiasec = getTopScoreKey(riasecScores, RIASEC_KEYS);
  const topAptitude = getTopScoreKey(aptitudeScores, APTITUDE_KEYS);

  return eligibleCareers
    .map((career) => {
      const careerVector = [
        ...RIASEC_KEYS.map((key) => Number(career.riasecWeights[key] || 0)),
        ...APTITUDE_KEYS.map((key) => Number(career.requiredAptitude[key] || 0))
      ];
      const similarity = calculateCosineSimilarity(studentVector, careerVector);
      const matchPercentage = Math.min(98, Math.max(40, Math.round(similarity * 100)));
      const relatedCourses = getRelatedCoursesForCareer(career.id, allCourses)
        .slice(0, MAX_COURSES_PER_RECOMMENDATION)
        .map((course) => ({
          courseId: course.id,
          title: course.title,
          provider: course.provider,
          link: course.link
        }));

      return {
        careerId: career.id,
        careerTitle: career.title,
        matchPercentage,
        explanation: buildFallbackExplanation(career, topRiasec, topAptitude),
        courses: relatedCourses
      };
    })
    .sort((left, right) => right.matchPercentage - left.matchPercentage)
    .slice(0, MAX_RECOMMENDATIONS);
}

function validateRecommendations(payload, allCareers, allCourses) {
  if (!payload || !Array.isArray(payload.recommendations)) {
    throw new Error('Missing recommendations array.');
  }

  if (payload.recommendations.length !== MAX_RECOMMENDATIONS) {
    throw new Error(`Expected exactly ${MAX_RECOMMENDATIONS} recommendations.`);
  }

  const careerMap = new Map(allCareers.map((career) => [career.id, career]));
  const courseMap = new Map(allCourses.map((course) => [course.id, course]));
  const seenCareerIds = new Set();

  return payload.recommendations.map((recommendation) => {
    if (
      !recommendation.careerId ||
      typeof recommendation.matchPercentage !== 'number' ||
      !Number.isFinite(recommendation.matchPercentage) ||
      !recommendation.explanation ||
      !Array.isArray(recommendation.courses)
    ) {
      throw new Error('Recommendation missing required fields.');
    }

    if (seenCareerIds.has(recommendation.careerId)) {
      throw new Error(`Duplicate career recommendation received: ${recommendation.careerId}`);
    }

    seenCareerIds.add(recommendation.careerId);

    const career = careerMap.get(recommendation.careerId);

    if (!career) {
      throw new Error(`Hallucinated career ID: ${recommendation.careerId}`);
    }

    if (
      recommendation.courses.length < MIN_COURSES_PER_RECOMMENDATION ||
      recommendation.courses.length > MAX_COURSES_PER_RECOMMENDATION
    ) {
      throw new Error(
        `Career ${recommendation.careerId} has invalid course count ${recommendation.courses.length}.`
      );
    }

    const relatedCourses = getRelatedCoursesForCareer(career.id, allCourses);
    const relatedCourseIds = new Set(relatedCourses.map((course) => course.id));
    const seenCourseIds = new Set();
    const normalizedCourses = [];

    recommendation.courses.forEach((courseRecommendation) => {
      const courseId = String(courseRecommendation?.courseId || '');
      const course = courseMap.get(courseId);

      if (!course || !relatedCourseIds.has(course.id) || seenCourseIds.has(course.id)) {
        return;
      }

      seenCourseIds.add(course.id);
      normalizedCourses.push({
        courseId: course.id,
        title: course.title,
        provider: course.provider,
        link: course.link
      });
    });

    // LLMs occasionally select a real course from another career. The database is
    // authoritative, so repair that portion of the response instead of discarding
    // an otherwise valid provider result. The saved output always remains valid.
    relatedCourses.forEach((course) => {
      if (normalizedCourses.length >= MAX_COURSES_PER_RECOMMENDATION || seenCourseIds.has(course.id)) {
        return;
      }

      seenCourseIds.add(course.id);
      normalizedCourses.push({
        courseId: course.id,
        title: course.title,
        provider: course.provider,
        link: course.link
      });
    });

    if (normalizedCourses.length < MIN_COURSES_PER_RECOMMENDATION) {
      throw new Error(
        `Career ${recommendation.careerId} does not have enough related courses in the database.`
      );
    }

    return {
      careerId: career.id,
      careerTitle: career.title,
      matchPercentage: Math.max(0, Math.min(100, Math.round(recommendation.matchPercentage))),
      explanation: String(recommendation.explanation).trim(),
      courses: normalizedCourses
    };
  });
}

function shouldForceProviderFailure(provider) {
  return provider === 'gemini'
    ? parseBooleanEnv(process.env.FORCE_GEMINI_FAILURE)
    : parseBooleanEnv(process.env.FORCE_GROQ_FAILURE);
}

async function callGemini(promptParts, allCareers, allCourses) {
  if (!process.env.GEMINI_API_KEY) {
    console.log('[recommendationService] GEMINI_API_KEY not configured. Skipping...');
    return null;
  }

  if (shouldForceProviderFailure('gemini')) {
    throw new Error('Gemini failure forced via FORCE_GEMINI_FAILURE.');
  }

  console.log('[recommendationService] Attempting Google Gemini API...');

  const response = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/${getGeminiModel()}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: promptParts.combinedPrompt }]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      })
    },
    'Gemini'
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini returned ${response.status}: ${errorText.slice(0, 300)}`);
  }

  const responseJson = await response.json();
  const text =
    responseJson?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('')
      .trim() || '';

  if (!text) {
    throw new Error('Gemini returned an empty response body.');
  }

  const parsed = parseJsonPayload(text);
  const validated = validateRecommendations(parsed, allCareers, allCourses);

  console.log('[recommendationService] Gemini recommendation succeeded.');
  return {
    provider: 'gemini',
    recommendations: validated
  };
}

async function callGroq(promptParts, allCareers, allCourses) {
  if (!process.env.GROQ_API_KEY) {
    console.log('[recommendationService] GROQ_API_KEY not configured. Skipping...');
    return null;
  }

  if (shouldForceProviderFailure('groq')) {
    throw new Error('Groq failure forced via FORCE_GROQ_FAILURE.');
  }

  console.log('[recommendationService] Attempting Groq API...');

  const response = await fetchWithRetry(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: promptParts.systemPrompt
          },
          {
            role: 'user',
            content: promptParts.userPrompt
          }
        ],
        response_format: {
          type: 'json_object'
        },
        temperature: 0.2
      })
    },
    'Groq'
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq returned ${response.status}: ${errorText.slice(0, 300)}`);
  }

  const responseJson = await response.json();
  const text = responseJson?.choices?.[0]?.message?.content || '';

  if (!text) {
    throw new Error('Groq returned an empty response body.');
  }

  const parsed = parseJsonPayload(text);
  const validated = validateRecommendations(parsed, allCareers, allCourses);

  console.log('[recommendationService] Groq recommendation succeeded.');
  return {
    provider: 'groq',
    recommendations: validated
  };
}

async function generateRecommendations(riasecScoresInput, aptitudeScoresInput) {
  const allCareers = (await Career.find({}).sort({ title: 1 })).map(toPlainCareer);
  const allCourses = (await Course.find({}).sort({ title: 1 })).map(toPlainCourse);
  const riasecScores = toPlainScoreObject(riasecScoresInput, RIASEC_KEYS);
  const aptitudeScores = toPlainScoreObject(aptitudeScoresInput, APTITUDE_KEYS);

  ensureRecommendationDataset(allCareers, allCourses);

  const promptParts = buildPromptParts(riasecScores, aptitudeScores, allCareers, allCourses);

  try {
    const geminiResult = await callGemini(promptParts, allCareers, allCourses);

    if (geminiResult) {
      return geminiResult;
    }
  } catch (error) {
    console.error('[recommendationService] Gemini failed:', error.message);
  }

  try {
    const groqResult = await callGroq(promptParts, allCareers, allCourses);

    if (groqResult) {
      return groqResult;
    }
  } catch (error) {
    console.error('[recommendationService] Groq failed:', error.message);
  }

  const recommendations = await generateFallbackRecommendations(
    riasecScores,
    aptitudeScores,
    allCareers,
    allCourses
  );

  return {
    provider: 'fallback',
    recommendations
  };
}

module.exports = {
  DEFAULT_GEMINI_MODEL,
  DEFAULT_GEMINI_REQUEST_TIMEOUT_MS,
  DEFAULT_GROQ_REQUEST_TIMEOUT_MS,
  MAX_RECOMMENDATIONS,
  buildPromptParts,
  generateFallbackRecommendations,
  generateRecommendations,
  getGeminiModel,
  getTimeoutMs,
  validateRecommendations
};
