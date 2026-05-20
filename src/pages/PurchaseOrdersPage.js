import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useToast } from '../lib/ToastContext'
import { PO_STATUSES, poStatusBadge, fmtDate, fmtMoney } from '../lib/utils'
import { IconPlus, IconX, IconEdit, IconTrash, IconSearch } from '../components/Icons'

function POModal({ po, vendors, onClose, onSaved }) {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [form, setForm] = useState(po || { po_number:'', vendor_id:'', status:'Draft', order_date: new Date().toISOString().split('T')[0], expected_date:'', notes:'' })
  const [items, setItems] = useState([])
  const [saving, setSaving] = useState(false)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  useEffect(()=>{
    if (po) {
      supabase.from('po_items').select('*').eq('po_id',po.id).then(({data})=>setItems(data||[]))
    } else {
      setItems([{ id: Date.now(), description:'', quantity:1, unit:'ea', unit_price:0, received_qty:0 }])
    }
  },[po])

  const addItem = () => setItems(i=>[...i,{id:Date.now(),description:'',quantity:1,unit:'ea',unit_price:0,received_qty:0}])
  const setItem = (id,k,v) => setItems(i=>i.map(x=>x.id===id?{...x,[k]:v}:x))
  const removeItem = (id) => setItems(i=>i.filter(x=>x.id!==id))
  const total = items.reduce((s,i)=>s+(parseFloat(i.quantity)||0)*(parseFloat(i.unit_price)||0),0)

  async function save() {
    if (!form.po_number) return addToast('PO number is required','error')
    setSaving(true)
    const payload = {...form, vendor_id: form.vendor_id||null, expected_date: form.expected_date||null, total_amount: total}
    let poId = po?.id
    if (po) {
      const { error } = await supabase.from('purchase_orders').update(payload).eq('id',po.id)
      if (error) { addToast(error.message,'error'); setSaving(false); return }
      await supabase.from('po_items').delete().eq('po_id',po.id)
    } else {
      const { data, error } = await supabase.from('purchase_orders').insert({...payload, created_by: user.id}).select().single()
      if (error) { addToast(error.message,'error'); setSaving(false); return }
      poId = data.id
    }
    if (items.length > 0) {
      const rows = items.filter(i=>i.description).map(i=>({ po_id: poId, description:i.description, quantity:parseFloat(i.quantity)||1, unit:i.unit, unit_price:parseFloat(i.unit_price)||0, received_qty:parseFloat(i.received_qty)||0 }))
      if (rows.length) await supabase.from('po_items').insert(rows)
    }
    addToast(po?'PO updated':'PO created','success')
    onSaved()
    setSaving(false)
  }

  return (
    <div className="modal-backdrop" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:700}}>
        <div className="modal-header"><h3>{po?'Edit PO':'New Purchase Order'}</h3><button className="btn btn-sm" onClick={onClose}><IconX/></button></div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group"><label>PO Number *</label><input type="text" value={form.po_number} onChange={e=>set('po_number',e.target.value)} placeholder="PO-320"/></div>
            <div className="form-group"><label>Vendor</label><select value={form.vendor_id} onChange={e=>set('vendor_id',e.target.value)}><option value="">No vendor</option>{vendors.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
            <div className="form-group"><label>Status</label><select value={form.status} onChange={e=>set('status',e.target.value)}>{PO_STATUSES.map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-group"><label>Order Date</label><input type="date" value={form.order_date} onChange={e=>set('order_date',e.target.value)}/></div>
            <div className="form-group"><label>Expected Date</label><input type="date" value={form.expected_date} onChange={e=>set('expected_date',e.target.value)}/></div>
            <div className="form-group full"><label>Notes</label><textarea value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="Special instructions, lead time notes…" style={{minHeight:60}}/></div>
          </div>
          <div className="line-items" style={{marginTop:20}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
              <span style={{fontSize:'12px',fontWeight:600,color:'var(--text2)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Line Items</span>
              <button className="btn btn-sm" onClick={addItem}><IconPlus/> Add Line</button>
            </div>
            <div style={{border:'1px solid var(--border)',borderRadius:'var(--radius)',overflow:'hidden'}}>
              <table>
                <thead><tr><th>Description</th><th style={{width:70}}>Qty</th><th style={{width:60}}>Unit</th><th style={{width:90}}>Unit Price</th><th style={{width:80}}>Rcvd</th><th style={{width:32}}></th></tr></thead>
                <tbody>
                  {items.map(item=>(
                    <tr key={item.id}>
                      <td><input type="text" value={item.description} onChange={e=>setItem(item.id,'description',e.target.value)} placeholder="Item description"/></td>
                      <td><input type="number" value={item.quantity} onChange={e=>setItem(item.id,'quantity',e.target.value)} min="0" step="0.01"/></td>
                      <td><input type="text" value={item.unit} onChange={e=>setItem(item.id,'unit',e.target.value)} placeholder="ea"/></td>
                      <td><input type="number" value={item.unit_price} onChange={e=>setItem(item.id,'unit_price',e.target.value)} min="0" step="0.01"/></td>
                      <td><input type="number" value={item.received_qty} onChange={e=>setItem(item.id,'received_qty',e.target.value)} min="0" step="0.01"/></td>
                      <td><button className="btn btn-sm btn-danger" onClick={()=>removeItem(item.id)}><IconX/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{textAlign:'right',marginTop:10,fontSize:'14px',fontWeight:600}}>Total: {fmtMoney(total)}</div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'Saving…':'Save PO'}</button>
        </div>
      </div>
    </div>
  )
}

export default function PurchaseOrdersPage() {
  const { addToast } = useToast()
  const [pos, setPos] = useState([])
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [modal, setModal] = useState(null)

  async function load() {
    const [{ data: p },{ data: v }] = await Promise.all([
      supabase.from('purchase_orders').select('*,vendors(name)').order('created_at',{ascending:false}),
      supabase.from('vendors').select('id,name').order('name'),
    ])
    setPos(p||[]); setVendors(v||[]); setLoading(false)
  }
  useEffect(()=>{ load() },[])

  async function del(id) {
    if (!window.confirm('Delete this PO?')) return
    const { error } = await supabase.from('purchase_orders').delete().eq('id',id)
    if (error) addToast(error.message,'error'); else { addToast('PO deleted','success'); load() }
  }

  const filtered = pos.filter(p => {
    const ms = !search || p.po_number.toLowerCase().includes(search.toLowerCase()) || p.vendors?.name?.toLowerCase().includes(search.toLowerCase())
    const mf = statusFilter==='All' || p.status===statusFilter
    return ms && mf
  })

  if (loading) return <div className="loading"><div className="spinner"/>Loading…</div>

  return (
    <div>
      <div className="page-header">
        <div><h1>Purchase Orders</h1><p>{pos.length} total POs</p></div>
        <button className="btn btn-primary" onClick={()=>setModal('new')}><IconPlus/> New PO</button>
      </div>
      <div style={{display:'flex',gap:'10px',marginBottom:16,alignItems:'center'}}>
        <div className="search-bar" style={{flex:1,maxWidth:320}}><IconSearch/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search PO # or vendor…"/></div>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{width:'auto',padding:'7px 12px'}}><option value="All">All Statuses</option>{PO_STATUSES.map(s=><option key={s}>{s}</option>)}</select>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>PO #</th><th>Vendor</th><th>Status</th><th>Order Date</th><th>Expected</th><th>Total</th><th></th></tr></thead>
            <tbody>
              {filtered.length===0&&<tr><td colSpan={7} style={{textAlign:'center',color:'var(--text3)',padding:'40px'}}>No POs found</td></tr>}
              {filtered.map(p=>(
                <tr key={p.id}>
                  <td><span style={{fontFamily:'var(--mono)',fontSize:'12px',fontWeight:500}}>{p.po_number}</span></td>
                  <td style={{fontWeight:500}}>{p.vendors?.name||'—'}</td>
                  <td><span className={`badge ${poStatusBadge(p.status)}`}>{p.status}</span></td>
                  <td>{fmtDate(p.order_date)}</td>
                  <td>{fmtDate(p.expected_date)}</td>
                  <td style={{fontWeight:500}}>{fmtMoney(p.total_amount)}</td>
                  <td><div style={{display:'flex',gap:'4px'}}><button className="btn btn-sm" onClick={()=>setModal(p)}><IconEdit/></button><button className="btn btn-sm btn-danger" onClick={()=>del(p.id)}><IconTrash/></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {modal&&<POModal po={modal==='new'?null:modal} vendors={vendors} onClose={()=>setModal(null)} onSaved={()=>{setModal(null);load()}}/>}
    </div>
  )
}
