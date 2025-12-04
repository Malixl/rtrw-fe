import { useAuth } from '@/hooks';
import PropTypes from 'prop-types';

/**
 * CapabilityGate - Conditionally renders children based on user capabilities
 * Useful for hiding/showing buttons, menu items, or any UI element based on permissions
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The content to render if capability check passes
 * @param {string} [props.capability] - Single capability to check
 * @param {string[]} [props.capabilities] - Array of capabilities - user needs at least one
 * @param {boolean} [props.requireAll=false] - If true, user needs ALL capabilities
 * @param {boolean} [props.requireAuth=false] - If true, user must be authenticated
 * @param {React.ReactNode} [props.fallback=null] - Optional content to render when unauthorized
 *
 * @example
 * // Single capability check
 * <CapabilityGate capability="can_crud_map">
 *   <Button>Edit Data</Button>
 * </CapabilityGate>
 *
 * @example
 * // Multiple capabilities (any)
 * <CapabilityGate capabilities={['can_crud_map', 'can_manage_users']}>
 *   <AdminPanel />
 * </CapabilityGate>
 *
 * @example
 * // With fallback
 * <CapabilityGate capability="can_manage_users" fallback={<span>View Only</span>}>
 *   <Button>Manage Users</Button>
 * </CapabilityGate>
 */
const CapabilityGate = ({ children, capability, capabilities = [], requireAll = false, requireAuth = false, fallback = null }) => {
  const { isAuthenticated, hasCapability } = useAuth();

  // Check authentication if required
  if (requireAuth && !isAuthenticated) {
    return fallback;
  }

  // Combine single capability with array
  const requiredCapabilities = capability ? [capability] : capabilities;

  // If no capabilities required, render children
  if (requiredCapabilities.length === 0) {
    return children;
  }

  // Check capabilities
  const hasRequiredCapability = requireAll ? requiredCapabilities.every((cap) => hasCapability(cap)) : requiredCapabilities.some((cap) => hasCapability(cap));

  if (!hasRequiredCapability) {
    return fallback;
  }

  return children;
};

CapabilityGate.propTypes = {
  children: PropTypes.node.isRequired,
  capability: PropTypes.string,
  capabilities: PropTypes.arrayOf(PropTypes.string),
  requireAll: PropTypes.bool,
  requireAuth: PropTypes.bool,
  fallback: PropTypes.node
};

export default CapabilityGate;
