import { IconDashboard, IconOrders, IconPO, IconVendors, IconInventory, IconLogout } from './Icons'
import { useAuth } from '../lib/AuthContext'
import { initials } from '../lib/utils'

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: IconDashboard, section: 'Main' },
  { key: 'orders', label: 'Orders', icon: IconOrders, section: null },
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
              <div
                className={`nav-item${active === item.key ? ' active' : ''}`}
                onClick={() => setActive(item.key)}
              >
                <item.icon />
                {item.label}
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
        <button onClick={signOut} style={{background:'none',border:'none',color:'var(--text3)',padding:'4px',display:'flex'}} title="Sign out">
          <IconLogout />
        </button>
      </div>
    </div>
  )
}
