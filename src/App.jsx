import { Result, Skeleton } from 'antd';
import { authLink, dashboardLink, landingLink } from './data/link';
import { useAuth } from './hooks';
import { AuthLayout, DashboardLayout, LandingLayout } from './layouts';
import { createBrowserRouter } from 'react-router-dom';
import { RouterProvider } from 'react-router';
import './index.css';
import { flattenLandingLinks } from './utils/landingLink';
import { Notfound } from './pages/result';
import { CreateNews, EditNews, IndikasiPrograms, KetentuanKhusus, Pkkprl, Polaruang, StrukturRuang } from './pages/dashboard';
import { ReadNews } from './pages/landing';
import { ProtectedRoute } from './components';
// import { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';

function DashboardAuthGuard({ permissions, roles, capability, capabilities, requireAllCapabilities, children }) {
  const { isLoading, user, hasCapability } = useAuth();

  if (isLoading) {
    return <Skeleton active />;
  }

  // Use capability-based check first
  if (capability || (capabilities && capabilities.length > 0)) {
    const requiredCaps = capability ? [capability] : capabilities;
    const hasRequiredCap = requireAllCapabilities ? requiredCaps.every((cap) => hasCapability(cap)) : requiredCaps.some((cap) => hasCapability(cap));

    if (!hasRequiredCap) {
      return <Result status="403" subTitle="Anda tidak memiliki akses ke halaman ini" title="Forbidden" />;
    }
  }

  // Fallback to old permission/role system for backward compatibility
  const hasPermissions = permissions && permissions.length > 0;
  const hasRoles = roles && roles.length > 0;
  const userCantDoAnyOfThat = hasPermissions && (!user || user.cantDoAny(...permissions));
  const userIsNotInAnyOfThatRole = hasRoles && (!user || !roles.some((role) => user.is(role)));

  if (userCantDoAnyOfThat && userIsNotInAnyOfThatRole) {
    return <Result status="403" subTitle="Anda tidak memiliki akses ke halaman ini" title="Forbidden" />;
  }

  return children;
}

DashboardAuthGuard.propTypes = {
  permissions: PropTypes.array,
  roles: PropTypes.array,
  capability: PropTypes.string,
  capabilities: PropTypes.array,
  requireAllCapabilities: PropTypes.bool,
  children: PropTypes.node
};

function App() {
  const flatLandingLinks = flattenLandingLinks(landingLink);

  return (
    <RouterProvider
      router={createBrowserRouter([
        {
          element: <LandingLayout />,
          children: [
            // Tambahkan route dari landingLink
            ...flatLandingLinks.map(({ path, element: Element, capability }) => ({
              path,
              element: capability ? (
                <ProtectedRoute capability={capability} requireAuth={false}>
                  <Element />
                </ProtectedRoute>
              ) : (
                <Element />
              )
            })),

            { path: '*', element: <Notfound /> },
            { path: '/berita/:slug', element: <ReadNews /> }
          ]
        },
        {
          element: <DashboardLayout />,
          children: [
            ...dashboardLink.flatMap(({ children }) =>
              children.map(({ permissions, roles, capability, capabilities, requireAllCapabilities, path, element: Element }) => ({
                path,
                element: (
                  <DashboardAuthGuard permissions={permissions} roles={roles} capability={capability} capabilities={capabilities} requireAllCapabilities={requireAllCapabilities}>
                    <Element />
                  </DashboardAuthGuard>
                )
              }))
            ),
            // Dynamic routes with capability protection
            {
              path: '/dashboard/polaruang/:klasifikasi_id',
              element: (
                <ProtectedRoute capability="can_crud_map">
                  <Polaruang />
                </ProtectedRoute>
              )
            },
            {
              path: '/dashboard/struktur_ruang/:klasifikasi_id',
              element: (
                <ProtectedRoute capability="can_crud_map">
                  <StrukturRuang />
                </ProtectedRoute>
              )
            },
            {
              path: '/dashboard/ketentuan_khusus/:klasifikasi_id',
              element: (
                <ProtectedRoute capability="can_crud_map">
                  <KetentuanKhusus />
                </ProtectedRoute>
              )
            },
            {
              path: '/dashboard/pkkprl/:klasifikasi_id',
              element: (
                <ProtectedRoute capability="can_crud_map">
                  <Pkkprl />
                </ProtectedRoute>
              )
            },
            {
              path: '/dashboard/indikasi_program/:klasifikasi_id',
              element: (
                <ProtectedRoute capability="can_crud_map">
                  <IndikasiPrograms />
                </ProtectedRoute>
              )
            },
            {
              path: '/dashboard/berita/create',
              element: (
                <ProtectedRoute capability="can_crud_map">
                  <CreateNews />
                </ProtectedRoute>
              )
            },
            {
              path: '/dashboard/berita/edit/:slug',
              element: (
                <ProtectedRoute capability="can_crud_map">
                  <EditNews />
                </ProtectedRoute>
              )
            }
          ]
        },
        {
          element: <AuthLayout />,
          children: authLink.map(({ path, element: Element }) => ({
            path,
            element: <Element />
          }))
        }
      ])}
    />
  );
}

export default App;
