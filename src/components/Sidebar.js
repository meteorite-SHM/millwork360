import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { initials } from '../lib/utils'

function IconDashboard() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> }
function IconOrders() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="12" y2="16"/></svg> }
function IconCNC() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><path d="M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"/></svg> }
function IconPO() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> }
function IconVendors() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg> }
function IconInventory() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27,6.96 12,12.01 20.73,6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> }
function IconLogout() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> }
function IconMenu() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg> }
function IconX() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> }

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: IconDashboard, section: 'Main' },
  { key: 'orders', label: 'Orders', icon: IconOrders, section: null },
  { key: 'cnc-schedule', label: 'CNC Schedule (Josh)', icon: IconCNC, section: 'CNC' },
  { key: 'cnc-schedule-kerry', label: 'CNC Schedule (Kerry)', icon: IconCNC, section: null },
  { key: 'purchase-orders', label: 'Purchase Orders', icon: IconPO, section: 'Procurement' },
  { key: 'vendors', label: 'Vendors', icon: IconVendors, section: null },
  { key: 'inventory', label: 'Inventory', icon: IconInventory, section: 'Warehouse' },
]

const styles = `
  .sidebar-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.4);
    z-index: 49;
  }
  .sidebar-overlay.open {
    display: block;
  }
  /* Desktop: collapsed by default, expand on hover */
  @media (min-width: 769px) {
    .sidebar-drawer {
      position: relative;
      width: 56px;
      min-width: 56px;
      transition: width 0.22s ease;
      overflow: hidden;
      z-index: 50;
      background: var(--surface);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      height: 100vh;
      flex-shrink: 0;
    }
    .sidebar-drawer:hover, .sidebar-drawer.open {
      width: 220px;
    }
    .sidebar-drawer .sidebar-label {
      opacity: 0;
      transition: opacity 0.15s ease;
      white-space: nowrap;
      overflow: hidden;
    }
    .sidebar-drawer:hover .sidebar-label,
    .sidebar-drawer.open .sidebar-label {
      opacity: 1;
    }
    .sidebar-drawer .sidebar-logo-full {
      opacity: 0;
      transition: opacity 0.15s ease;
      white-space: nowrap;
    }
    .sidebar-drawer:hover .sidebar-logo-full,
    .sidebar-drawer.open .sidebar-logo-full {
      opacity: 1;
    }
    .sidebar-drawer .nav-section {
      opacity: 0;
      transition: opacity 0.15s ease;
      white-space: nowrap;
    }
    .sidebar-drawer:hover .nav-section,
    .sidebar-drawer.open .nav-section {
      opacity: 1;
    }
    .sidebar-mobile-toggle { display: none !important; }
    .sidebar-overlay { display: none !important; }
  }
  /* Mobile/tablet: hidden off-screen, toggle with button */
  @media (max-width: 768px) {
    .sidebar-drawer {
      position: fixed;
      top: 0;
      left: 0;
      width: 240px;
      height: 100vh;
      transform: translateX(-100%);
      transition: transform 0.25s ease;
      z-index: 50;
      background: var(--surface);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }
    .sidebar-drawer.open {
      transform: translateX(0);
    }
    .sidebar-drawer .sidebar-label { white-space: nowrap; }
    .sidebar-mobile-toggle {
      display: flex !important;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: var(--radius);
      border: 1px solid var(--border2);
      background: var(--surface);
      cursor: pointer;
      color: var(--text);
    }
    .sidebar-mobile-toggle svg { width: 18px; height: 18px; }
  }
  .sidebar-nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    font-size: 13.5px;
    color: var(--text2);
    cursor: pointer;
    border-left: 2px solid transparent;
    transition: all 0.12s;
    user-select: none;
    min-height: 40px;
  }
  .sidebar-nav-item:hover { background: var(--surface2); color: var(--text); }
  .sidebar-nav-item.active { background: var(--blue-light); color: var(--blue); border-left-color: var(--blue); font-weight: 500; }
  .sidebar-nav-item svg { width: 18px; height: 18px; flex-shrink: 0; }
  .sidebar-icon-only { padding: 10px; justify-content: center; }
`

export default function Sidebar({ active, setActive }) {
  const { profile, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  let lastSection = null

  function handleNav(key) {
    setActive(key)
    setMobileOpen(false)
  }

  return (
    <>
      <style>{styles}</style>

      {/* Mobile overlay */}
      <div className={`sidebar-overlay${mobileOpen ? ' open' : ''}`} onClick={function(){ setMobileOpen(false) }}/>

      {/* Mobile toggle button — shown in topbar area */}
      <button className="sidebar-mobile-toggle" onClick={function(){ setMobileOpen(!mobileOpen) }} style={{position:'fixed',top:10,left:10,zIndex:60}}>
        {mobileOpen ? <IconX/> : <IconMenu/>}
      </button>

      <div className={`sidebar-drawer${mobileOpen ? ' open' : ''}`}>
        {/* Logo */}
        <div style={{padding:'16px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:10,minHeight:56}}>
          <div style={{width:24,height:24,background:'var(--blue)',borderRadius:6,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:12,fontWeight:700}}>M</div>
          <div className="sidebar-logo-full">
            <div style={{fontSize:'14px',fontWeight:600,color:'var(--text)'}}>Millwork360</div>
            <div style={{fontSize:'10px',color:'var(--text3)'}}>Operations Portal</div>
          </div>
        </div>

        {/* Nav items */}
        <div style={{flex:1,overflowY:'auto',paddingTop:8}}>
          {navItems.map(function(item){
            const showSection = item.section && item.section !== lastSection
            if (item.section) lastSection = item.section
            return (
              <div key={item.key}>
                {showSection && (
                  <div className="nav-section sidebar-label" style={{padding:'12px 16px 4px',fontSize:'10px',fontWeight:600,color:'var(--text3)',letterSpacing:'0.1em',textTransform:'uppercase'}}>
                    {item.section}
                  </div>
                )}
                <div
                  className={`sidebar-nav-item${active === item.key ? ' active' : ''}`}
                  onClick={function(){ handleNav(item.key) }}
                  title={item.label}
                >
                  <item.icon/>
                  <span className="sidebar-label">{item.label}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* User footer */}
        <div style={{borderTop:'1px solid var(--border)',padding:'12px 16px',display:'flex',alignItems:'center',gap:10}}>
          <div className="avatar" style={{flexShrink:0}}>{initials(profile?.full_name)}</div>
          <div className="sidebar-logo-full" style={{flex:1,minWidth:0}}>
            <div style={{fontSize:'13px',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{profile?.full_name}</div>
            <div style={{fontSize:'11px',color:'var(--text3)',textTransform:'capitalize'}}>{profile?.role}</div>
          </div>
          <button onClick={signOut} style={{background:'none',border:'none',color:'var(--text3)',padding:'4px',display:'flex',flexShrink:0}} title="Sign out"><IconLogout/></button>
        </div>
      </div>
    </>
  )
}