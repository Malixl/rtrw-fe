import { useAuth } from '@/hooks';
import Role from '@/constants/Role';
import { DashboardOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Dropdown, Tag } from 'antd';
import { useMemo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

/**
 * MapUserInfo - Displays user info and actions in the map view
 * Shows different options based on user role:
 * - Admin: Dropdown with Dashboard & Logout
 * - OPD: Dropdown with Logout only
 */
const MapUserInfo = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === Role.ADMIN;
  const isOPD = user?.role === Role.OPD;

  // Build dropdown menu items based on role, using <a> for right-click support
  const dropdownItems = useMemo(() => {
    const items = [];

    // Dashboard link only for Admin
    if (isAdmin) {
      items.push({
        key: 'dashboard',
        label: (
          <a
            href="/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.preventDefault();
              navigate('/dashboard');
            }}
            style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <DashboardOutlined /> Dashboard
          </a>
        )
      });
    }

    // Logout for all authenticated users
    items.push({
      key: 'logout',
      label: (
        <a
          href="#logout"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.preventDefault();
            logout();
          }}
          style={{ color: 'red', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <LogoutOutlined /> Keluar
        </a>
      ),
      danger: true
    });

    return items;
  }, [isAdmin, navigate, logout]);

  // Get role label for display
  const getRoleLabel = () => {
    if (isAdmin) return 'Admin';
    if (isOPD) return 'OPD';
    return 'User';
  };

  // Get role color for tag
  const getRoleColor = () => {
    if (isAdmin) return 'red';
    if (isOPD) return 'blue';
    return 'default';
  };

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize for responsive
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  const node = (
    <div
      style={{
        position: 'fixed',
        bottom: isMobile ? 8 : 16,
        left: isMobile ? 8 : 16,
        zIndex: 1200,
      }}
    >
      <Dropdown menu={{ items: dropdownItems }} placement={'topLeft'} trigger={['click']}>
        <div
          className={`flex cursor-pointer items-center rounded-lg bg-white shadow-md transition-shadow hover:shadow-lg ${
            isMobile ? 'gap-2 px-2.5 py-2' : 'gap-2.5 px-3 py-2.5'
          }`}
          style={{ border: '1px solid #e5e7eb' }}
        >
          <Avatar size={isMobile ? 'small' : 'default'} icon={<UserOutlined />} className="bg-blue-500" />
          <div className="flex flex-col">
            <span className={`font-medium leading-tight ${isMobile ? 'text-xs' : 'text-sm'}`}>{user.name}</span>
            <span className={`text-gray-500 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
              Login sebagai{' '}
              <Tag color={getRoleColor()} className={`m-0 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
                {getRoleLabel()}
              </Tag>
            </span>
          </div>
        </div>
      </Dropdown>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(node, document.body) : node;
};

export default MapUserInfo;
