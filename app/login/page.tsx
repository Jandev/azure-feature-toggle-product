'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const handleLogin = async () => {
    try {
      setStatus('loading');
      setErrorMessage(undefined);
      
      const result = await signIn('azure-ad', {
        redirect: false,
        callbackUrl: '/dashboard',
      });

      if (result?.error) {
        setStatus('error');
        setErrorMessage('Authentication failed. Please try again.');
      } else if (result?.ok) {
        setStatus('success');
        // Redirect to dashboard
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('Unable to connect to authentication service. Please check your internet connection.');
    }
  };

  return (
    <LoginScreen
      status={status}
      errorMessage={errorMessage}
      onLogin={handleLogin}
    />
  );
}
