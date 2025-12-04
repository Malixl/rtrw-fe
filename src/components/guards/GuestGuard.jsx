import { useAuth } from '@/hooks';
import { Skeleton } from 'antd';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';

/**
 * GuestGuard - For pages that should only be accessible to non-authenticated users
 * Redirects to appropriate page based on role if already logged in
 * Used for: Login page, Register page, Forgot Password page
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The content to render if guest
 */
const GuestGuard = ({ children }) => {
  const { isAuthenticated, isLoading, getRedirectAfterLogin } = useAuth();

  // Show loading state
  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }

  // If already authenticated, redirect to appropriate page based on role
  if (isAuthenticated) {
    const redirectPath = getRedirectAfterLogin();
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

GuestGuard.propTypes = {
  children: PropTypes.node.isRequired
};

export default GuestGuard;
