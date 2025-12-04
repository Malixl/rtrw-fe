import { useAuth } from '@/hooks';
import { useEffect } from 'react';
import { Outlet, useNavigate, useSearchParams } from 'react-router-dom';

const Auth = () => {
  const { token, isAuthenticated, canAccessDashboard, getRedirectOptions, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');

  useEffect(() => {
    if (isLoading) return;
    if (!token || !isAuthenticated) return;

    // If there's a valid redirect URL, use it
    if (redirect && !redirect.includes('/auth')) {
      navigate(redirect);
      return;
    }

    // Determine best redirect based on capabilities
    const redirectOptions = getRedirectOptions();

    if (canAccessDashboard()) {
      navigate('/dashboard');
    } else if (redirectOptions && redirectOptions.length > 0) {
      // Use first available redirect option
      navigate(redirectOptions[0]);
    } else {
      // Default to home if no special capabilities
      navigate('/');
    }
  }, [navigate, redirect, token, isAuthenticated, canAccessDashboard, getRedirectOptions, isLoading]);

  return (
    <div className="w-full bg-slate-50 font-sans">
      <div className="mx-auto flex min-h-screen w-full max-w-screen-xl flex-col items-center justify-center px-4 py-12">
        <Outlet />
      </div>
    </div>
  );
};

export default Auth;
