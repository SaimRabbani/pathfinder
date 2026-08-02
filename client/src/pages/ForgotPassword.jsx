import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Button, Input, Label } from '../components/Ui';
import ThemeToggle from '../components/ThemeToggle';
import { useToast } from '../hooks/useToast';
import api from '../lib/api';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address')
});

const ForgotPassword = () => {
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const onSubmit = async (data) => {
    setLoading(true);

    try {
      await api.post('/api/auth/forgot-password', { email: data.email });
      success('If an account exists, a reset link will be sent.');
      setSubmitted(true);
    } catch (err) {
      toastError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 p-4 transition-colors dark:bg-slate-950 flex flex-col items-center justify-center">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h2 className="flex items-center justify-center text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            <span className="mr-2.5 inline-block h-8 w-3 rounded-md bg-indigo-600 dark:bg-indigo-500" />
            PathFinder
          </h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              We&apos;ll send you an email containing instructions on how to reset your password.
            </CardDescription>
          </CardHeader>

          {submitted ? (
            <CardContent className="space-y-4 py-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Check your inbox</h3>
              <p className="mx-auto max-w-xs text-sm text-slate-500 dark:text-slate-400">
                If an account matches the email provided, a password reset link will be sent shortly.
              </p>
              <div className="pt-4">
                <Link to="/login">
                  <Button variant="outline" className="w-full">
                    Return to Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="student@example.com"
                    {...register('email')}
                    className={errors.email ? 'border-rose-500 focus:ring-rose-500/20' : ''}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs font-medium text-rose-500">{errors.email.message}</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Sending link...' : 'Send Reset Link'}
                </Button>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center text-sm font-semibold text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Link>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
