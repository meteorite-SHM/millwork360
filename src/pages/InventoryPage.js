import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useToast } from '../lib/ToastContext'
import { invBarColor, fmtDate } from '../lib/utils'
import { IconPlus, IconX, IconEdit, IconTrash, IconSearch } from '../components/Icons'

function ItemModal({ item, onClose, onSaved }) {
  const { addToast } = useToast()
  const [form, setForm] = useState(item || { name:'', category:'', sku:'', unit:'ea', quantity_on_hand:0, reorder_point:0, notes:'' })
  const [saving, setSaving] = useState(false)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  async function save() {
    if (!form.name) return addToast('Item name is required','error')
    setSaving(true)
    if (item) {
      const { error } = await supabase.from('inventory').update(form).eq('id',item.id)
      if (error) addToast(error.message,'error'); else { addToast('Item updated','success'); onSaved() }
    } else {
      const { error } = await supabase.from('inventory').insert(form)
      if (error) addToast(error.message,'error'); else { addToast('Item added','success'); onSaved() }
    }
    setSaving(false)
  }
  return (
    <div className="modal-backdrop" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header"><h3>{item?'Edit Item':'New Inventory Item'}</h3><button className="btn btn-sm" onClick={onClose}><IconX/></button></div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group full"><label>Item Name *</label><input type="text" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Reeded Glass 3/4 inch"/></div>
            <div className="form-group"><label>Category</label><input type="text" value={form.category} onChange={e=>set('category',e.target.value)} placeholder="Glass, Hardware, Lumber…"/></div>
            <div className="form-group"><label>SKU / Part #</label><input type="text" value={form.sku} onChange={e=>set('sku',e.target.value)} placeholder="Optional"/></div>
            <div className="form-group"><label>Unit</label><input type="text" value={form.unit} onChange={e=>set('unit',e.target.value)} placeholder="ea, sq ft, pair, roll…"/></div>
            <div className="form-group"><label>Qty on Hand</label><input type="number" value={form.quantity_on_hand} onChange={e=>set('quantity_on_hand',e.target.value)} min="0" step="0.01"/></div>
            <div className="form-group"><label>Reorder Point</label><input type="number" value={form.reorder_point} onChange={e=>set('reorder_point',e.target.value)} min="0" step="0.01"/></div>
            <div className="form-group full"><label>Notes</label><textarea value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="Storage location, vendor info…" style={{minHeight:60}}/></div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'Saving…':'Save Item'}</button>
        </div>
      </div>
    </div>
  )
}

function AdjustModal({ item, onClose, onSaved }) {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [type, setType] = useState('adjustment')
  const [qty, setQty] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  async function save() {
    const q = parseFloat(qty)
    if (!q) return addToast('Enter a quantity','error')
    setSaving(true)
    const delta = type === 'used' ? -Math.abs(q) : Math.abs(q)
    const newQty = Math.max(0, parseFloat(item.quantity_on_hand) + delta)
    const [{ error: e1 },{ error: e2 }] = await Promise.all([
      supabase.from('inventory').update({ quantity_on_hand: newQty }).eq('id',item.id),
      supabase.from('inventory_transactions').insert({ item_id:item.id, type, quantity:delta, note, reference: item.sku||null, created_by: user.id }),
    ])
    if (e1||e2) addToast('Error saving','error')
    else { addToast('Quantity updated','success'); onSaved() }
    setSaving(false)
  }
  return (
    <div className="modal-backdrop" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:420}}>
        <div className="modal-header"><h3>Adjust: {item.name}</h3><button className="btn btn-sm" onClick={onClose}><IconX/></button></div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group full"><label>Transaction Type</label>
              <select value={type} onChange={e=>setType(e.target.value)}>
                <option value="received">Received (add)</option>
                <option value="used">Used (subtract)</option>
                <option value="adjustment">Manual Adjustment (add)</option>
                <option value="returned">Returned (add)</option>
              </select>
            </div>
            <div className="form-group full"><label>Quantity</label><input type="number" value={qty} onChange={e=>setQty(e.target.value)} min="0" step="0.01" placeholder={`Current: ${item.quantity_on_hand} ${item.unit}`}/></div>
            <div className="form-group full"><label>Note</label><input type="text" value={note} onChange={e=>setNote(e.target.value)} placeholder="PO #, order ref, reason…"/></div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'Saving…':'Update Qty'}</button>
        </div>
      </div>
    </div>
  )
}

export default function InventoryPage() {
  const { addToast } = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('All')
  const [modal, setModal] = useState(null) // null | 'new' | {item, mode:'edit'|'adjust'}

  async function load() {
    const { data } = await supabase.from('inventory').select('*').order('name')
    setItems(data||[]); setLoading(false)
  }
  useEffect(()=>{ load() },[])

  async function del(id) {
    if (!window.confirm('Delete this item?')) return
    const { error } = await supabase.from('inventory').delete().eq('id',id)
    if (error) addToast(error.message,'error'); else { addToast('Item deleted','success'); load() }
  }

  const categories = ['All', ...Array.from(new Set(items.map(i=>i.category).filter(Boolean))).sort()]

  const filtered = items.filter(i => {
    const ms = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.sku?.toLowerCase().includes(search.toLowerCase())
    const mc = catFilter==='All' || i.category===catFilter
    return ms && mc
  })

  const lowCount = items.filter(i=>i.quantity_on_hand<=i.reorder_point).length

  if (loading) return <div className="loading"><div className="spinner"/>Loading…</div>

  return (
    <div>
      <div className="page-header">
        <div><h1>Inventory</h1><p>{items.length} items · {lowCount > 0 ? <span style={{color:'var(--amber)'}}>{lowCount} low / reorder</span> : 'all levels OK'}</p></div>
        <button className="btn btn-primary" onClick={()=>setModal({mode:'new'})}><IconPlus/> Add Item</button>
      </div>
      <div style={{display:'flex',gap:'10px',marginBottom:16,alignItems:'center'}}>
        <div className="search-bar" style={{flex:1,maxWidth:320}}><IconSearch/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search items or SKU…"/></div>
        <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} style={{width:'auto',padding:'7px 12px'}}>
          {categories.map(c=><option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Item</th><th>Category</th><th>SKU</th><th>On Hand</th><th>Reorder At</th><th>Level</th><th></th></tr></thead>
            <tbody>
              {filtered.length===0&&<tr><td colSpan={7} style={{textAlign:'center',color:'var(--text3)',padding:'40px'}}>No items found</td></tr>}
              {filtered.map(item=>{
                const low = item.quantity_on_hand <= item.reorder_point
                const pct = item.reorder_point>0 ? Math.min(100,Math.max(5,(item.quantity_on_hand/(item.reorder_point*3))*100)) : 60
                return (
                  <tr key={item.id} style={low?{background:'#FAEEDA22'}:{}}>
                    <td style={{fontWeight:500}}>{item.name}</td>
                    <td><span className="badge badge-gray">{item.category||'—'}</span></td>
                    <td style={{fontFamily:'var(--mono)',fontSize:'12px',color:'var(--text2)'}}>{item.sku||'—'}</td>
                    <td style={{fontWeight:500,color: item.quantity_on_hand===0?'var(--red)': low?'var(--amber)':'var(--text)'}}>{item.quantity_on_hand} {item.unit}</td>
                    <td style={{color:'var(--text3)'}}>{item.reorder_point} {item.unit}</td>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div className="inv-bar-wrap"><div className="inv-bar" style={{width:`${pct}%`,background:invBarColor(item.quantity_on_hand,item.reorder_point)}}/></div>
                        <span className={`badge ${item.quantity_on_hand===0?'badge-red':low?'badge-amber':'badge-green'}`}>{item.quantity_on_hand===0?'Out':low?'Low':'OK'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{display:'flex',gap:'4px'}}>
                        <button className="btn btn-sm" onClick={()=>setModal({item,mode:'adjust'})} title="Adjust qty" style={{fontSize:11}}>± Qty</button>
                        <button className="btn btn-sm" onClick={()=>setModal({item,mode:'edit'})}><IconEdit/></button>
                        <button className="btn btn-sm btn-danger" onClick={()=>del(item.id)}><IconTrash/></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      {modal?.mode==='new'&&<ItemModal onClose={()=>setModal(null)} onSaved={()=>{setModal(null);load()}}/>}
      {modal?.mode==='edit'&&<ItemModal item={modal.item} onClose={()=>setModal(null)} onSaved={()=>{setModal(null);load()}}/>}
      {modal?.mode==='adjust'&&<AdjustModal item={modal.item} onClose={()=>setModal(null)} onSaved={()=>{setModal(null);load()}}/>}
    </div>
  )
}
