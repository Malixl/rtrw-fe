import { useAuth } from '@/hooks';
import { Skeleton } from 'antd';
import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * AuthGuard - Requires user to be authenticated
 * Redirects to login page if not authenticated
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The content to render if authenticated
 */
const AuthGuard = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { pathname } = useLocation();

  // Show loading state
  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    const loginPath = `/auth/login?redirect=${encodeURIComponent(pathname)}`;
    return <Navigate to={loginPath} replace />;
  }

  return children;
};

AuthGuard.propTypes = {
  children: PropTypes.node.isRequired
};

export default AuthGuard;
