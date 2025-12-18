import Model from './Model';
import Role, { Capabilities, DEFAULT_GUEST_CAPABILITIES, DEFAULT_OPD_CAPABILITIES, DEFAULT_ADMIN_CAPABILITIES, ROLE_CAPABILITIES } from '@/constants/Role';

/**
 * Response dari API login
 */
export interface LoginResponse {
  token_type: string;
  token: string;
  user: IncomingApiData;
}

/**
 * State untuk authentication
 */
export interface AuthState {
  token: string;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  capabilities: Capabilities;
}

export interface IncomingApiData {
  id: number;
  email: string;
  name: string;
  role?:
    | {
        name: string;
      }
    | string
    | null;
  permissions?: string[];
  capabilities?: Capabilities;
  created_at?: string;
  updated_at?: string;
}

/**
 * Data untuk create/update user
 */
export interface OutgoingApiData {
  name?: string;
  email: string;
  password?: string;
  password_confirmation?: string;
  role?: string;
}

export default class User extends Model {
  constructor(
    public id: number,
    public email: string,
    public name: string,
    public token: string,
    public role: string = 'guest',
    public permissions: string[] = [],
    public capabilities: Capabilities = DEFAULT_GUEST_CAPABILITIES,
    public createdAt?: string,
    public updatedAt?: string
  ) {
    super();
  }

  is(role: string): boolean {
    return this.role === role;
  }

  isAdmin(): boolean {
    return this.role === Role.ADMIN;
  }

  isOPD(): boolean {
    return this.role === Role.OPD;
  }

  isGuest(): boolean {
    return this.role === Role.GUEST;
  }

  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }

  hasCapability(capability: keyof Capabilities): boolean {
    const value = this.capabilities[capability];
    return typeof value === 'boolean' ? value : !!value;
  }

  canAccessDashboard(): boolean {
    return this.capabilities.can_access_dashboard;
  }

  canAccessMap(): boolean {
    return this.capabilities.can_access_map;
  }

  canViewMap(): boolean {
    return this.capabilities.can_view_map;
  }

  canCrudMap(): boolean {
    return this.capabilities.can_crud_map;
  }

  canManageUsers(): boolean {
    return this.capabilities.can_manage_users;
  }

  /**
   * Check if map should be displayed with blur effect
   */
  shouldBlurMap(): boolean {
    return this.capabilities.show_blur_map ?? !this.canViewMap();
  }

  /**
   * Get redirect path after login based on capabilities
   */
  getRedirectAfterLogin(): string {
    return this.capabilities.redirect_after_login || '/map';
  }

  /**
   * Get login message for guest users
   */
  getLoginMessage(): string {
    return this.capabilities.login_message || 'Silakan login untuk melihat peta secara lengkap';
  }

  can(): boolean {
    return true;
  }

  cant(): boolean {
    return false;
  }

  eitherCan(): boolean {
    return true;
  }

  cantDoAny(): boolean {
    return false;
  }

  static getDefaultCapabilities(role: string): Capabilities {
    return ROLE_CAPABILITIES[role] || DEFAULT_GUEST_CAPABILITIES;
  }

  static fromApiData(apiData: IncomingApiData, token: string): User {
    const roleName = typeof apiData.role === 'string' ? apiData.role : apiData.role?.name || Role.GUEST;

    const permissions = apiData.permissions || [];

    const capabilities = apiData.capabilities || User.getDefaultCapabilities(roleName);

    return new User(apiData.id, apiData.email, apiData.name, token, roleName, permissions, capabilities, apiData.created_at, apiData.updated_at);
  }

  static toApiData(user: User): OutgoingApiData {
    return {
      name: user.name,
      email: user.email,
      role: user.role
    };
  }

  /**
   * Create OutgoingApiData for new user
   */
  static createApiData(data: { name: string; email: string; password: string; password_confirmation: string; role: string }): OutgoingApiData {
    return data;
  }
}
