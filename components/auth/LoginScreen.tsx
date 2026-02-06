'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

type AuthenticationStatus = 'idle' | 'loading' | 'success' | 'error';

interface LoginScreenProps {
  status: AuthenticationStatus;
  errorMessage?: string;
  successMessage?: string;
  onLogin: () => void;
}

export function LoginScreen({
  status,
  errorMessage,
  successMessage,
  onLogin,
}: LoginScreenProps) {
  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-stone-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900 mb-4">
            <svg
              className="w-8 h-8 text-orange-600 dark:text-orange-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Azure Feature Toggle Tool
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage feature flags with ease
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border-slate-200 dark:border-slate-800">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center">Welcome</CardTitle>
            <CardDescription className="text-center">
              Sign in to manage your Azure App Configuration feature toggles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Success State */}
            {isSuccess && (
              <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                    {successMessage || 'Login successful!'}
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                    Redirecting to dashboard...
                  </p>
                </div>
              </div>
            )}

            {/* Error State */}
            {isError && errorMessage && (
              <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-900 dark:text-red-100">{errorMessage}</p>
              </div>
            )}

            {/* Login Button */}
            <Button
              onClick={onLogin}
              disabled={isLoading || isSuccess}
              className="w-full h-12 text-base bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Signed in
                </>
              ) : (
                <>
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 21 21" fill="currentColor">
                    <path d="M10.5 0C4.701 0 0 4.701 0 10.5S4.701 21 10.5 21 21 16.299 21 10.5 16.299 0 10.5 0zm0 19.95c-5.213 0-9.45-4.237-9.45-9.45S5.287 1.05 10.5 1.05s9.45 4.237 9.45 9.45-4.237 9.45-9.45 9.45z" />
                    <path d="M14.371 9.502h-2.319V7.183c0-.644-.525-1.169-1.169-1.169h-.766c-.644 0-1.169.525-1.169 1.169v2.319H6.629c-.644 0-1.169.525-1.169 1.169v.766c0 .644.525 1.169 1.169 1.169h2.319v2.319c0 .644.525 1.169 1.169 1.169h.766c.644 0 1.169-.525 1.169-1.169v-2.319h2.319c.644 0 1.169-.525 1.169-1.169v-.766c0-.644-.525-1.169-1.169-1.169z" />
                  </svg>
                  Sign in with Microsoft
                </>
              )}
            </Button>

            {/* Info text */}
            <p className="text-xs text-center text-slate-500 dark:text-slate-400 pt-2">
              You'll be redirected to Microsoft to complete sign-in
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Need access?{' '}
            <a
              href="#"
              className="text-orange-600 dark:text-orange-400 hover:underline font-medium"
            >
              Contact your administrator
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
