import { landingLink } from '@/data/link';
import { findItemByKey } from '@/utils/landingLink';
import { MenuOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { Button, Drawer, Grid, Image, Menu, Skeleton } from 'antd';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks';

const Navbar = () => {
  const navigate = useNavigate();
  const breakpoints = Grid.useBreakpoint();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { logout, isAuthenticated, hasCapability } = useAuth();

  const openDrawer = () => {
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  // Filter landing links based on capabilities
  const filteredLandingLinks = useMemo(() => {
    return landingLink.filter((item) => {
      // If no capability required, show the item
      if (!item.capability) return true;
      // Check if user has the capability
      return hasCapability(item.capability);
    });
  }, [hasCapability]);

  const handleMenuClick = (e) => {
    const clickedItem = findItemByKey(landingLink, e.key);
    if (clickedItem) {
      // Check capability before navigating
      if (clickedItem.capability && !hasCapability(clickedItem.capability)) {
        // If user doesn't have capability, redirect to login with message
        navigate('/auth/login?redirect=' + encodeURIComponent(clickedItem.key));
        return;
      }
      navigate(clickedItem.key);
    }
  };

  const loadingData = false;

  const isDesktop = breakpoints.lg || breakpoints.xl || breakpoints.xxl;

  // Handle logout and redirect to home
  const handleLogout = () => {
    logout();
    navigate('/');
  };

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
            <Menu style={{ minWidth: 0, flex: 'auto', border: 'none' }} mode="horizontal" items={filteredLandingLinks} activeKey="" onClick={handleMenuClick} />
          </>
        ) : (
          <>
            <Button icon={<MenuOutlined />} onClick={openDrawer} />
            <Drawer open={isDrawerOpen} onClose={closeDrawer} placement="left" width={300}>
              <Menu items={filteredLandingLinks} mode="inline" onClick={handleMenuClick} />
            </Drawer>
          </>
        )}
      </div>
      <div className="flex items-center justify-end gap-x-4">
        {!isAuthenticated ? (
          <Button variant="solid" color="primary" icon={<UserOutlined />} onClick={() => navigate('/auth/login')}>
            Masuk
          </Button>
        ) : (
          <Button variant="solid" color="default" danger icon={<LogoutOutlined />} onClick={handleLogout}>
            Keluar
          </Button>
        )}
      </div>
    </div>
  );
};

export default Navbar;
