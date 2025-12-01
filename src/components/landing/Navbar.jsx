import { landingLink } from '@/data/link';
import { findItemByKey } from '@/utils/landingLink';
import { MenuOutlined, UserOutlined, DashboardOutlined, LogoutOutlined } from '@ant-design/icons';
import { Button, Drawer, Dropdown, Grid, Image, Menu, Skeleton } from 'antd';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks';

const Navbar = () => {
  const navigate = useNavigate();
  const breakpoints = Grid.useBreakpoint();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { user, logout, isAdmin, isGuest } = useAuth();

  const openDrawer = () => {
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  const handleMenuClick = (e) => {
    const clickedItem = findItemByKey(landingLink, e.key);
    if (clickedItem) {
      navigate(clickedItem.key);
    }
  };

  const loadingData = false;

  const isDesktop = breakpoints.lg || breakpoints.xl || breakpoints.xxl;

  return (
    <div className="mx-auto flex w-full max-w-screen-xl items-center justify-between gap-x-4 p-4">
      <div className="flex w-fit items-center gap-x-4 lg:w-full">
        {isDesktop ? (
          <>
            {loadingData ? (
              <div className="inline-flex items-center gap-x-2">
                <Skeleton.Button size="large" active />
                <Skeleton.Input size="small" active />
              </div>
            ) : (
              <>
                <Image width={40} preview={false} src={''} />
                <b>
                  <span className="text-blue-500">App Name</span>{' '}
                </b>
              </>
            )}
            <Menu style={{ minWidth: 0, flex: 'auto', border: 'none' }} mode="horizontal" items={landingLink} activeKey="" onClick={handleMenuClick} />
          </>
        ) : (
          <>
            <Button icon={<MenuOutlined />} onClick={openDrawer} />
            <Drawer open={isDrawerOpen} onClose={closeDrawer} placement="left" width={300}>
              <Menu items={landingLink} mode="inline" onClick={handleMenuClick} />
            </Drawer>
          </>
        )}
      </div>
      <div className="flex items-center justify-end gap-x-4">
        {isGuest() ? (
          <Button variant="solid" color="primary" icon={<UserOutlined />} onClick={() => navigate('/auth/login')}>
            Masuk
          </Button>
        ) : (
          <Dropdown
            menu={{
              items: [
                // Dashboard link hanya untuk Admin
                ...(isAdmin()
                  ? [
                      {
                        key: 'dashboard',
                        label: 'Dashboard',
                        icon: <DashboardOutlined />,
                        onClick: () => navigate('/dashboard')
                      }
                    ]
                  : []),
                {
                  key: 'logout',
                  label: 'Keluar',
                  icon: <LogoutOutlined />,
                  onClick: logout,
                  danger: true
                }
              ]
            }}
            placement="bottomRight"
          >
            <Button icon={<UserOutlined />}>{user?.name || 'User'}</Button>
          </Dropdown>
        )}
      </div>
    </div>
  );
};

Navbar.propTypes = {
  villageProfile: PropTypes.object
};

export default Navbar;
