import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, HelpCircle, Sparkles } from 'lucide-react';
import Layout from '../components/Layout';
import { Badge, Button, Card, CardContent, CardHeader, Progress } from '../components/Ui';
import { useToast } from '../hooks/useToast';
import api from '../lib/api';

const Assessment = () => {
  const { error: toastError, success } = useToast();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});

  const fetchQuestions = useCallback(async () => {
    setLoading(true);

    try {
      const response = await api.get('/api/questions');
      setQuestions(response.data?.questions || []);
    } catch {
      toastError('Failed to load assessment questions.');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleSelectOption = (questionId, option) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option
    }));
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    const answersPayload = Object.entries(answers).map(([questionId, selectedOption]) => ({
      questionId,
      selectedOption
    }));

    if (answersPayload.length < questions.length) {
      toastError('Please answer all questions before submitting.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post('/api/assessment/submit', { answers: answersPayload });
      success('Assessment submitted successfully!');
      const assessmentId = response.data?.assessment?._id;

      if (assessmentId) {
        navigate(`/assessment/${assessmentId}/results`);
      } else {
        navigate('/');
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to generate recommendations. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
          <div className="relative h-10 w-10">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-slate-800" />
            <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 dark:border-t-indigo-400 animate-spin" />
          </div>
          <p className="mt-4 text-sm font-medium">Fetching assessment questions...</p>
        </div>
      </Layout>
    );
  }

  if (questions.length === 0) {
    return (
      <Layout>
        <Card className="mx-auto max-w-md px-6 py-12 text-center">
          <HelpCircle className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
            Questions Not Found
          </h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            The assessment question bank is currently empty. Please ask an administrator to seed the database.
          </p>
        </Card>
      </Layout>
    );
  }

  const currentQuestion = questions[currentIdx];
  const selectedOption = answers[currentQuestion._id];
  const progressPercent = Math.round(((currentIdx + 1) / questions.length) * 100);

  if (submitting) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 transition-colors dark:bg-slate-950 flex flex-col items-center justify-center">
        <div className="max-w-sm space-y-6 text-center">
          <div className="relative flex justify-center">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-4 border-indigo-100 dark:border-slate-800">
              <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 dark:border-t-indigo-400 animate-spin" />
              <Sparkles className="h-6 w-6 animate-pulse text-indigo-500" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              AI is analyzing your responses...
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Our recommendation engine is evaluating your interests and aptitudes using Gemini and Groq to generate customized career and course matches.
            </p>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="animate-progress-indeterminate h-full w-1/2 bg-indigo-600 dark:bg-indigo-500" />
          </div>
        </div>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @keyframes indeterminate {
                0% { left: -35%; right: 100%; }
                60% { left: 100%; right: -90%; }
                100% { left: 100%; right: -90%; }
              }
              .animate-progress-indeterminate {
                position: relative;
                animation: indeterminate 2s infinite linear;
              }
            `
          }}
        />
      </div>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Question {currentIdx + 1} of {questions.length}</span>
            <span>{progressPercent}% Complete</span>
          </div>
          <Progress value={progressPercent} />
        </div>

        <Card className="shadow-md">
          <CardHeader className="bg-slate-50/50 py-5 dark:bg-slate-900/20">
            <div className="flex items-center space-x-3.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold font-mono text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                {currentIdx + 1}
              </span>
              <Badge variant="neutral" className="text-[10px] font-medium capitalize tracking-wide">
                Category: {currentQuestion.category}
              </Badge>
              {currentQuestion.aptitudeType && (
                <Badge variant="default" className="text-[10px] font-medium capitalize tracking-wide">
                  Type: {currentQuestion.aptitudeType}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="py-8">
            <h2 className="mb-8 text-xl font-semibold leading-snug text-slate-900 dark:text-slate-50">
              {currentQuestion.text}
            </h2>

            <div className="space-y-3">
              {currentQuestion.options.map((option) => {
                const isSelected = selectedOption === option;

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleSelectOption(currentQuestion._id, option)}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-xl border p-4 text-left text-sm font-medium transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900 ring-1 ring-indigo-600 dark:border-indigo-500 dark:bg-indigo-950/20 dark:text-indigo-300 dark:ring-indigo-500'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <span>{option}</span>
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-600 dark:border-indigo-500 dark:bg-indigo-500'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentIdx === 0}
            className="cursor-pointer"
          >
            <ChevronLeft className="mr-1.5 h-4 w-4" />
            Previous
          </Button>

          {currentIdx === questions.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={!selectedOption}
              className="cursor-pointer bg-indigo-600 font-semibold shadow-md hover:bg-indigo-700"
            >
              Submit Assessment
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!selectedOption}
              className="cursor-pointer"
            >
              Next
              <ChevronRight className="ml-1.5 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Assessment;
