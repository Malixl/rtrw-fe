import { useAuth } from '@/hooks';
import Role from '@/constants/Role';
import { DashboardOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Dropdown, Tag } from 'antd';
import { useMemo } from 'react';
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

  // Build dropdown menu items based on role
  const dropdownItems = useMemo(() => {
    const items = [];

    // Dashboard link only for Admin
    if (isAdmin) {
      items.push({
        key: 'dashboard',
        label: 'Dashboard',
        icon: <DashboardOutlined />
      });
    }

    // Logout for all authenticated users
    items.push({
      key: 'logout',
      label: 'Keluar',
      icon: <LogoutOutlined />,
      danger: true
    });

    return items;
  }, [isAdmin]);

  const handleMenuClick = ({ key }) => {
    if (key === 'dashboard') {
      navigate('/dashboard');
    } else if (key === 'logout') {
      logout();
    }
  };

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

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div>
      <Dropdown
        menu={{
          items: dropdownItems,
          onClick: handleMenuClick
        }}
        placement="bottomRight"
        trigger={['click']}
      >
        <div className="flex cursor-pointer items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 shadow-sm transition-shadow hover:shadow-md">
          <Avatar size="small" icon={<UserOutlined />} className="bg-blue-500" />
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
      </Dropdown>
    </div>
  );
};

export default MapUserInfo;
