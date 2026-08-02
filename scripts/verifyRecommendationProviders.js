const path = require('path');

process.env.MONGOMS_DOWNLOAD_DIR = path.join(
  __dirname,
  '..',
  'node_modules',
  '.cache',
  'mongodb-memory-server'
);

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const { seedDatabase } = require('./seedData');
const Career = require('../server/models/Career');
const Course = require('../server/models/Course');
const {
  DEFAULT_GEMINI_MODEL,
  DEFAULT_GEMINI_REQUEST_TIMEOUT_MS,
  MAX_RECOMMENDATIONS,
  generateRecommendations,
  getTimeoutMs
} = require('../server/utils/recommendationService');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function buildMockRecommendations() {
  const careers = await Career.find({}).sort({ title: 1 });
  const courses = await Course.find({}).sort({ title: 1 });

  const careersWithEnoughCourses = careers.filter((career) => {
    const relatedCourseCount = courses.filter((course) =>
      (course.relatedCareers || []).some(
        (relatedCareerId) => relatedCareerId.toString() === career._id.toString()
      )
    ).length;

    return relatedCourseCount >= 3;
  });

  return careersWithEnoughCourses.slice(0, MAX_RECOMMENDATIONS).map((career, index) => {
    const relatedCourses = courses
      .filter((course) =>
        (course.relatedCareers || []).some(
          (relatedCareerId) => relatedCareerId.toString() === career._id.toString()
        )
      )
      .slice(0, 3)
      .map((course) => ({
        courseId: course._id.toString(),
        title: course.title,
        provider: course.provider,
        link: course.link
      }));

    return {
      careerId: career._id.toString(),
      careerTitle: career.title,
      matchPercentage: 92 - index,
      explanation: `This path matches the student's score profile and aligns with ${career.title}. Their strongest traits support the day-to-day demands of this role.`,
      courses: relatedCourses
    };
  });
}

function createJsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    ...init
  });
}

async function main() {
  console.log('Starting in-memory MongoDB for provider verification...');
  const mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri('pathfinder');
  process.env.GEMINI_API_KEY = 'test-gemini-key';
  process.env.GROQ_API_KEY = 'test-groq-key';
  process.env.AI_RETRY_BASE_DELAY_MS = '25';
  process.env.AI_REQUEST_TIMEOUT_MS = '2000';
  delete process.env.GEMINI_REQUEST_TIMEOUT_MS;
  delete process.env.GROQ_REQUEST_TIMEOUT_MS;
  process.env.FORCE_GEMINI_FAILURE = 'false';
  process.env.FORCE_GROQ_FAILURE = 'false';

  const originalFetch = global.fetch;

  try {
    assert(
      getTimeoutMs('Gemini') === DEFAULT_GEMINI_REQUEST_TIMEOUT_MS,
      'Gemini should keep its 45-second default when the legacy shared timeout is shorter.'
    );

    await seedDatabase({
      connect: true,
      disconnect: false,
      clearExisting: true
    });

    const mockRecommendations = await buildMockRecommendations();
    const seededCareers = await Career.find({}).sort({ title: 1 });
    const seededCourses = await Course.find({}).sort({ title: 1 });

    seededCareers.forEach((career) => {
      const relatedCourseCount = seededCourses.filter((course) =>
        (course.relatedCareers || []).some(
          (relatedCareerId) => relatedCareerId.toString() === career._id.toString()
        )
      ).length;

      assert(
        relatedCourseCount >= 3,
        `${career.title} should have at least three related seeded courses, found ${relatedCourseCount}.`
      );
    });

    const groqRecommendationsWithWrongCourse = JSON.parse(JSON.stringify(mockRecommendations));
    const firstGroqRecommendation = groqRecommendationsWithWrongCourse[0];
    const unrelatedCourse = seededCourses.find(
      (course) =>
        !(course.relatedCareers || []).some(
          (relatedCareerId) => relatedCareerId.toString() === firstGroqRecommendation.careerId
        )
    );

    assert(unrelatedCourse, 'Expected a seeded course unrelated to the first mocked career.');
    firstGroqRecommendation.courses[0] = {
      courseId: unrelatedCourse._id.toString(),
      title: unrelatedCourse.title,
      provider: unrelatedCourse.provider,
      link: unrelatedCourse.link
    };
    const scores = {
      riasec: {
        realistic: 6,
        investigative: 9,
        artistic: 4,
        social: 3,
        enterprising: 2,
        conventional: 5
      },
      aptitude: {
        logical: 2,
        numerical: 2,
        verbal: 1
      }
    };

    console.log('Scenario 1: Gemini succeeds...');
    global.fetch = async (url) => {
      if (String(url).includes('generativelanguage.googleapis.com')) {
        assert(
          String(url).includes(`models/${DEFAULT_GEMINI_MODEL}:generateContent`),
          `Gemini request should use ${DEFAULT_GEMINI_MODEL}.`
        );

        return createJsonResponse({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      recommendations: mockRecommendations
                    })
                  }
                ]
              }
            }
          ]
        });
      }

      throw new Error(`Unexpected fetch call in Gemini success scenario: ${url}`);
    };

    let result = await generateRecommendations(scores.riasec, scores.aptitude);
    assert(result.provider === 'gemini', `Expected provider gemini, received ${result.provider}.`);
    assert(
      result.recommendations.length === MAX_RECOMMENDATIONS,
      'Gemini scenario did not return the expected recommendation count.'
    );

    console.log('Scenario 2: Gemini fails, Groq succeeds with an invalid course repaired...');
    let geminiCalls = 0;
    let groqCalls = 0;
    global.fetch = async (url) => {
      if (String(url).includes('generativelanguage.googleapis.com')) {
        geminiCalls += 1;
        return new Response('rate limited', { status: 429 });
      }

      if (String(url).includes('api.groq.com')) {
        groqCalls += 1;
        return createJsonResponse({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  recommendations: groqRecommendationsWithWrongCourse
                })
              }
            }
          ]
        });
      }

      throw new Error(`Unexpected fetch call in Groq fallback scenario: ${url}`);
    };

    result = await generateRecommendations(scores.riasec, scores.aptitude);
    assert(result.provider === 'groq', `Expected provider groq, received ${result.provider}.`);
    assert(geminiCalls >= 1, 'Gemini was not attempted before Groq fallback.');
    assert(groqCalls >= 1, 'Groq was not called after Gemini failure.');
    result.recommendations.forEach((recommendation) => {
      recommendation.courses.forEach((courseRecommendation) => {
        const course = seededCourses.find(
          (candidate) => candidate._id.toString() === courseRecommendation.courseId
        );

        assert(course, `Returned course ${courseRecommendation.courseId} was not found in the seed data.`);
        assert(
          (course.relatedCareers || []).some(
            (relatedCareerId) => relatedCareerId.toString() === recommendation.careerId
          ),
          `Returned course ${courseRecommendation.courseId} is not related to ${recommendation.careerId}.`
        );
      });
    });

    console.log('Scenario 3: Both providers fail, local fallback succeeds...');
    global.fetch = async (url) => {
      if (String(url).includes('generativelanguage.googleapis.com')) {
        return createJsonResponse({
          candidates: [
            {
              content: {
                parts: [{ text: '{"broken": true}' }]
              }
            }
          ]
        });
      }

      if (String(url).includes('api.groq.com')) {
        return createJsonResponse({
          choices: [
            {
              message: {
                content: 'not-json'
              }
            }
          ]
        });
      }

      throw new Error(`Unexpected fetch call in fallback scenario: ${url}`);
    };

    result = await generateRecommendations(scores.riasec, scores.aptitude);
    assert(
      result.provider === 'fallback',
      `Expected provider fallback, received ${result.provider}.`
    );
    assert(
      result.recommendations.length === MAX_RECOMMENDATIONS,
      'Fallback scenario did not return the expected recommendation count.'
    );

    console.log('\n======================================================');
    console.log('Provider failover verification PASSED!');
    console.log('======================================================\n');
  } finally {
    global.fetch = originalFetch;
    await mongoose.connection.close();
    await mongoServer.stop();
  }
}

main().catch((error) => {
  console.error('Provider verification failed:', error.message);
  process.exit(1);
});
