import { useEffect, useMemo, useState } from 'react';
import { api, money, GST_SLABS, priceSplit } from '../api';

const blank = { name: '', category: '', price: '', taxRate: 5, description: '', available: true, active: true };

export default function MenuPage() {
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [f, setF] = useState(blank);
  const [err, setErr] = useState('');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [newCat, setNewCat] = useState('');
  const [catMsg, setCatMsg] = useState('');

  const load = () => api.menu().then(setItems).catch(e => setErr(e.message));
  const loadCats = () => api.categories().then(c => { setCats(c); setF(x => x.category || !c.length ? x : { ...x, category: c[0].name }); }).catch(e => setErr(e.message));
  useEffect(() => { load(); loadCats(); }, []);
  const set = k => e => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const shown = useMemo(() => items.filter(i =>
    (!filterCat || i.category === filterCat) && i.name.toLowerCase().includes(search.trim().toLowerCase())), [items, search, filterCat]);
  const slabs = GST_SLABS.includes(Number(f.taxRate)) ? GST_SLABS : [...GST_SLABS, Number(f.taxRate)];

  const save = async e => {
    e.preventDefault(); setErr('');
    if (!f.name.trim() || !(Number(f.price) > 0)) return setErr('Enter a name and a price greater than 0');
    if (!f.category) return setErr('Choose a category');
    try {
      await (f.id ? api.saveItem({ ...f, price: Number(f.price), taxRate: Number(f.taxRate) }) : api.addItem({ ...f, price: Number(f.price), taxRate: Number(f.taxRate) }));
      setF({ ...blank, category: f.category }); load(); loadCats();
    } catch (x) { setErr(x.message); }
  };
  const del = async i => {
    if (confirm(`Remove "${i.name}" from the menu? Past orders keep it.`)) { await api.delItem(i.id); load(); }
  };

  const catAct = async fn => { try { await fn(); setCatMsg(''); loadCats(); load(); } catch (x) { setCatMsg(x.message); } };
  const addCat = () => newCat.trim() && catAct(async () => { await api.addCategory(newCat); setNewCat(''); });
  const renameCat = c => { const n = prompt('Rename category', c.name); if (n && n.trim() && n.trim() !== c.name) catAct(() => api.renameCategory(c.id, n)); };
  const delCat = c => { if (confirm(`Delete category "${c.name}"?`)) catAct(() => api.delCategory(c.id)); };

  return (
    <div className="split">
      <section>
        <h2>Menu <span className="mute">({shown.length} of {items.length})</span></h2>
        <div className="row" style={{ marginBottom: 10 }}>
          <input placeholder="Search menu by name" value={search} onChange={e => setSearch(e.target.value)} />
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ width: 180 }}>
            <option value="">All categories</option>{cats.map(c => <option key={c.id}>{c.name}</option>)}
          </select>
        </div>
        <table>
          <thead><tr><th>Item</th><th>Category</th><th>Price (incl. GST)</th><th>Base Price</th><th>GST</th><th>Status</th><th /></tr></thead>
          <tbody>{shown.map(i => (
            <tr key={i.id}>
              <td>{i.name}</td><td>{i.category}</td><td>{money(i.price)}</td><td>{money(priceSplit(i.price, i.taxRate).base)}</td><td>{money(priceSplit(i.price, i.taxRate).gst)} ({i.taxRate}%)</td>
              <td className={i.available ? 'ok' : 'err'}>{i.available ? 'Available' : 'Out of stock'}</td>
              <td className="row"><button className="btn ghost" onClick={() => setF(i)}>Edit</button><button className="btn bad" onClick={() => del(i)}>Delete</button></td>
            </tr>))}
          </tbody>
        </table>
        {items.length === 0 && <p className="mute">No items yet. Add your first dish.</p>}
        {items.length > 0 && shown.length === 0 && <p className="mute">No items match your search.</p>}
      </section>

      <div className="stack">
        <form className="card stack" onSubmit={save}>
          <h3>{f.id ? 'Edit item' : 'Add item'}</h3>
          <input placeholder="Name" value={f.name} onChange={set('name')} />
          <select value={f.category} onChange={set('category')}>
            {!cats.length && <option value="">Add a category first</option>}
            {cats.map(c => <option key={c.id}>{c.name}</option>)}
          </select>
          <div className="row">
            <input type="number" step="0.01" min="0" placeholder="Price (incl. GST)" value={f.price} onChange={set('price')} />
            <select value={f.taxRate} onChange={set('taxRate')} title="GST %">{slabs.map(s => <option key={s} value={s}>GST {s}%</option>)}</select>
          </div>
          {Number(f.price) > 0 && (() => { const x = priceSplit(f.price, f.taxRate); return (
            <div className="card stack tight" style={{ background: '#1f1f1f' }}>
              <div className="row between"><span className="mute">Base Price</span><span>{money(x.base)}</span></div>
              <div className="row between"><span className="mute">GST Amount ({f.taxRate}%)</span><span>{money(x.gst)}</span></div>
              <div className="row between"><span className="mute">CGST ({f.taxRate / 2}%) | SGST ({f.taxRate / 2}%)</span><span>{money(x.cgst)} | {money(x.sgst)}</span></div>
              <div className="row between"><b>Total Price (Net)</b><b>{money(f.price)}</b></div>
            </div>); })()}
          <textarea rows="2" placeholder="Description" value={f.description || ''} onChange={set('description')} />
          <label className="row"><input type="checkbox" style={{ width: 'auto' }} checked={f.available} onChange={set('available')} /> Available today</label>
          {err && <p className="err">{err}</p>}
          <div className="row"><button className="btn">Save item</button>{f.id && <button type="button" className="btn ghost" onClick={() => setF({ ...blank, category: cats[0]?.name || '' })}>Cancel</button>}</div>
        </form>

        <div className="card stack">
          <h3>Categories</h3>
          {cats.map(c => (
            <div className="row between" key={c.id}><span>{c.name}</span>
              <span className="row"><button className="btn ghost" onClick={() => renameCat(c)}>Edit</button><button className="btn bad" onClick={() => delCat(c)}>Delete</button></span></div>))}
          <div className="row"><input placeholder="New category" value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCat()} /><button className="btn" onClick={addCat}>Add</button></div>
          {catMsg && <p className="err">{catMsg}</p>}
        </div>
      </div>
    </div>
  );
}
