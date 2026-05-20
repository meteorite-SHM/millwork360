import { useAuth } from '../lib/AuthContext'
import { initials } from '../lib/utils'

function IconDashboard() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> }
function IconOrders() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="12" y2="16"/></svg> }
function IconCNC() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><path d="M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"/></svg> }
function IconPO() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> }
function IconVendors() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg> }
function IconInventory() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27,6.96 12,12.01 20.73,6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> }
function IconLogout() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> }

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: IconDashboard, section: 'Main' },
  { key: 'orders', label: 'Orders', icon: IconOrders, section: null },
  { key: 'cnc-schedule', label: 'CNC Schedule', icon: IconCNC, section: null },
  { key: 'purchase-orders', label: 'Purchase Orders', icon: IconPO, section: 'Procurement' },
  { key: 'vendors', label: 'Vendors', icon: IconVendors, section: null },
  { key: 'inventory', label: 'Inventory', icon: IconInventory, section: 'Warehouse' },
]

export default function Sidebar({ active, setActive }) {
  const { profile, signOut } = useAuth()
  let lastSection = null
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="brand">Millwork360</div>
        <div className="sub">Operations Portal</div>
      </div>
      <div style={{flex:1}}>
        {navItems.map(item => {
          const showSection = item.section && item.section !== lastSection
          if (item.section) lastSection = item.section
          return (
            <div key={item.key}>
              {showSection && <div className="nav-section">{item.section}</div>}
              <div className={`nav-item${active === item.key ? ' active' : ''}`} onClick={() => setActive(item.key)}>
                <item.icon />{item.label}
              </div>
            </div>
          )
        })}
      </div>
      <div style={{borderTop:'1px solid var(--border)',padding:'12px 18px',display:'flex',alignItems:'center',gap:'10px'}}>
        <div className="avatar">{initials(profile?.full_name)}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:'13px',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{profile?.full_name}</div>
          <div style={{fontSize:'11px',color:'var(--text3)',textTransform:'capitalize'}}>{profile?.role}</div>
        </div>
        <button onClick={signOut} style={{background:'none',border:'none',color:'var(--text3)',padding:'4px',display:'flex'}} title="Sign out"><IconLogout/></button>
      </div>
    </div>
  )
}