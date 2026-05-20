import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { orderStatusBadge, poStatusBadge, fmtDate, fmtMoney, invBarColor } from '../lib/utils'
import { IconOrders, IconPO, IconInventory, IconAlert } from '../components/Icons'

export default function Dashboard({ setActive }) {
  const [orders, setOrders] = useState([])
  const [pos, setPos] = useState([])
  const [inventory, setInventory] = useState([])
  const [profiles, setProfiles] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: o }, { data: p }, { data: inv }, { data: pr }] = await Promise.all([
        supabase.from('orders').select('*').neq('status','Completed').order('due_date', { ascending: true }).limit(8),
        supabase.from('purchase_orders').select('*,vendors(name)').neq('status','Received').neq('status','Cancelled').order('created_at',{ascending:false}).limit(5),
        supabase.from('inventory').select('*').order('quantity_on_hand', { ascending: true }).limit(6),
        supabase.from('profiles').select('id,full_name'),
      ])
      setOrders(o || [])
      setPos(p || [])
      setInventory(inv || [])
      const pm = {}; (pr || []).forEach(x => pm[x.id] = x.full_name); setProfiles(pm)
      setLoading(false)
    }
    load()
  }, [])

  const openOrders = orders.filter(o => o.status !== 'Completed' && o.status !== 'On Hold').length
  const inProd = orders.filter(o => o.status === 'In Production').length
  const openPos = pos.length
  const lowStock = inventory.filter(i => i.quantity_on_hand <= i.reorder_point).length

  if (loading) return <div className="loading"><div className="spinner"/> Loading…</div>

  return (
    <div>
      <div className="page-header">
        <div><h1>Dashboard</h1><p>Welcome back — here's what's happening today.</p></div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card" style={{cursor:'pointer'}} onClick={()=>setActive('orders')}>
          <div className="metric-label">Open Orders</div>
          <div className="metric-value" style={{color:'var(--blue)'}}>{openOrders}</div>
          <div className="metric-sub" style={{color:'var(--text3)'}}>active in system</div>
        </div>
        <div className="metric-card" style={{cursor:'pointer'}} onClick={()=>setActive('orders')}>
          <div className="metric-label">In Production</div>
          <div className="metric-value" style={{color:'var(--green)'}}>{inProd}</div>
          <div className="metric-sub" style={{color:'var(--text3)'}}>on the floor</div>
        </div>
        <div className="metric-card" style={{cursor:'pointer'}} onClick={()=>setActive('purchase-orders')}>
          <div className="metric-label">Open POs</div>
          <div className="metric-value" style={{color:'var(--amber)'}}>{openPos}</div>
          <div className="metric-sub" style={{color:'var(--text3)'}}>awaiting receipt</div>
        </div>
        <div className="metric-card" style={{cursor:'pointer'}} onClick={()=>setActive('inventory')}>
          <div className="metric-label">Low Stock</div>
          <div className="metric-value" style={{color: lowStock > 0 ? 'var(--red)' : 'var(--green)'}}>{lowStock}</div>
          <div className="metric-sub" style={{color:'var(--text3)'}}>items need reorder</div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="card dash-full">
          <div className="card-header">
            <div className="card-title"><IconOrders/> Recent Orders</div>
            <button className="btn btn-sm" onClick={()=>setActive('orders')}>View all →</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Order #</th><th>Customer</th><th>Status</th><th>Due Date</th><th>Assigned To</th></tr></thead>
              <tbody>
                {orders.length === 0 && <tr><td colSpan={5} style={{textAlign:'center',color:'var(--text3)',padding:'32px'}}>No open orders</td></tr>}
                {orders.map(o => (
                  <tr key={o.id}>
                    <td><span style={{fontFamily:'var(--mono)',fontSize:'12px'}}>{o.order_number}</span></td>
                    <td style={{fontWeight:500}}>{o.customer}</td>
                    <td><span className={`badge ${orderStatusBadge(o.status)}`}>{o.status}</span></td>
                    <td>{fmtDate(o.due_date)}</td>
                    <td>{profiles[o.assigned_to] || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title"><IconPO/> Purchase Orders</div>
            <button className="btn btn-sm" onClick={()=>setActive('purchase-orders')}>View all →</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>PO #</th><th>Vendor</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {pos.length === 0 && <tr><td colSpan={4} style={{textAlign:'center',color:'var(--text3)',padding:'32px'}}>No open POs</td></tr>}
                {pos.map(p => (
                  <tr key={p.id}>
                    <td><span style={{fontFamily:'var(--mono)',fontSize:'12px'}}>{p.po_number}</span></td>
                    <td>{p.vendors?.name || '—'}</td>
                    <td>{fmtMoney(p.total_amount)}</td>
                    <td><span className={`badge ${poStatusBadge(p.status)}`}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title"><IconInventory/> Inventory Snapshot</div>
            <button className="btn btn-sm" onClick={()=>setActive('inventory')}>Full list →</button>
          </div>
          {inventory.map(item => {
            const pct = item.reorder_point > 0 ? Math.min(100, Math.max(5, (item.quantity_on_hand / (item.reorder_point * 3)) * 100)) : 60
            const low = item.quantity_on_hand <= item.reorder_point
            return (
              <div key={item.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 18px',borderBottom:'1px solid var(--border)'}}>
                <div>
                  <div style={{fontSize:'13px',fontWeight:500}}>{item.name}</div>
                  <div style={{fontSize:'11px',color:'var(--text3)'}}>{item.quantity_on_hand} {item.unit}</div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                  <div className="inv-bar-wrap"><div className="inv-bar" style={{width:`${pct}%`,background:invBarColor(item.quantity_on_hand,item.reorder_point)}}/></div>
                  {low && <IconAlert style={{width:14,height:14,color:'var(--amber)'}}/>}
                  <span style={{fontSize:'11px',color: low ? 'var(--amber)' : 'var(--green)',fontWeight:500}}>{low ? 'Low' : 'OK'}</span>
                </div>
              </div>
            )
          })}
          {inventory.length === 0 && <div style={{padding:'24px',textAlign:'center',color:'var(--text3)',fontSize:'13px'}}>No inventory items yet</div>}
        </div>
      </div>
    </div>
  )
}
