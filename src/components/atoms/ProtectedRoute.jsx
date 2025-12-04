import { useAuth } from '@/hooks';
import { Result, Skeleton } from 'antd';
import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * ProtectedRoute - A component that protects routes based on authentication and capabilities
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The content to render if authorized
 * @param {string} [props.capability] - Single capability to check (e.g., 'can_access_dashboard')
 * @param {string[]} [props.capabilities] - Array of capabilities - user needs at least one
 * @param {boolean} [props.requireAll=false] - If true, user needs ALL capabilities instead of just one
 * @param {boolean} [props.requireAuth=true] - If true, user must be authenticated
 * @param {string} [props.redirectTo] - Custom redirect path for unauthorized users
 * @param {React.ReactNode} [props.fallback] - Custom fallback component instead of 403 page
 */
const ProtectedRoute = ({ children, capability, capabilities = [], requireAll = false, requireAuth = true, redirectTo, fallback }) => {
  const { isAuthenticated, isLoading, hasCapability } = useAuth();
  const { pathname } = useLocation();

  // Show loading state
  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    const loginPath = `/auth/login?redirect=${encodeURIComponent(pathname)}`;
    return <Navigate to={redirectTo || loginPath} replace />;
  }

  // If no capability requirements, just check auth
  const requiredCapabilities = capability ? [capability] : capabilities;

  if (requiredCapabilities.length === 0) {
    return children;
  }

  // Check capabilities
  const hasRequiredCapability = requireAll ? requiredCapabilities.every((cap) => hasCapability(cap)) : requiredCapabilities.some((cap) => hasCapability(cap));

  if (!hasRequiredCapability) {
    // Return custom fallback or default 403 page
    if (fallback) {
      return fallback;
    }

    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }

    return <Result status="403" title="Akses Ditolak" subTitle="Anda tidak memiliki izin untuk mengakses halaman ini" />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  capability: PropTypes.string,
  capabilities: PropTypes.arrayOf(PropTypes.string),
  requireAll: PropTypes.bool,
  requireAuth: PropTypes.bool,
  redirectTo: PropTypes.string,
  fallback: PropTypes.node
};

export default ProtectedRoute;
