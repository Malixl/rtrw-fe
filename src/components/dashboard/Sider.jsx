import { dashboardLink } from '@/data/link';
import { useAuth } from '@/hooks';
import { Drawer, Grid, Image, Menu, Tooltip } from 'antd';
import Sider from 'antd/es/layout/Sider';
import PropTypes from 'prop-types';
import { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const DashboardSider = ({ collapsed, onCloseMenu }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const breakpoints = Grid.useBreakpoint();
  const { hasCapability, user } = useAuth();

  const isDesktop = breakpoints.lg || breakpoints.xl || breakpoints.xxl;

  // Filter menu items based on user capabilities
  const menuItems = useMemo(() => {
    return dashboardLink
      .map(({ label, children, icon: Icon }) => {
        // Filter children based on capabilities
        const filteredChildren = children.filter((child) => {
          // If no capability required, show the item
          if (!child.capability && (!child.capabilities || child.capabilities.length === 0)) {
            return true;
          }

          // Check single capability
          if (child.capability) {
            return hasCapability(child.capability);
          }

          // Check multiple capabilities
          if (child.capabilities && child.capabilities.length > 0) {
            if (child.requireAllCapabilities) {
              return child.capabilities.every((cap) => hasCapability(cap));
            }
            return child.capabilities.some((cap) => hasCapability(cap));
          }

          // Also check old permission system for backward compatibility
          if (child.permissions && child.permissions.length > 0 && user) {
            return !user.cantDoAny(...child.permissions);
          }

          return true;
        });

        // Don't show parent if no children are accessible
        if (filteredChildren.length === 0) {
          return null;
        }

        return {
          key: label,
          label: (
            <Tooltip title={label} placement="right" color="blue">
              <span>{label}</span>
            </Tooltip>
          ),
          icon: (
            <Tooltip title={label} placement="right" color="blue">
              <Icon />
            </Tooltip>
          ),
          children: filteredChildren.map(({ path, label }) => ({
            key: path,
            label: (
              <Tooltip title={label} placement="right" color="blue">
                <span>{label}</span>
              </Tooltip>
            ),
            onClick: () => navigate(path)
          }))
        };
      })
      .filter(Boolean); // Remove null items
  }, [hasCapability, user, navigate]);

  return isDesktop ? (
    <Sider theme="light" className="p-4" width={230} collapsed={collapsed}>
      <Link to="/">
        <div className="mb-4 flex w-full items-center justify-center">
          <Image width={40} preview={false} src={''} />
        </div>
      </Link>
      <Menu className="w-full !border-none font-semibold" theme="light" mode="inline" defaultSelectedKeys={[pathname]} items={menuItems} />
    </Sider>
  ) : (
    <Drawer
      styles={{ body: { padding: 10 } }}
      placement="left"
      width={250}
      open={!collapsed}
      onClose={onCloseMenu}
      title={
        <Link to="/">
          <div className="flex w-full items-center justify-center">
            <Image width={40} preview={false} src={''} />
          </div>
        </Link>
      }
    >
      <Menu className="w-full !border-none font-semibold" theme="light" mode="inline" defaultSelectedKeys={[pathname]} items={menuItems} />
    </Drawer>
  );
};

export default DashboardSider;

DashboardSider.propTypes = {
  collapsed: PropTypes.bool.isRequired,
  onCloseMenu: PropTypes.func.isRequired
};
