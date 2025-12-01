import { Action } from '@/constants';
import * as Model from '@/models';
import * as Auth from '@/pages/auth';
import * as Dashboard from '@/pages/dashboard';
import * as Landing from '@/pages/landing';
import { DashboardOutlined, FileDoneOutlined, RocketOutlined } from '@ant-design/icons';

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
  },
  {
    label: 'Berita',
    key: '/berita',
    element: Landing.News
  }
];

/**
 * @type {{
 *  label: string;
 *  permissions: [Action, import('@/models/Model').ModelChildren][];
 *  roles: Role[];
 *  children: {
 *   path: string;
 *   label: string;
 *   icon: import('react').ReactNode;
 *   element: import('react').ReactNode;
 *   roles?: Role[];
 *   permissions?: [Action, import('@/models/Model').ModelChildren][];
 *  }[];
 * }[]}
 */
export const dashboardLink = [
  {
    label: 'Overview',
    icon: DashboardOutlined,
    children: [{ path: '/dashboard', label: 'Dashboard', element: Dashboard.Dashboard }]
  },
  {
    label: 'Data RTRW',
    icon: FileDoneOutlined,
    children: [
      { path: '/dashboard/periode', label: 'Periode', element: Dashboard.Periode, permissions: [[Action.READ, Model.Rtrws]] },

      { path: '/dashboard/rtrw', label: 'RTRW', element: Dashboard.Rtrws, permissions: [[Action.READ, Model.Rtrws]] }
    ]
  },
  {
    label: 'Master Data',
    icon: RocketOutlined,
    children: [
      { path: '/dashboard/klasifikasi', label: 'Klasifikasi', element: Dashboard.Klasifikasi, permissions: [[Action.READ, Model.Klasifikasis]] },
      { path: '/dashboard/polaruang', label: 'Polaruang', element: Dashboard.Polaruang, permissions: [[Action.READ, Model.Polaruangs]] },
      { path: '/dashboard/struktur_ruang', label: 'Struktur Ruang', element: Dashboard.StrukturRuang },
      { path: '/dashboard/ketentuan_khusus', label: 'Ketentuan Khusus', element: Dashboard.KetentuanKhusus },
      { path: '/dashboard/pkkprl', label: 'PKKPRL', element: Dashboard.Pkkprl },
      { path: '/dashboard/indikasi_program', label: 'Indikasi Program', element: Dashboard.IndikasiPrograms },
      { path: '/dashboard/batas_administrasi', label: 'Batas Administrasi', element: Dashboard.BatasAdministrasi },
      { path: '/dashboard/berita', label: 'Berita', element: Dashboard.News }
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
