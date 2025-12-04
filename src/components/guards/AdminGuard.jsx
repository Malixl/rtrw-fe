import { useAuth } from '@/hooks';
import { Role } from '@/constants';
import { Result, Skeleton } from 'antd';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';

/**
 * AdminGuard - Requires user to have Admin role
 * Redirects to /map if not admin, or shows 403 page
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The content to render if admin
 * @param {boolean} [props.showForbidden=false] - Show 403 page instead of redirect
 */
const AdminGuard = ({ children, showForbidden = false }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show loading state
  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  // Check if user is admin
  const isAdmin = user?.role === Role.ADMIN;

  if (!isAdmin) {
    if (showForbidden) {
      return <Result status="403" title="Akses Ditolak" subTitle="Halaman ini hanya dapat diakses oleh Administrator" />;
    }
    // Redirect OPD/Guest to map page
    return <Navigate to="/map" replace />;
  }

  return children;
};

AdminGuard.propTypes = {
  children: PropTypes.node.isRequired,
  showForbidden: PropTypes.bool
};

export default AdminGuard;
