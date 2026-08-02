import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  Bookmark,
  Calendar,
  ClipboardList,
  History,
  Trash2
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Layout from '../components/Layout';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/Ui';
import { useToast } from '../hooks/useToast';
import api from '../lib/api';

const formatDate = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

const getRiasecChartData = (riasec) => {
  if (!riasec) return [];

  return [
    { name: 'Realistic', score: riasec.realistic || 0 },
    { name: 'Investigative', score: riasec.investigative || 0 },
    { name: 'Artistic', score: riasec.artistic || 0 },
    { name: 'Social', score: riasec.social || 0 },
    { name: 'Enterprising', score: riasec.enterprising || 0 },
    { name: 'Conventional', score: riasec.conventional || 0 }
  ];
};

const Dashboard = () => {
  const { error: toastError } = useToast();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkedCareers, setBookmarkedCareers] = useState([]);

  const fetchHistory = useCallback(async () => {
    setLoading(true);

    try {
      const response = await api.get('/api/assessment/history');
      setHistory(response.data?.history || []);
    } catch {
      toastError('Failed to fetch assessment history.');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchHistory();

    const saved = localStorage.getItem('bookmarked_careers');
    if (saved) {
      try {
        setBookmarkedCareers(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse bookmarks:', error);
      }
    }
  }, [fetchHistory]);

  const removeBookmark = (id) => {
    const updated = bookmarkedCareers.filter((career) => career.id !== id);
    setBookmarkedCareers(updated);
    localStorage.setItem('bookmarked_careers', JSON.stringify(updated));
  };

  const latestAssessment = history[0];
  const recentHistory = history.slice(0, 4);

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="m-0 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Welcome back
            </h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              Analyze your profile and explore personalized recommendations.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/history">
              <Button variant="outline">
                <History className="mr-2 h-4 w-4" />
                View history
              </Button>
            </Link>
            <Link to="/assessment">
              <Button className="bg-indigo-600 shadow-md hover:bg-indigo-700">
                <ClipboardList className="mr-2 h-4 w-4" />
                Take New Assessment
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
            <div className="relative h-10 w-10">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-slate-800" />
              <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 dark:border-t-indigo-400 animate-spin" />
            </div>
            <p className="mt-4 text-sm font-medium">Loading dashboard...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-8 lg:col-span-2">
              {latestAssessment ? (
                <Card>
                  <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <CardTitle>Latest Assessment Profile</CardTitle>
                        <CardDescription>
                          Completed on {formatDate(latestAssessment.completedAt || latestAssessment.createdAt)}
                        </CardDescription>
                      </div>
                      <Link to={`/assessment/${latestAssessment._id}/results`}>
                        <Button variant="outline" size="sm">
                          View Full Report
                          <ArrowRight className="ml-1.5 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                      <div className="h-[220px] md:col-span-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={getRiasecChartData(latestAssessment.riasecScores)}
                            margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="#f1f5f9"
                              className="dark:stroke-slate-800"
                            />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#1e293b',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#fff'
                              }}
                              itemStyle={{ color: '#fff' }}
                            />
                            <Bar dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="flex flex-col justify-center space-y-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Aptitude Profile
                        </h4>
                        <div className="space-y-3">
                          {['Logical', 'Numerical', 'Verbal'].map((aptitudeType) => {
                            const score =
                              latestAssessment.aptitudeScores?.[aptitudeType.toLowerCase()] || 0;

                            return (
                              <div
                                key={aptitudeType}
                                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-800/50 dark:bg-slate-900"
                              >
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                  {aptitudeType}
                                </span>
                                <Badge variant="default" className="text-xs">
                                  {score} / 2
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-2 border-dashed px-4 py-16 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <ClipboardList className="h-12 w-12 text-indigo-500 dark:text-indigo-400" />
                    <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                      No Assessments Completed Yet
                    </h3>
                    <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                      Take the 21-question interest and aptitude profile assessment to unlock AI career and course recommendations.
                    </p>
                    <div className="mt-6">
                      <Link to="/assessment">
                        <Button className="shadow-md">Start Assessment</Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              )}

              {history.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <CardTitle>Recent Assessment History</CardTitle>
                        <CardDescription>Your latest recommendation reports</CardDescription>
                      </div>
                      <Link to="/history">
                        <Button variant="outline" size="sm">
                          Open full history
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="divide-y divide-slate-100 p-0 dark:divide-slate-800/50">
                    {recentHistory.map((item, index) => (
                      <div
                        key={item._id}
                        className="flex flex-col gap-4 p-4 px-6 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/20 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              Assessment #{history.length - index}
                            </p>
                            <p className="text-xs text-slate-400">
                              {new Date(item.completedAt || item.createdAt).toLocaleDateString(undefined, {
                                dateStyle: 'medium'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge variant="neutral" className="text-[10px] font-mono uppercase tracking-wider">
                            AI Provider: {item.aiProvider}
                          </Badge>
                          <Link to={`/assessment/${item._id}/results`}>
                            <Button variant="outline" size="sm">
                              View Results
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bookmark className="mr-2 h-5 w-5 shrink-0 text-indigo-500" />
                    Bookmarked Careers
                  </CardTitle>
                  <CardDescription>Careers you saved for further exploration</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {bookmarkedCareers.length > 0 ? (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {bookmarkedCareers.map((career) => (
                        <div
                          key={career.id}
                          className="group flex items-center justify-between p-4 px-6 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/20"
                        >
                          <div className="min-w-0 pr-4">
                            <h4 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {career.title}
                            </h4>
                            <p className="mt-0.5 truncate text-xs text-slate-400">{career.description}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeBookmark(career.id)}
                            className="cursor-pointer rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-rose-500 dark:hover:bg-slate-800/60"
                            title="Remove Bookmark"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-6 py-12 text-center text-slate-400">
                      <Award className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-700" />
                      <p className="mt-2 text-sm font-medium">No bookmarked careers yet.</p>
                      <p className="mx-auto mt-1 max-w-xs text-xs text-slate-500">
                        Take the assessment and save careers of interest to see them listed here.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
