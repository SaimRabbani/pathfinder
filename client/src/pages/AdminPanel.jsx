import React, { useCallback, useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge, Tabs, TabsList, TabsTrigger, TabsContent, Dialog, Input, Label, Select } from '../components/Ui';
import api from '../lib/api';
import { useToast } from '../hooks/useToast';
import { Plus, Edit, Trash2, BarChart3, HelpCircle, Briefcase, GraduationCap, Users, FileText, CheckCircle, ShieldAlert } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminPanel = () => {
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  
  // CRUD Data State
  const [questions, setQuestions] = useState([]);
  const [careers, setCareers] = useState([]);
  const [courses, setCourses] = useState([]);

  // Modals state
  const [isQuestionOpen, setIsQuestionOpen] = useState(false);
  const [isCareerOpen, setIsCareerOpen] = useState(false);
  const [isCourseOpen, setIsCourseOpen] = useState(false);

  // Edit target state
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editingCareer, setEditingCareer] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);

  // Form Fields State
  const [questionForm, setQuestionForm] = useState({
    text: '', category: 'interest', options: 'Strongly Disagree, Disagree, Neutral, Agree, Strongly Agree',
    realistic: 0, investigative: 0, artistic: 0, social: 0, enterprising: 0, conventional: 0,
    aptitudeType: '', correctOption: ''
  });

  const [careerForm, setCareerForm] = useState({
    title: '', description: '', avgSalary: 0, growthOutlook: 'Stable',
    realistic: 0, investigative: 0, artistic: 0, social: 0, enterprising: 0, conventional: 0,
    logical: 0, numerical: 0, verbal: 0
  });

  const [courseForm, setCourseForm] = useState({
    title: '', provider: '', link: '', duration: '', level: 'Beginner', relatedCareers: []
  });

  // Fetch initial dataset
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes, qRes, carRes, courRes] = await Promise.all([
        api.get('/api/admin/analytics'),
        api.get('/api/admin/questions'),
        api.get('/api/admin/careers'),
        api.get('/api/admin/courses')
      ]);
      setAnalytics(analyticsRes.data?.analytics || null);
      setQuestions(qRes.data?.questions || []);
      setCareers(carRes.data?.careers || []);
      setCourses(courRes.data?.courses || []);
    } catch {
      toastError('Failed to load admin dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- QUESTION CRUD Actions ---
  const openAddQuestion = () => {
    setEditingQuestion(null);
    setQuestionForm({
      text: '', category: 'interest', options: 'Strongly Disagree, Disagree, Neutral, Agree, Strongly Agree',
      realistic: 0, investigative: 0, artistic: 0, social: 0, enterprising: 0, conventional: 0,
      aptitudeType: '', correctOption: ''
    });
    setIsQuestionOpen(true);
  };

  const openEditQuestion = (q) => {
    setEditingQuestion(q);
    setQuestionForm({
      text: q.text,
      category: q.category,
      options: q.options.join(', '),
      realistic: q.riasecWeights?.realistic || 0,
      investigative: q.riasecWeights?.investigative || 0,
      artistic: q.riasecWeights?.artistic || 0,
      social: q.riasecWeights?.social || 0,
      enterprising: q.riasecWeights?.enterprising || 0,
      conventional: q.riasecWeights?.conventional || 0,
      aptitudeType: q.aptitudeType || '',
      correctOption: q.correctOption || ''
    });
    setIsQuestionOpen(true);
  };

  const saveQuestion = async (e) => {
    e.preventDefault();
    const payload = {
      text: questionForm.text,
      category: questionForm.category,
      options: questionForm.options.split(',').map(s => s.trim()).filter(Boolean),
      riasecWeights: {
        realistic: Number(questionForm.realistic),
        investigative: Number(questionForm.investigative),
        artistic: Number(questionForm.artistic),
        social: Number(questionForm.social),
        enterprising: Number(questionForm.enterprising),
        conventional: Number(questionForm.conventional)
      },
      aptitudeType: questionForm.aptitudeType,
      correctOption: questionForm.correctOption
    };

    try {
      if (editingQuestion) {
        await api.put(`/api/admin/questions/${editingQuestion._id}`, payload);
        success('Question updated successfully.');
      } else {
        await api.post('/api/admin/questions', payload);
        success('Question created successfully.');
      }
      setIsQuestionOpen(false);
      loadData();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to save question.');
    }
  };

  const deleteQuestion = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await api.delete(`/api/admin/questions/${id}`);
      success('Question deleted.');
      loadData();
    } catch {
      toastError('Failed to delete question.');
    }
  };

  // --- CAREER CRUD Actions ---
  const openAddCareer = () => {
    setEditingCareer(null);
    setCareerForm({
      title: '', description: '', avgSalary: 0, growthOutlook: 'Stable',
      realistic: 0, investigative: 0, artistic: 0, social: 0, enterprising: 0, conventional: 0,
      logical: 0, numerical: 0, verbal: 0
    });
    setIsCareerOpen(true);
  };

  const openEditCareer = (c) => {
    setEditingCareer(c);
    setCareerForm({
      title: c.title,
      description: c.description,
      avgSalary: c.avgSalary || 0,
      growthOutlook: c.growthOutlook || 'Stable',
      realistic: c.riasecWeights?.realistic || 0,
      investigative: c.riasecWeights?.investigative || 0,
      artistic: c.riasecWeights?.artistic || 0,
      social: c.riasecWeights?.social || 0,
      enterprising: c.riasecWeights?.enterprising || 0,
      conventional: c.riasecWeights?.conventional || 0,
      logical: c.requiredAptitude?.logical || c.requiredAptitude?.get?.('logical') || 0,
      numerical: c.requiredAptitude?.numerical || c.requiredAptitude?.get?.('numerical') || 0,
      verbal: c.requiredAptitude?.verbal || c.requiredAptitude?.get?.('verbal') || 0
    });
    setIsCareerOpen(true);
  };

  const saveCareer = async (e) => {
    e.preventDefault();
    const payload = {
      title: careerForm.title,
      description: careerForm.description,
      avgSalary: Number(careerForm.avgSalary),
      growthOutlook: careerForm.growthOutlook,
      riasecWeights: {
        realistic: Number(careerForm.realistic),
        investigative: Number(careerForm.investigative),
        artistic: Number(careerForm.artistic),
        social: Number(careerForm.social),
        enterprising: Number(careerForm.enterprising),
        conventional: Number(careerForm.conventional)
      },
      requiredAptitude: {
        logical: Number(careerForm.logical),
        numerical: Number(careerForm.numerical),
        verbal: Number(careerForm.verbal)
      }
    };

    try {
      if (editingCareer) {
        await api.put(`/api/admin/careers/${editingCareer._id}`, payload);
        success('Career profile updated successfully.');
      } else {
        await api.post('/api/admin/careers', payload);
        success('Career profile created successfully.');
      }
      setIsCareerOpen(false);
      loadData();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to save career.');
    }
  };

  const deleteCareer = async (id) => {
    if (!window.confirm('Deleting this career may break linked courses. Proceed?')) return;
    try {
      await api.delete(`/api/admin/careers/${id}`);
      success('Career deleted.');
      loadData();
    } catch {
      toastError('Failed to delete career.');
    }
  };

  // --- COURSE CRUD Actions ---
  const openAddCourse = () => {
    setEditingCourse(null);
    setCourseForm({
      title: '', provider: '', link: '', duration: '', level: 'Beginner', relatedCareers: []
    });
    setIsCourseOpen(true);
  };

  const openEditCourse = (c) => {
    setEditingCourse(c);
    setCourseForm({
      title: c.title,
      provider: c.provider,
      link: c.link,
      duration: c.duration || '',
      level: c.level || 'Beginner',
      relatedCareers: c.relatedCareers ? c.relatedCareers.map(rc => rc._id || rc) : []
    });
    setIsCourseOpen(true);
  };

  const saveCourse = async (e) => {
    e.preventDefault();
    const payload = { ...courseForm };

    try {
      if (editingCourse) {
        await api.put(`/api/admin/courses/${editingCourse._id}`, payload);
        success('Course updated successfully.');
      } else {
        await api.post('/api/admin/courses', payload);
        success('Course created successfully.');
      }
      setIsCourseOpen(false);
      loadData();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to save course.');
    }
  };

  const deleteCourse = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      await api.delete(`/api/admin/courses/${id}`);
      success('Course deleted.');
      loadData();
    } catch {
      toastError('Failed to delete course.');
    }
  };

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-300">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 m-0 flex items-center">
            <ShieldAlert className="w-6 h-6 text-rose-500 mr-2 shrink-0 animate-pulse" />
            Administrator Panel
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage assessment questions, edit career paths, customize online courses, and track analytics.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-slate-800" />
              <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 dark:border-t-indigo-400 animate-spin" />
            </div>
            <p className="mt-4 text-sm font-medium">Loading panel data...</p>
          </div>
        ) : (
          <Tabs defaultValue="analytics">
            <TabsList className="mb-6">
              <TabsTrigger value="analytics">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="questions">
                <HelpCircle className="w-4 h-4 mr-2" />
                Questions ({questions.length})
              </TabsTrigger>
              <TabsTrigger value="careers">
                <Briefcase className="w-4 h-4 mr-2" />
                Careers ({careers.length})
              </TabsTrigger>
              <TabsTrigger value="courses">
                <GraduationCap className="w-4 h-4 mr-2" />
                Courses ({courses.length})
              </TabsTrigger>
            </TabsList>

            {/* TAB CONTENT: ANALYTICS */}
            <TabsContent value="analytics" className="space-y-8">
              {/* Analytics summary row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6 flex items-center space-x-4">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Total Students</p>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1">
                        {analytics?.totalStudents || 0}
                      </h3>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 flex items-center space-x-4">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Assessments Taken</p>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1">
                        {analytics?.totalAssessments || 0}
                      </h3>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 flex items-center space-x-4">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Completion Rate</p>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1">
                        {analytics?.completionRate || 0}%
                      </h3>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Aggregation Recommendation count graph */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Recommended Careers</CardTitle>
                  <CardDescription>Most frequent matches generated by the recommendation engine</CardDescription>
                </CardHeader>
                <CardContent className="h-[280px]">
                  {analytics?.topCareers && analytics.topCareers.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.topCareers} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                        <XAxis dataKey="careerTitle" stroke="#64748b" fontSize={11} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                        <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                      No assessment recommendations have been completed yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB CONTENT: QUESTIONS CRUD */}
            <TabsContent value="questions" className="space-y-6">
              <div className="flex justify-between items-center">
                <CardDescription>Manage the test bank questions. Minimum 20 required.</CardDescription>
                <Button onClick={openAddQuestion} className="cursor-pointer">
                  <Plus className="w-4 h-4 mr-1.5" /> Add Question
                </Button>
              </div>

              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase text-xs tracking-wider">
                        <th className="p-4 pl-6">Question Text</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Subtype</th>
                        <th className="p-4 text-right pr-6">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {questions.map((q) => (
                        <tr key={q._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                          <td className="p-4 pl-6 font-medium text-slate-900 dark:text-slate-100 max-w-md truncate">
                            {q.text}
                          </td>
                          <td className="p-4">
                            <Badge variant={q.category === 'aptitude' ? 'default' : q.category === 'interest' ? 'success' : 'neutral'}>
                              {q.category}
                            </Badge>
                          </td>
                          <td className="p-4 text-xs font-mono text-slate-500">
                            {q.category === 'aptitude' ? q.aptitudeType : '-'}
                          </td>
                          <td className="p-4 text-right pr-6 space-x-2 shrink-0">
                            <Button variant="outline" size="sm" onClick={() => openEditQuestion(q)} className="h-8">
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => deleteQuestion(q._id)} className="h-8">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            {/* TAB CONTENT: CAREERS CRUD */}
            <TabsContent value="careers" className="space-y-6">
              <div className="flex justify-between items-center">
                <CardDescription>Available careers that the AI recommendations engine maps to.</CardDescription>
                <Button onClick={openAddCareer} className="cursor-pointer">
                  <Plus className="w-4 h-4 mr-1.5" /> Add Career
                </Button>
              </div>

              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase text-xs tracking-wider">
                        <th className="p-4 pl-6">Title</th>
                        <th className="p-4">Salary</th>
                        <th className="p-4">Outlook</th>
                        <th className="p-4 text-right pr-6">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {careers.map((c) => (
                        <tr key={c._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                          <td className="p-4 pl-6 font-bold text-slate-900 dark:text-slate-100">
                            {c.title}
                          </td>
                          <td className="p-4 text-xs font-semibold text-slate-600">
                            ${c.avgSalary?.toLocaleString() || '0'}
                          </td>
                          <td className="p-4">
                            <Badge variant={c.growthOutlook === 'Excellent' || c.growthOutlook === 'Very Strong' ? 'success' : 'neutral'}>
                              {c.growthOutlook || 'Stable'}
                            </Badge>
                          </td>
                          <td className="p-4 text-right pr-6 space-x-2">
                            <Button variant="outline" size="sm" onClick={() => openEditCareer(c)} className="h-8">
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => deleteCareer(c._id)} className="h-8">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            {/* TAB CONTENT: COURSES CRUD */}
            <TabsContent value="courses" className="space-y-6">
              <div className="flex justify-between items-center">
                <CardDescription>Courses recommended to students. Links to online platforms.</CardDescription>
                <Button onClick={openAddCourse} className="cursor-pointer">
                  <Plus className="w-4 h-4 mr-1.5" /> Add Course
                </Button>
              </div>

              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase text-xs tracking-wider">
                        <th className="p-4 pl-6">Course Title</th>
                        <th className="p-4">Provider</th>
                        <th className="p-4">Level</th>
                        <th className="p-4">Linked Careers</th>
                        <th className="p-4 text-right pr-6">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {courses.map((c) => (
                        <tr key={c._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                          <td className="p-4 pl-6 font-medium text-slate-900 dark:text-slate-100 max-w-xs truncate">
                            {c.title}
                          </td>
                          <td className="p-4 text-xs font-semibold text-slate-600">
                            {c.provider}
                          </td>
                          <td className="p-4">
                            <Badge variant="default" className="text-[10px]">
                              {c.level || 'Beginner'}
                            </Badge>
                          </td>
                          <td className="p-4 max-w-[150px] truncate text-xs text-slate-400">
                            {c.relatedCareers?.map(rc => rc.title).join(', ') || '-'}
                          </td>
                          <td className="p-4 text-right pr-6 space-x-2">
                            <Button variant="outline" size="sm" onClick={() => openEditCourse(c)} className="h-8">
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => deleteCourse(c._id)} className="h-8">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* --- MODAL DIALOGS FOR CRUD --- */}

        {/* 1. Question Dialog */}
        <Dialog
          isOpen={isQuestionOpen}
          onClose={() => setIsQuestionOpen(false)}
          title={editingQuestion ? 'Edit Question' : 'Add Question'}
          footer={
            <>
              <Button variant="outline" onClick={() => setIsQuestionOpen(false)} className="mr-2">Cancel</Button>
              <Button onClick={saveQuestion}>Save Question</Button>
            </>
          }
        >
          <form className="space-y-4">
            <div>
              <Label>Question Text</Label>
              <Input
                value={questionForm.text}
                onChange={e => setQuestionForm({ ...questionForm, text: e.target.value })}
                placeholder="I love assembling computers..."
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select
                  value={questionForm.category}
                  onChange={e => setQuestionForm({ ...questionForm, category: e.target.value })}
                  options={[
                    { value: 'interest', label: 'Interest (RIASEC)' },
                    { value: 'aptitude', label: 'Aptitude' },
                    { value: 'personality', label: 'Personality' }
                  ]}
                />
              </div>
              {questionForm.category === 'aptitude' ? (
                <div>
                  <Label>Aptitude Type</Label>
                  <Select
                    value={questionForm.aptitudeType}
                    onChange={e => setQuestionForm({ ...questionForm, aptitudeType: e.target.value })}
                    options={[
                      { value: '', label: 'None' },
                      { value: 'logical', label: 'Logical' },
                      { value: 'numerical', label: 'Numerical' },
                      { value: 'verbal', label: 'Verbal' }
                    ]}
                  />
                </div>
              ) : null}
            </div>

            {questionForm.category === 'aptitude' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Options (Comma Separated)</Label>
                  <Input
                    value={questionForm.options}
                    onChange={e => setQuestionForm({ ...questionForm, options: e.target.value })}
                    placeholder="Yes, No, Maybe"
                  />
                </div>
                <div>
                  <Label>Correct Option</Label>
                  <Input
                    value={questionForm.correctOption}
                    onChange={e => setQuestionForm({ ...questionForm, correctOption: e.target.value })}
                    placeholder="Yes"
                  />
                </div>
              </div>
            ) : (
              <div>
                <Label>Options (Comma Separated Likert)</Label>
                <Input
                  value={questionForm.options}
                  onChange={e => setQuestionForm({ ...questionForm, options: e.target.value })}
                  placeholder="Strongly Disagree, Disagree, Neutral, Agree, Strongly Agree"
                />
              </div>
            )}

            {questionForm.category === 'interest' && (
              <div>
                <Label className="mb-2">RIASEC Weights (Holland Codes)</Label>
                <div className="grid grid-cols-3 gap-3">
                  {['realistic', 'investigative', 'artistic', 'social', 'enterprising', 'conventional'].map(k => (
                    <div key={k}>
                      <Label className="text-xs uppercase">{k.substring(0,3)} Weight</Label>
                      <Input
                        type="number"
                        min="0"
                        max="5"
                        value={questionForm[k]}
                        onChange={e => setQuestionForm({ ...questionForm, [k]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        </Dialog>

        {/* 2. Career Dialog */}
        <Dialog
          isOpen={isCareerOpen}
          onClose={() => setIsCareerOpen(false)}
          title={editingCareer ? 'Edit Career Path' : 'Add Career Path'}
          footer={
            <>
              <Button variant="outline" onClick={() => setIsCareerOpen(false)} className="mr-2">Cancel</Button>
              <Button onClick={saveCareer}>Save Career</Button>
            </>
          }
        >
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Career Title</Label>
                <Input
                  value={careerForm.title}
                  onChange={e => setCareerForm({ ...careerForm, title: e.target.value })}
                  placeholder="Civil Engineer"
                  required
                />
              </div>
              <div>
                <Label>Growth Outlook</Label>
                <Select
                  value={careerForm.growthOutlook}
                  onChange={e => setCareerForm({ ...careerForm, growthOutlook: e.target.value })}
                  options={[
                    { value: 'Excellent', label: 'Excellent' },
                    { value: 'Very Strong', label: 'Very Strong' },
                    { value: 'Strong', label: 'Strong' },
                    { value: 'Stable', label: 'Stable' },
                    { value: 'Good', label: 'Good' }
                  ]}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Average Salary ($)</Label>
                <Input
                  type="number"
                  min="0"
                  value={careerForm.avgSalary}
                  onChange={e => setCareerForm({ ...careerForm, avgSalary: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={careerForm.description}
                onChange={e => setCareerForm({ ...careerForm, description: e.target.value })}
                placeholder="Brief summary of duties..."
                required
              />
            </div>
            <div>
              <Label className="mb-2">RIASEC Career Alignments</Label>
              <div className="grid grid-cols-3 gap-3">
                {['realistic', 'investigative', 'artistic', 'social', 'enterprising', 'conventional'].map(k => (
                  <div key={k}>
                    <Label className="text-xs uppercase">{k.substring(0,3)} Weight</Label>
                    <Input
                      type="number"
                      min="0"
                      max="5"
                      value={careerForm[k]}
                      onChange={e => setCareerForm({ ...careerForm, [k]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2">Required Cognitive Aptitudes</Label>
              <div className="grid grid-cols-3 gap-3">
                {['logical', 'numerical', 'verbal'].map(k => (
                  <div key={k}>
                    <Label className="text-xs uppercase">{k}</Label>
                    <Input
                      type="number"
                      min="0"
                      max="5"
                      value={careerForm[k]}
                      onChange={e => setCareerForm({ ...careerForm, [k]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </div>
          </form>
        </Dialog>

        {/* 3. Course Dialog */}
        <Dialog
          isOpen={isCourseOpen}
          onClose={() => setIsCourseOpen(false)}
          title={editingCourse ? 'Edit Course' : 'Add Course'}
          footer={
            <>
              <Button variant="outline" onClick={() => setIsCourseOpen(false)} className="mr-2">Cancel</Button>
              <Button onClick={saveCourse}>Save Course</Button>
            </>
          }
        >
          <form className="space-y-4">
            <div>
              <Label>Course Title</Label>
              <Input
                value={courseForm.title}
                onChange={e => setCourseForm({ ...courseForm, title: e.target.value })}
                placeholder="Data Science 101"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Provider</Label>
                <Input
                  value={courseForm.provider}
                  onChange={e => setCourseForm({ ...courseForm, provider: e.target.value })}
                  placeholder="Coursera"
                  required
                />
              </div>
              <div>
                <Label>Level</Label>
                <Select
                  value={courseForm.level}
                  onChange={e => setCourseForm({ ...courseForm, level: e.target.value })}
                  options={[
                    { value: 'Beginner', label: 'Beginner' },
                    { value: 'Intermediate', label: 'Intermediate' },
                    { value: 'Advanced', label: 'Advanced' }
                  ]}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Link / URL</Label>
                <Input
                  value={courseForm.link}
                  onChange={e => setCourseForm({ ...courseForm, link: e.target.value })}
                  placeholder="https://..."
                  required
                />
              </div>
              <div>
                <Label>Duration</Label>
                <Input
                  value={courseForm.duration}
                  onChange={e => setCourseForm({ ...courseForm, duration: e.target.value })}
                  placeholder="6 weeks"
                />
              </div>
            </div>
            <div>
              <Label>Link to Careers (Select Multiple)</Label>
              <select
                multiple
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 h-32"
                value={courseForm.relatedCareers}
                onChange={e => {
                  const opts = Array.from(e.target.selectedOptions, option => option.value);
                  setCourseForm({ ...courseForm, relatedCareers: opts });
                }}
              >
                {careers.map(c => (
                  <option key={c._id} value={c._id}>{c.title}</option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">Hold Ctrl (Cmd) to select multiple careers.</p>
            </div>
          </form>
        </Dialog>

      </div>
    </Layout>
  );
};

export default AdminPanel;
