import { useAuth } from '@/hooks';
import Role from '@/constants/Role';
import { DashboardOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Dropdown, Tag } from 'antd';
import { useMemo, useEffect, useState, useRef, useCallback } from 'react';
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

  // No longer needed: handleMenuClick

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

  const [offsetLeft, setOffsetLeft] = useState(0);
  const [offsetBottom, setOffsetBottom] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const wrapperRef = useRef(null);

  // Handle window resize for responsive
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const rectsIntersect = (r1, r2) => !(r2.left > r1.right || r2.right < r1.left || r2.top > r1.bottom || r2.bottom < r1.top);

  const reposition = useCallback(() => {
    const wr = wrapperRef.current;
    if (!wr) return;

    // Reset prior offsets
    setOffsetLeft(0);
    setOffsetBottom(0);

    const wRect = wr.getBoundingClientRect();
    let shiftX = 0;
    let shiftY = 0;

    const selectors = ['.coordinate-scale-wrapper', '.leaflet-top.leaflet-left', '.leaflet-bottom.leaflet-left', '.map-tools-control', '.leaflet-control'];
    selectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        const r = el.getBoundingClientRect();
        if (rectsIntersect(wRect, r)) {
          const neededRight = Math.max(0, r.right - wRect.left + 8);
          shiftX = Math.max(shiftX, neededRight);
          const neededUp = Math.max(0, r.height + 8);
          shiftY = Math.max(shiftY, neededUp);
        }
      });
    });

    const viewportWidth = window.innerWidth;
    const newLeft = 16 + shiftX;

    if (newLeft + wRect.width > viewportWidth - 16) {
      setOffsetLeft(0);
      setOffsetBottom(16 + shiftY);
    } else {
      setOffsetLeft(shiftX);
      setOffsetBottom(0);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(reposition, 120);
    return () => clearTimeout(t);
  }, [reposition]);

  useEffect(() => {
    const onResize = () => reposition();
    const onFs = () => reposition();
    window.addEventListener('resize', onResize);
    document.addEventListener('fullscreenchange', onFs);
    document.addEventListener('webkitfullscreenchange', onFs);
    document.addEventListener('mozfullscreenchange', onFs);
    document.addEventListener('MSFullscreenChange', onFs);

    const mo = new MutationObserver(() => reposition());
    const mapContainer = document.querySelector('.leaflet-container');
    if (mapContainer) mo.observe(mapContainer, { attributes: true, childList: true, subtree: true });

    // run once
    reposition();

    return () => {
      window.removeEventListener('resize', onResize);
      document.removeEventListener('fullscreenchange', onFs);
      document.removeEventListener('webkitfullscreenchange', onFs);
      document.removeEventListener('mozfullscreenchange', onFs);
      document.removeEventListener('MSFullscreenChange', onFs);
      mo.disconnect();
    };
  }, [reposition]);

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }
  const wrapperClass = `flex cursor-pointer items-center rounded-lg bg-gray-50 shadow-sm transition-shadow hover:shadow-md ${isMobile ? 'gap-1 px-2 py-1.5' : 'gap-2 px-3 py-2'}`;

  const containerStyle = {
    position: 'fixed',
    bottom: isMobile ? 12 : 16,
    left: isMobile ? 12 : 16,
    zIndex: 1200,
    transition: 'all 220ms ease'
  };

  const node = (
    <div style={{ ...containerStyle, left: `${(isMobile ? 12 : 16) + offsetLeft}px`, bottom: `${(isMobile ? 12 : 16) + offsetBottom}px` }}>
      <Dropdown menu={{ items: dropdownItems }} placement={'topLeft'} trigger={['click']}>
        <div ref={wrapperRef} className={wrapperClass}>
          <Avatar size={isMobile ? 'small' : 'default'} icon={<UserOutlined />} className="bg-blue-500" />
          <div className="flex flex-col">
            <span className={`font-medium leading-tight ${isMobile ? 'text-xs' : 'text-sm'}`}>{user.name}</span>
            <span className={`text-gray-500 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
              Login sebagai{' '}
              <Tag color={getRoleColor()} className={`m-0 ${isMobile ? 'px-1 text-[10px]' : 'text-xs'}`}>
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
