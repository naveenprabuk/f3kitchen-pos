import { useEffect, useMemo, useState } from 'react';
import { api, money, newestFirst, timeOf } from '../api';

const COLS = { PENDING: 'Pending', IN_PREPARATION: 'In preparation', READY: 'Ready', SERVED: 'Served' };
const NEXT = { PENDING: ['IN_PREPARATION', 'Start preparing'], IN_PREPARATION: ['READY', 'Mark ready'], READY: ['SERVED', 'Mark served'] };

export default function Orders({ user }) {
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [type, setType] = useState('DINE_IN');
  const [table, setTable] = useState('');
  const [err, setErr] = useState('');
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('');
  const canOrder = user.role !== 'KITCHEN';

  const load = () => api.orders().then(setOrders).catch(e => setErr(e.message));
  useEffect(() => {
    api.menu().then(m => setMenu(m.filter(i => i.available))).catch(e => setErr(e.message));
    load();
    const t = setInterval(load, 4000); // keeps every screen in sync
    return () => clearInterval(t);
  }, []);

  const cats = useMemo(() => [...new Set(menu.map(i => i.category))].sort(), [menu]);
  const found = useMemo(() => menu.filter(i => (!cat || i.category === cat) && i.name.toLowerCase().includes(search.trim().toLowerCase())), [menu, cat, search]);

  const add = i => setCart(c => c.find(l => l.menuItemId === i.id)
    ? c.map(l => l.menuItemId === i.id ? { ...l, qty: l.qty + 1 } : l)
    : [...c, { menuItemId: i.id, name: i.name, qty: 1, note: '' }]);
  const change = (id, d) => setCart(c => c.map(l => l.menuItemId === id ? { ...l, qty: l.qty + d } : l).filter(l => l.qty > 0));
  const note = (id, v) => setCart(c => c.map(l => l.menuItemId === id ? { ...l, note: v } : l));
  const act = fn => fn().then(() => { setErr(''); load(); }).catch(e => setErr(e.message));

  const place = () => {
    if (type === 'DINE_IN' && !table.trim()) return setErr('Enter a table number');
    act(() => api.createOrder({ type, tableNo: table, lines: cart.map(({ menuItemId, qty, note }) => ({ menuItemId, qty, note })) })
      .then(() => { setCart([]); setTable(''); }));
  };

  return (
    <div className={canOrder ? 'split' : ''}>
      <section>
        <h2>Orders</h2>
        {err && <p className="err">{err}</p>}
        <div className="board">
          {Object.entries(COLS).map(([s, label]) => (
            <div key={s}>
              <h4 className="mute">{label} ({orders.filter(o => o.status === s).length})</h4>
              {(s === 'SERVED' ? newestFirst(orders.filter(o => o.status === s)) : orders.filter(o => o.status === s)).map(o => (
                <div className="card ticket" key={o.id}>
                  <b>#{o.id} {o.type === 'DINE_IN' ? 'Table ' + o.tableNo : o.type === 'TAKEOUT' ? 'Takeout' : 'Delivery'} <small className="mute">{timeOf(o.createdAt)}</small></b>
                  {o.lines.map((l, i) => (
                    <div className="row between" key={i}>
                      <span>{l.qty} x {l.name}{l.note && <em className="mute"> ({l.note})</em>}</span>
                      {s === 'PENDING' && canOrder && <button className="x" title="Cancel item" onClick={() => act(() => api.removeLine(o.id, i))}>×</button>}
                    </div>))}
                  {NEXT[s] && <button className="btn" onClick={() => act(() => api.setStatus(o.id, NEXT[s][0]))}>{NEXT[s][1]}</button>}
                </div>))}
            </div>))}
        </div>
      </section>

      {canOrder && (
        <div className="card stack">
          <h3>New order</h3>
          <div className="row">
            <select value={type} onChange={e => setType(e.target.value)}>
              <option value="DINE_IN">Dine-in</option><option value="TAKEOUT">Takeout</option><option value="DELIVERY">Delivery</option>
            </select>
            {type === 'DINE_IN' && <input placeholder="Table" value={table} onChange={e => setTable(e.target.value)} />}
          </div>
          <input placeholder="Search menu (name)" value={search} onChange={e => setSearch(e.target.value)} />
          <select value={cat} onChange={e => setCat(e.target.value)}>
            <option value="">All categories</option>{cats.map(c => <option key={c}>{c}</option>)}
          </select>
          {found.length === 0 && <p className="mute">No items match.</p>}
          <div className="grid">{found.map(i => <button key={i.id} className="tile" onClick={() => add(i)}>{i.name}<small>{money(i.price)}</small></button>)}</div>
          {cart.map(l => (
            <div key={l.menuItemId} className="stack tight">
              <div className="row between"><span>{l.name}</span>
                <span className="row"><button className="x" onClick={() => change(l.menuItemId, -1)}>−</button>{l.qty}<button className="x" onClick={() => change(l.menuItemId, 1)}>+</button></span></div>
              <input placeholder="Note (e.g. less spicy)" value={l.note} onChange={e => note(l.menuItemId, e.target.value)} />
            </div>))}
          <button className="btn" disabled={!cart.length} onClick={place}>Send to kitchen</button>
        </div>
      )}
    </div>
  );
}
