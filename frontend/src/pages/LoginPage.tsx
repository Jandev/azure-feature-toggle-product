import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginScreen } from '@/components/sections/authentication/LoginScreen';
import { useAuth } from '@/context/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>();
  const hasRedirected = useRef(false);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated && !hasRedirected.current) {
      console.log('User is authenticated, redirecting to dashboard...');
      hasRedirected.current = true;
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async () => {
    try {
      setStatus('loading');
      setErrorMessage(undefined);
      
      console.log('LoginPage: Starting login...');
      await login();
      console.log('LoginPage: Login completed');
      
      // Don't set success here - let the useEffect handle it when isAuthenticated changes
    } catch (error) {
      console.error('LoginPage: Login error:', error);
      setStatus('error');
      setErrorMessage(
        error instanceof Error 
          ? error.message 
          : 'Failed to sign in. Please try again.'
      );
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
