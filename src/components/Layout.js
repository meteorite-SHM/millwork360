import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../App';

const Icons = {
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  orders:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>,
  po:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>,
  inventory: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>,
  vendors:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  signout:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>,
};

function initials(name) {
  if (!name) return '??';
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function Layout() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const isOffice = profile?.role === 'office';

  async function signOut() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <nav className="sidebar">
        <div className="sidebar-logo">
          <div className="name">Millwork360</div>
          <div className="sub">Operations Portal</div>
        </div>

        <div className="nav-group">
          <div className="nav-group-label">Main</div>
          <NavLink to="/" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            {Icons.dashboard} Dashboard
          </NavLink>
          <NavLink to="/orders" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            {Icons.orders} Orders
          </NavLink>
          {isOffice && (
            <NavLink to="/purchase-orders" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              {Icons.po} Purchase Orders
            </NavLink>
          )}
          <NavLink to="/inventory" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            {Icons.inventory} Inventory
          </NavLink>
        </div>

        {isOffice && (
          <div className="nav-group">
            <div className="nav-group-label">Manage</div>
            <NavLink to="/vendors" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              {Icons.vendors} Vendors
            </NavLink>
          </div>
        )}

        <div className="sidebar-footer">
          <div className="avatar-sm">{initials(profile?.full_name)}</div>
          <div>
            <div className="sidebar-user-name">{profile?.full_name || 'User'}</div>
            <div className="sidebar-user-role">{profile?.role?.replace('_', ' ') || ''}</div>
          </div>
          <button className="btn-signout" onClick={signOut} title="Sign out">{Icons.signout}</button>
        </div>
      </nav>

      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}
