import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronRight, ClipboardList, Sparkles } from 'lucide-react';
import Layout from '../components/Layout';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/Ui';
import { useToast } from '../hooks/useToast';
import api from '../lib/api';

const formatDate = (dateValue) =>
  new Date(dateValue).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

const History = () => {
  const { error: toastError } = useToast();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);

    try {
      const response = await api.get('/api/assessment/history');
      setHistory(response.data?.history || []);
    } catch {
      toastError('Failed to load assessment history.');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <Layout>
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              <Calendar className="mr-2 h-6 w-6 text-indigo-500" />
              Assessment History
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Review your previous submissions and reopen any saved recommendation report.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={fetchHistory}>
            Refresh history
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
            <div className="relative h-10 w-10">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-slate-800" />
              <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 dark:border-t-indigo-400 animate-spin" />
            </div>
            <p className="mt-4 text-sm font-medium">Loading assessment history...</p>
          </div>
        ) : history.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <ClipboardList className="h-12 w-12 text-indigo-500 dark:text-indigo-400" />
              <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                No assessments yet
              </h2>
              <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                Start your first assessment to generate career matches, course suggestions, and a report you can revisit later.
              </p>
              <Link to="/assessment" className="mt-6">
                <Button>Take assessment</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {history.map((item, index) => (
              <Card key={item._id}>
                <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Assessment #{history.length - index}
                    </CardTitle>
                    <CardDescription>
                      Completed on {formatDate(item.completedAt || item.createdAt)}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="neutral" className="uppercase tracking-wider font-mono text-[10px]">
                      Provider: {item.aiProvider}
                    </Badge>
                    <Link to={`/assessment/${item._id}/results`}>
                      <Button variant="outline" size="sm">
                        Open results
                        <ChevronRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800/60 dark:bg-slate-900/40">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      RIASEC Snapshot
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-300">
                      {Object.entries(item.riasecScores || {}).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 dark:bg-slate-950">
                          <span className="capitalize">{key}</span>
                          <span className="font-semibold">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800/60 dark:bg-slate-900/40">
                    <p className="flex items-center text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <Sparkles className="mr-1.5 h-3.5 w-3.5 text-indigo-500" />
                      Aptitude Snapshot
                    </p>
                    <div className="mt-3 grid gap-2 text-sm text-slate-600 dark:text-slate-300">
                      {Object.entries(item.aptitudeScores || {}).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 dark:bg-slate-950">
                          <span className="capitalize">{key}</span>
                          <span className="font-semibold">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default History;
