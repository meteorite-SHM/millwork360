import { useState } from 'react'
import { AuthProvider, useAuth } from './lib/AuthContext'
import { ToastProvider } from './lib/ToastContext'
import AuthPage from './pages/AuthPage'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import OrdersPage from './pages/OrdersPage'
import PurchaseOrdersPage from './pages/PurchaseOrdersPage'
import VendorsPage from './pages/VendorsPage'
import InventoryPage from './pages/InventoryPage'
import CNCSchedulePage from './pages/CNCSchedulePage'
import CNCScheduleKerryPage from './pages/CNCScheduleKerryPage'

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  orders: 'Orders',
  'cnc-schedule': 'CNC Schedule (Josh)',
  'cnc-schedule-kerry': 'CNC Schedule (Kerry)',
  'purchase-orders': 'Purchase Orders',
  vendors: 'Vendors',
  inventory: 'Inventory',
}

function Shell() {
  const { user, loading } = useAuth()
  const [active, setActive] = useState('dashboard')
  if (loading) return <div className="loading" style={{minHeight:'100vh'}}><div className="spinner"/> Loading…</div>
  if (!user) return <AuthPage/>
  const pages = {
    dashboard: <Dashboard setActive={setActive}/>,
    orders: <OrdersPage/>,
    'cnc-schedule': <CNCSchedulePage/>,
    'cnc-schedule-kerry': <CNCScheduleKerryPage/>,
    'purchase-orders': <PurchaseOrdersPage/>,
    vendors: <VendorsPage/>,
    inventory: <InventoryPage/>,
  }
  return (
    <div className="app-shell">
      <Sidebar active={active} setActive={setActive}/>
      <div className="main-area">
        <div className="topbar">
          <div className="topbar-left"><span className="topbar-title">{PAGE_TITLES[active]}</span></div>
          <div className="topbar-right"><span style={{fontSize:'12px',color:'var(--text3)'}}>{new Date().toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</span></div>
        </div>
        <div className="page-content">{pages[active] || <Dashboard setActive={setActive}/>}</div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider><ToastProvider><Shell/></ToastProvider></AuthProvider>
  )
}