import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useToast } from '../lib/ToastContext'
import { ORDER_STATUSES, orderStatusBadge, fmtDate } from '../lib/utils'
import { IconPlus, IconSearch, IconX, IconEdit, IconTrash } from '../components/Icons'

function OrderModal({ order, profiles, onClose, onSaved }) {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [form, setForm] = useState(order || { order_number:'', customer:'', description:'', status:'Takeoff', due_date:'', assigned_to:'', notes:'' })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({...f, [k]: v}))
  async function save() {
    if (!form.order_number || !form.customer) return addToast('Order # and Customer are required', 'error')
    setSaving(true)
    const payload = { ...form, assigned_to: form.assigned_to || null, due_date: form.due_date || null }
    if (order) {
      const { error } = await supabase.from('orders').update(payload).eq('id', order.id)
      if (error) addToast(error.message, 'error')
      else { addToast('Order updated', 'success'); onSaved() }
    } else {
      const { error } = await supabase.from('orders').insert({ ...payload, created_by: user.id })
      if (error) addToast(error.message, 'error')
      else { addToast('Order created', 'success'); onSaved() }
    }
    setSaving(false)
  }
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{order ? 'Edit Order' : 'New Order'}</h3>
          <button className="btn btn-sm" onClick={onClose}><IconX/></button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group"><label>Order Number *</label><input type="text" value={form.order_number} onChange={e=>set('order_number',e.target.value)} placeholder="M-1050"/></div>
            <div className="form-group"><label>Customer *</label><input type="text" value={form.customer} onChange={e=>set('customer',e.target.value)} placeholder="Customer name"/></div>
            <div className="form-group full"><label>Description</label><input type="text" value={form.description} onChange={e=>set('description',e.target.value)} placeholder="e.g. 6 ext doors, reeded glass sidelites"/></div>
            <div className="form-group"><label>Status</label><select value={form.status} onChange={e=>set('status',e.target.value)}>{ORDER_STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
            <div className="form-group"><label>Due Date</label><input type="date" value={form.due_date} onChange={e=>set('due_date',e.target.value)}/></div>
            <div className="form-group"><label>Assigned To</label><select value={form.assigned_to} onChange={e=>set('assigned_to',e.target.value)}><option value="">Unassigned</option>{profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}</select></div>
            <div className="form-group full"><label>Notes</label><textarea value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="Any additional notes…"/></div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Order'}</button>
        </div>
      </div>
    </div>
  )
}

export default function OrdersPage() {
  const { addToast } = useToast()
  const [orders, setOrders] = useState([])
  const [profiles, setProfiles] = useState([])
  const [profileMap, setProfileMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [modal, setModal] = useState(null)
  async function load() {
    const [{ data: o }, { data: p }] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id,full_name'),
    ])
    setOrders(o || [])
    setProfiles(p || [])
    const pm = {}; (p || []).forEach(x => pm[x.id] = x.full_name); setProfileMap(pm)
    setLoading(false)
  }
  useEffect(() => { load() }, [])
  async function deleteOrder(id) {
    if (!window.confirm('Delete this order?')) return
    const { error } = await supabase.from('orders').delete().eq('id', id)
    if (error) addToast(error.message, 'error')
    else { addToast('Order deleted', 'success'); load() }
  }
  const filtered = orders.filter(o => {
    const matchSearch = !search || o.order_number.toLowerCase().includes(search.toLowerCase()) || o.customer.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || o.status === statusFilter
    return matchSearch && matchStatus
  })
  if (loading) return <div className="loading"><div className="spinner"/> Loading…</div>
  return (
    <div>
      <div className="page-header">
        <div><h1>Orders</h1><p>{orders.length} total orders</p></div>
        <button className="btn btn-primary" onClick={() => setModal('new')}><IconPlus/> New Order</button>
      </div>
      <div style={{display:'flex',gap:'10px',marginBottom:'16px',flexWrap:'wrap',alignItems:'center'}}>
        <div className="search-bar" style={{flex:1,maxWidth:320}}><IconSearch/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search order # or customer…"/></div>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{width:'auto',padding:'7px 12px'}}><option value="All">All Statuses</option>{ORDER_STATUSES.map(s => <option key={s}>{s}</option>)}</select>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Order #</th><th>Customer</th><th>Description</th><th>Status</th><th>Due Date</th><th>Assigned</th><th></th></tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={7} style={{textAlign:'center',color:'var(--text3)',padding:'40px'}}>No orders found</td></tr>}
              {filtered.map(o => (
                <tr key={o.id}>
                  <td><span style={{fontFamily:'var(--mono)',fontSize:'12px',fontWeight:500}}>{o.order_number}</span></td>
                  <td style={{fontWeight:500}}>{o.customer}</td>
                  <td style={{color:'var(--text2)',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{o.description || '—'}</td>
                  <td><span className={`badge ${orderStatusBadge(o.status)}`}>{o.status}</span></td>
                  <td>{fmtDate(o.due_date)}</td>
                  <td>{profileMap[o.assigned_to] || '—'}</td>
                  <td><div style={{display:'flex',gap:'4px'}}><button className="btn btn-sm" onClick={()=>setModal(o)}><IconEdit/></button><button className="btn btn-sm btn-danger" onClick={()=>deleteOrder(o.id)}><IconTrash/></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {modal && <OrderModal order={modal === 'new' ? null : modal} profiles={profiles} onClose={() => setModal(null)} onSaved={() => { setModal(null); load() }}/>}
    </div>
  )
}
