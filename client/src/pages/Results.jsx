import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  Bookmark,
  ChevronLeft,
  ExternalLink,
  GraduationCap,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import Layout from '../components/Layout';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '../components/Ui';
import { useToast } from '../hooks/useToast';
import api from '../lib/api';

const Results = () => {
  const { id } = useParams();
  const { error: toastError, success } = useToast();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarkedIds, setBookmarkedIds] = useState([]);

  const fetchResults = useCallback(async () => {
    setLoading(true);

    try {
      const response = await api.get(`/api/assessment/${id}/results`);
      setAssessment(response.data?.assessment || null);
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to fetch assessment results.');
    } finally {
      setLoading(false);
    }
  }, [id, toastError]);

  useEffect(() => {
    fetchResults();

    const saved = localStorage.getItem('bookmarked_careers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setBookmarkedIds(parsed.map((career) => career.id));
      } catch (error) {
        console.error(error);
      }
    }
  }, [fetchResults]);

  const toggleBookmark = (careerId, careerTitle, description) => {
    const saved = localStorage.getItem('bookmarked_careers');
    let bookmarks = [];

    if (saved) {
      try {
        bookmarks = JSON.parse(saved);
      } catch (error) {
        console.error(error);
      }
    }

    const isBookmarked = bookmarkedIds.includes(careerId);
    let updatedBookmarks;

    if (isBookmarked) {
      updatedBookmarks = bookmarks.filter((bookmark) => bookmark.id !== careerId);
      setBookmarkedIds((prev) => prev.filter((bookmarkId) => bookmarkId !== careerId));
      success('Bookmark removed.');
    } else {
      updatedBookmarks = [...bookmarks, { id: careerId, title: careerTitle, description }];
      setBookmarkedIds((prev) => [...prev, careerId]);
      success('Career bookmarked!');
    }

    localStorage.setItem('bookmarked_careers', JSON.stringify(updatedBookmarks));
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
          <div className="relative h-10 w-10">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-slate-800" />
            <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 dark:border-t-indigo-400 animate-spin" />
          </div>
          <p className="mt-4 text-sm font-medium">Generating reports...</p>
        </div>
      </Layout>
    );
  }

  if (!assessment) {
    return (
      <Layout>
        <Card className="mx-auto max-w-md px-6 py-12 text-center">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Assessment Not Found
          </h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            The requested assessment results could not be located.
          </p>
          <div className="mt-6">
            <Link to="/">
              <Button>Go to Dashboard</Button>
            </Link>
          </div>
        </Card>
      </Layout>
    );
  }

  const riasecScores = assessment.riasecScores || {};
  const radarData = [
    { subject: 'Realistic', score: riasecScores.realistic || 0, fullMark: 10 },
    { subject: 'Investigative', score: riasecScores.investigative || 0, fullMark: 10 },
    { subject: 'Artistic', score: riasecScores.artistic || 0, fullMark: 10 },
    { subject: 'Social', score: riasecScores.social || 0, fullMark: 10 },
    { subject: 'Enterprising', score: riasecScores.enterprising || 0, fullMark: 10 },
    { subject: 'Conventional', score: riasecScores.conventional || 0, fullMark: 10 }
  ];

  const aptitudeScores = assessment.aptitudeScores || {};
  const aptitudeChartData = [
    { name: 'Logical', score: aptitudeScores.logical || 0 },
    { name: 'Numerical', score: aptitudeScores.numerical || 0 },
    { name: 'Verbal', score: aptitudeScores.verbal || 0 }
  ];

  const recommendations = assessment.recommendations || [];

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/history"
            className="flex items-center text-sm text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to history
          </Link>
          <Button type="button" variant="outline" size="sm" onClick={fetchResults}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh cached results
          </Button>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="m-0 flex items-center text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              <Sparkles className="mr-2 h-6 w-6 shrink-0 animate-pulse text-indigo-500" />
              Career Match Results
            </h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              Generated by{' '}
              {assessment.aiProvider === 'fallback'
                ? 'rule-based similarity model'
                : `${assessment.aiProvider} AI engine`}
            </p>
          </div>
          <Badge variant="neutral" className="px-3 py-1 text-xs font-semibold tracking-wider font-mono">
            Provider: {assessment.aiProvider}
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5 shrink-0 text-indigo-500" />
                RIASEC Interest Analysis
              </CardTitle>
              <CardDescription>
                Visualizing your scores across the six Holland occupational themes
              </CardDescription>
            </CardHeader>
            <CardContent className="flex h-[280px] items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={11} fontWeight={500} />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} stroke="#94a3b8" fontSize={9} />
                  <Radar name="Student Profile" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <GraduationCap className="mr-2 h-5 w-5 shrink-0 text-indigo-500" />
                Aptitude Evaluation
              </CardTitle>
              <CardDescription>Your score breakdown across cognitive aptitude types</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aptitudeChartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                    className="dark:stroke-slate-800"
                  />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 2]} tickCount={3} stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Bar dataKey="score" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <h2 className="m-0 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Top Career Recommendations
          </h2>

          <div className="space-y-6">
            {recommendations.map((recommendation, index) => {
              const isBookmarked = bookmarkedIds.includes(recommendation.careerId);

              return (
                <Card
                  key={recommendation.careerId}
                  className="border border-slate-200 transition-shadow hover:shadow-md dark:border-slate-800/80"
                >
                  <div className="flex flex-col items-start justify-between space-y-6 p-6 md:flex-row md:space-y-0 md:space-x-8 md:p-8">
                    <div className="min-w-0 flex-1 space-y-4">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold font-mono text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                          {index + 1}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                          {recommendation.careerTitle}
                        </h3>
                        <Badge variant="success" className="shrink-0 text-xs">
                          {recommendation.matchPercentage}% Match
                        </Badge>
                      </div>

                      <Tabs defaultValue="fit">
                        <TabsList className="max-w-md">
                          <TabsTrigger value="fit">Why this fits</TabsTrigger>
                          <TabsTrigger value="courses">
                            Courses ({recommendation.courses?.length || 0})
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="fit">
                          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm font-medium leading-relaxed text-slate-600 dark:border-slate-800/60 dark:bg-slate-900/40 dark:text-slate-300">
                            {recommendation.explanation}
                          </div>
                        </TabsContent>

                        <TabsContent value="courses">
                          <div className="pt-1">
                            <div className="mb-3 flex items-center text-xs font-bold uppercase tracking-wider text-slate-400">
                              <BookOpen className="mr-1.5 h-4 w-4 shrink-0 text-indigo-500" />
                              Recommended Online Courses
                            </div>
                            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                              {recommendation.courses?.map((course) => (
                                <a
                                  key={course.courseId || course.title}
                                  href={course.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group/link flex items-start justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 text-left transition-all hover:bg-indigo-50/30 dark:border-slate-800/60 dark:bg-slate-900 dark:hover:bg-slate-800"
                                >
                                  <div className="min-w-0 pr-4">
                                    <p className="line-clamp-1 text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover/link:text-indigo-700 dark:group-hover/link:text-indigo-400">
                                      {course.title}
                                    </p>
                                    <p className="mt-0.5 text-[10px] text-slate-400">{course.provider}</p>
                                  </div>
                                  <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 group-hover/link:text-indigo-600 dark:group-hover/link:text-indigo-400" />
                                </a>
                              ))}
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>

                    <div className="flex w-full justify-end md:w-auto md:shrink-0">
                      <Button
                        variant={isBookmarked ? 'default' : 'outline'}
                        size="sm"
                        onClick={() =>
                          toggleBookmark(
                            recommendation.careerId,
                            recommendation.careerTitle,
                            recommendation.explanation
                          )
                        }
                        className="w-full cursor-pointer shadow-xs md:w-auto"
                      >
                        <Bookmark className={`mr-2 h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
                        {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Results;
