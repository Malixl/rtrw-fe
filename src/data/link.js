import { Action } from '@/constants';
import * as Model from '@/models';
import * as Auth from '@/pages/auth';
import * as Dashboard from '@/pages/dashboard';
import * as Landing from '@/pages/landing';
import { DashboardOutlined, FileDoneOutlined, DatabaseOutlined, UserOutlined } from '@ant-design/icons';

export const landingLink = [
  {
    label: 'Beranda',
    key: '/',
    element: Landing.Home
  },
  {
    label: 'Periode',
    key: '/periode',
    element: Landing.Periode
  },
  {
    label: 'Map',
    key: '/map',
    element: Landing.Maps
    // No capability here - Maps.jsx handles access control internally (blur map for guests)
  },
  {
    label: 'Berita',
    key: '/berita',
    element: Landing.News
  }
];

/**
 * @typedef {Object} DashboardLinkChild
 * @property {string} path - Route path
 * @property {string} label - Menu label
 * @property {import('react').ComponentType} element - Page component
 * @property {string} [icon] - Icon component
 * @property {import('@/constants/Role').Role[]} [roles] - Required roles
 * @property {[Action, import('@/models/Model').ModelChildren][]} [permissions] - Required permissions
 * @property {string} [capability] - Single capability required
 * @property {string[]} [capabilities] - Multiple capabilities (any)
 * @property {boolean} [requireAllCapabilities] - If true, all capabilities are required
 */

/**
 * @typedef {Object} DashboardLinkGroup
 * @property {string} label - Group label
 * @property {import('react').ComponentType} icon - Group icon
 * @property {DashboardLinkChild[]} children - Menu items
 * @property {[Action, import('@/models/Model').ModelChildren][]} [permissions] - Computed permissions
 * @property {import('@/constants/Role').Role[]} [roles] - Computed roles
 */

/** @type {DashboardLinkGroup[]} */
export const dashboardLink = [
  {
    label: 'Overview',
    icon: DashboardOutlined,
    children: [
      {
        path: '/dashboard',
        label: 'Dashboard',
        element: Dashboard.Dashboard,
        capability: 'can_access_dashboard'
      }
    ]
  },
  {
    label: 'Data RTRW',
    icon: FileDoneOutlined,
    children: [
      {
        path: '/dashboard/periode',
        label: 'Periode',
        element: Dashboard.Periode,
        permissions: [[Action.READ, Model.Rtrws]],
        capability: 'can_crud_map'
      },
      {
        path: '/dashboard/rtrw',
        label: 'RTRW',
        element: Dashboard.Rtrws,
        permissions: [[Action.READ, Model.Rtrws]],
        capability: 'can_crud_map'
      }
    ]
  },
  {
    label: 'Master Data',
    icon: DatabaseOutlined,
    children: [
      {
        path: '/dashboard/klasifikasi',
        label: 'Klasifikasi',
        element: Dashboard.Klasifikasi,
        permissions: [[Action.READ, Model.Klasifikasis]],
        capability: 'can_crud_map'
      },
      {
        path: '/dashboard/polaruang',
        label: 'Polaruang',
        element: Dashboard.Polaruang,
        permissions: [[Action.READ, Model.Polaruangs]],
        capability: 'can_crud_map'
      },
      {
        path: '/dashboard/struktur_ruang',
        label: 'Struktur Ruang',
        element: Dashboard.StrukturRuang,
        capability: 'can_crud_map'
      },
      {
        path: '/dashboard/ketentuan_khusus',
        label: 'Ketentuan Khusus',
        element: Dashboard.KetentuanKhusus,
        capability: 'can_crud_map'
      },
      {
        path: '/dashboard/pkkprl',
        label: 'PKKPRL',
        element: Dashboard.Pkkprl,
        capability: 'can_crud_map'
      },
      {
        path: '/dashboard/indikasi_program',
        label: 'Indikasi Program',
        element: Dashboard.IndikasiPrograms,
        capability: 'can_crud_map'
      },
      {
        path: '/dashboard/batas_administrasi',
        label: 'Batas Administrasi',
        element: Dashboard.BatasAdministrasi,
        capability: 'can_crud_map'
      },
      {
        path: '/dashboard/berita',
        label: 'Berita',
        element: Dashboard.News,
        capability: 'can_crud_map'
      }
    ]
  },
  {
    label: 'Data User',
    icon: UserOutlined,
    children: [
      {
        path: '/dashboard/users',
        label: 'User Management',
        element: Dashboard.Users,
        capability: 'can_manage_users'
      }
    ]
  }
].map((item) => ({
  ...item,
  permissions: item.children.flatMap((child) => child.permissions).filter((permission) => permission),
  roles: item.children.flatMap((child) => child.roles).filter((role) => role)
}));

export const authLink = [
  {
    path: '/auth/login',
    element: Auth.Login
  }
];
