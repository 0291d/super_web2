import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { Boxes, ClipboardCheck, ClipboardList, History, LayoutDashboard, LogOut, PackageCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const warehouseLinks = [
  { to: '/warehouse/inventory', label: 'Inventory', icon: Boxes },
  { to: '/warehouse/receipts', label: 'Receipts', icon: ClipboardList },
  { to: '/warehouse/issues', label: 'Issues', icon: PackageCheck },
  { to: '/warehouse/counts', label: 'Counts', icon: ClipboardCheck },
  { to: '/warehouse/history', label: 'History', icon: History },
];

export function WarehouseLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F9F8F6] lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-[#EAE7E0] bg-white lg:sticky lg:top-[88px] lg:h-[calc(100vh-88px)] lg:border-b-0 lg:border-r">
        <div className="border-b border-[#EAE7E0] px-6 py-5">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-[#9E9B94]">
            <LayoutDashboard className="h-4 w-4" />
            Warehouse
          </div>
          <p className="mt-2 text-sm text-[#737373]">{user?.email}</p>
        </div>

        <nav className="flex gap-2 overflow-x-auto p-4 lg:flex-col lg:gap-1">
          {warehouseLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                    isActive ? 'bg-[#2D2D2D] text-white' : 'text-[#2D2D2D] hover:bg-[#F9F8F6]'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="hidden border-t border-[#EAE7E0] p-4 lg:block">
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-[#737373] hover:bg-[#F9F8F6] hover:text-[#2D2D2D]"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
