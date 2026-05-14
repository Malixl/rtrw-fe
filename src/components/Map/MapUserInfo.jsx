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
            navigate('/');
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
      data-html2canvas-ignore="true"
      className="hide-on-print"
      style={{
        position: 'fixed',
        bottom: isMobile ? 65 : 16,
        left: isMobile ? 'auto' : 16,
        right: isMobile ? 8 : 'auto',
        zIndex: 1300,
      }}
    >
      <Dropdown menu={{ items: dropdownItems }} placement={isMobile ? 'topRight' : 'topLeft'} trigger={['click']} overlayStyle={{ zIndex: 1400 }}>
        {isMobile ? (
          /* Mobile: compact single-line pill, same style as coordinate/scale bar */
          <div
            className="flex cursor-pointer items-center gap-1.5 rounded px-2.5 py-1.5 shadow-md"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(4px)',
              border: '1px solid #e5e7eb',
              fontSize: 12,
              fontFamily: 'sans-serif',
              lineHeight: 1,
            }}
          >
            <UserOutlined style={{ fontSize: 11, color: '#555' }} />
            <span className="font-medium text-gray-700" style={{ fontSize: 12 }}>{user.name}</span>
            <Tag color={getRoleColor()} className="m-0 leading-none" style={{ fontSize: 10, padding: '1px 5px', lineHeight: '16px' }}>
              {getRoleLabel()}
            </Tag>
          </div>
        ) : (
          /* Desktop: original card style */
          <div
            className="flex cursor-pointer items-center gap-2.5 rounded-lg bg-white px-3 py-2.5 shadow-md transition-shadow hover:shadow-lg"
            style={{ border: '1px solid #e5e7eb' }}
          >
            <Avatar size="default" icon={<UserOutlined />} className="bg-blue-500" />
            <div className="flex flex-col">
              <span className="text-sm font-medium leading-tight">{user.name}</span>
              <span className="text-xs text-gray-500">
                Login sebagai{' '}
                <Tag color={getRoleColor()} className="m-0 text-xs">
                  {getRoleLabel()}
                </Tag>
              </span>
            </div>
          </div>
        )}
      </Dropdown>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(node, document.body) : node;
};

export default MapUserInfo;
