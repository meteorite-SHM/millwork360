import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../lib/ToastContext'
import { IconPlus, IconX, IconEdit, IconTrash, IconSearch } from '../components/Icons'

function VendorModal({ vendor, onClose, onSaved }) {
  const { addToast } = useToast()
  const [form, setForm] = useState(vendor || { name:'', contact_name:'', email:'', phone:'', notes:'' })
  const [saving, setSaving] = useState(false)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  async function save() {
    if (!form.name) return addToast('Vendor name is required', 'error')
    setSaving(true)
    if (vendor) {
      const { error } = await supabase.from('vendors').update(form).eq('id', vendor.id)
      if (error) addToast(error.message,'error'); else { addToast('Vendor updated','success'); onSaved() }
    } else {
      const { error } = await supabase.from('vendors').insert(form)
      if (error) addToast(error.message,'error'); else { addToast('Vendor added','success'); onSaved() }
    }
    setSaving(false)
  }
  return (
    <div className="modal-backdrop" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header"><h3>{vendor?'Edit Vendor':'New Vendor'}</h3><button className="btn btn-sm" onClick={onClose}><IconX/></button></div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group full"><label>Vendor Name *</label><input type="text" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Oldcastle Glass"/></div>
            <div className="form-group"><label>Contact Name</label><input type="text" value={form.contact_name} onChange={e=>set('contact_name',e.target.value)} placeholder="Rep name"/></div>
            <div className="form-group"><label>Phone</label><input type="text" value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="(813) 555-0100"/></div>
            <div className="form-group full"><label>Email</label><input type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="rep@vendor.com"/></div>
            <div className="form-group full"><label>Notes</label><textarea value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="Lead times, account #, payment terms…"/></div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'Saving…':'Save Vendor'}</button>
        </div>
      </div>
    </div>
  )
}

export default function VendorsPage() {
  const { addToast } = useToast()
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  async function load() {
    const { data } = await supabase.from('vendors').select('*').order('name')
    setVendors(data||[]); setLoading(false)
  }
  useEffect(()=>{ load() },[])
  async function del(id) {
    if (!window.confirm('Delete this vendor?')) return
    const { error } = await supabase.from('vendors').delete().eq('id',id)
    if (error) addToast(error.message,'error'); else { addToast('Vendor deleted','success'); load() }
  }
  const filtered = vendors.filter(v => !search || v.name.toLowerCase().includes(search.toLowerCase()))
  if (loading) return <div className="loading"><div className="spinner"/>Loading…</div>
  return (
    <div>
      <div className="page-header">
        <div><h1>Vendors</h1><p>{vendors.length} vendors on file</p></div>
        <button className="btn btn-primary" onClick={()=>setModal('new')}><IconPlus/> Add Vendor</button>
      </div>
      <div style={{marginBottom:16}}>
        <div className="search-bar" style={{maxWidth:320}}><IconSearch/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search vendors…"/></div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Vendor</th><th>Contact</th><th>Email</th><th>Phone</th><th>Notes</th><th></th></tr></thead>
            <tbody>
              {filtered.length===0&&<tr><td colSpan={6} style={{textAlign:'center',color:'var(--text3)',padding:'40px'}}>No vendors yet</td></tr>}
              {filtered.map(v=>(
                <tr key={v.id}>
                  <td style={{fontWeight:500}}>{v.name}</td>
                  <td>{v.contact_name||'—'}</td>
                  <td>{v.email?<a href={`mailto:${v.email}`}>{v.email}</a>:'—'}</td>
                  <td>{v.phone||'—'}</td>
                  <td style={{color:'var(--text2)',maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{v.notes||'—'}</td>
                  <td><div style={{display:'flex',gap:'4px'}}><button className="btn btn-sm" onClick={()=>setModal(v)}><IconEdit/></button><button className="btn btn-sm btn-danger" onClick={()=>del(v.id)}><IconTrash/></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {modal&&<VendorModal vendor={modal==='new'?null:modal} onClose={()=>setModal(null)} onSaved={()=>{setModal(null);load()}}/>}
    </div>
  )
}
