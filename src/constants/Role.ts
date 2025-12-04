enum Role {
  ADMIN = 'admin',
  OPD = 'opd',
  GUEST = 'guest'
}

export interface Capabilities {
  can_access_dashboard: boolean;
  can_access_map: boolean;
  can_view_map: boolean;
  can_crud_map: boolean;
  can_manage_users: boolean;
  show_blur_map: boolean;
  redirect_after_login?: string;
  redirect_options: string[];
  navbar_icon: string;
  navbar_label: string;
  login_message?: string;
}

export const DEFAULT_GUEST_CAPABILITIES: Capabilities = {
  can_access_dashboard: false,
  can_access_map: false,
  can_view_map: false,
  can_crud_map: false,
  can_manage_users: false,
  show_blur_map: true,
  redirect_after_login: '/auth/login',
  redirect_options: [],
  navbar_icon: '🔒',
  navbar_label: 'Login',
  login_message: 'Silakan login untuk melihat peta secara lengkap'
};

export const DEFAULT_OPD_CAPABILITIES: Capabilities = {
  can_access_dashboard: true,
  can_access_map: true,
  can_view_map: true,
  can_crud_map: false,
  can_manage_users: false,
  show_blur_map: false,
  redirect_after_login: '/map',
  redirect_options: ['/map'],
  navbar_icon: '👤',
  navbar_label: 'OPD'
};

export const DEFAULT_ADMIN_CAPABILITIES: Capabilities = {
  can_access_dashboard: true,
  can_access_map: true,
  can_view_map: true,
  can_crud_map: true,
  can_manage_users: true,
  show_blur_map: false,
  redirect_after_login: '/dashboard',
  redirect_options: ['/dashboard', '/map'],
  navbar_icon: '👤',
  navbar_label: 'Admin'
};

/**
 * Mapping role ke capabilities default
 */
export const ROLE_CAPABILITIES: Record<string, Capabilities> = {
  [Role.ADMIN]: DEFAULT_ADMIN_CAPABILITIES,
  [Role.OPD]: DEFAULT_OPD_CAPABILITIES,
  [Role.GUEST]: DEFAULT_GUEST_CAPABILITIES
};

/**
 * Get capabilities by role name
 */
export function getCapabilitiesByRole(role: string): Capabilities {
  return ROLE_CAPABILITIES[role] || DEFAULT_GUEST_CAPABILITIES;
}

export default Role;
