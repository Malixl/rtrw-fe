import { DashboardFooter, DashboardSider } from '@/components';
import { useAuth } from '@/hooks';
import { LogoutOutlined, MenuOutlined, HomeOutlined } from '@ant-design/icons';
import { Avatar, Button, Dropdown, Layout, Result, Skeleton, Space, theme } from 'antd';
import { Content, Header } from 'antd/es/layout/layout';
import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { logout, token, user, isLoading, canAccessDashboard, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      navigate(`/auth/login?redirect=${pathname}`);
    }
  }, [navigate, token, pathname, isLoading]);

  // const breadcrumbItems = generateBreadcrumb(dashboardLink, pathname);

  const items = useMemo(
    () => [
      {
        key: '1',
        label: (
          <button onClick={() => navigate('/')} className="flex min-w-32 items-center gap-x-2">
            <HomeOutlined />
            Beranda
          </button>
        )
      },
      {
        key: '2',
        label: (
          <button onClick={logout} className="text-color-danger-500 flex min-w-32 items-center gap-x-2">
            <LogoutOutlined />
            Logout
          </button>
        )
      }
    ],
    [logout, navigate]
  );

  const {
    token: { colorBgContainer }
  } = theme.useToken();

  // Show loading skeleton while checking auth
  if (isLoading) {
    return (
      <Layout className="min-h-screen font-sans">
        <Skeleton active paragraph={{ rows: 10 }} className="p-8" />
      </Layout>
    );
  }

  // Check if user can access dashboard
  if (isAuthenticated && !canAccessDashboard()) {
    return (
      <Layout className="min-h-screen font-sans">
        <Result
          status="403"
          title="Akses Ditolak"
          subTitle="Anda tidak memiliki izin untuk mengakses dashboard"
          extra={
            <Button type="primary" onClick={() => navigate('/')}>
              Kembali ke Beranda
            </Button>
          }
        />
      </Layout>
    );
  }

  return (
    <Layout className="min-h-screen font-sans">
      <DashboardSider collapsed={collapsed} onCloseMenu={() => setCollapsed(true)} />
      <Layout>
        <Header
          style={{
            padding: 0,
            background: colorBgContainer
          }}
        >
          <div className="flex h-full w-full items-center justify-between px-4">
            <Button type="text" icon={<MenuOutlined />} onClick={() => setCollapsed(!collapsed)} color="default"></Button>
            <div className="flex items-center gap-x-2">
              {!user ? (
                <>
                  <Skeleton.Button active className="leading-4" size="small" />
                  <Skeleton.Avatar active className="leading-4" />
                </>
              ) : (
                <>
                  <span>Hai, {user.name}</span>

                  <Dropdown menu={{ items }}>
                    <a onClick={(e) => e.preventDefault()}>
                      <Space>
                        <Avatar className="bg-color-primary-100 text-color-primary-500 font-semibold">U</Avatar>
                      </Space>
                    </a>
                  </Dropdown>
                </>
              )}
            </div>
          </div>
        </Header>

        <Content style={{ margin: '24px 16px 0' }}>
          {/* <Breadcrumb
                        style={{ margin: '16px 0' }}
                        items={breadcrumbItems.map((item, index) => ({
                            title: index < breadcrumbItems.length - 1 ? <Link to={item.path}>{item.title}</Link> : item.title
                        }))}
                    /> */}

          <Outlet />
        </Content>

        <DashboardFooter />
      </Layout>
    </Layout>
  );
};

export default Dashboard;
