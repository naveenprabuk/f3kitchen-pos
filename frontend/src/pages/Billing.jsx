import { useEffect, useState } from 'react';
import { api, money, gstBreakup, billTotal, newestFirst, timeOf } from '../api';
import { printReceipt } from '../receipt';

const METHODS = [['CASH', 'Cash'], ['CARD', 'Card'], ['UPI', 'UPI / Wallet']];

export default function Billing() {
  const [orders, setOrders] = useState([]);
  const [sel, setSel] = useState(null);
  const [disc, setDisc] = useState(0);
  const [svc, setSvc] = useState(0);
  const [method, setMethod] = useState('CASH');
  const [msg, setMsg] = useState({ text: '', bad: false });
  const say = (text, bad = false) => setMsg({ text, bad });

  const load = () => api.orders().then(setOrders).catch(e => say(e.message, true));
  useEffect(() => { load(); }, []);

  const pick = o => { setSel(o); setDisc(o.discount); setSvc(o.serviceChargePct); setMethod('CASH'); say(''); };
  const apply = async () => {
    try {
      const o = await api.billing(sel.id, { discount: Number(disc) || 0, serviceChargePct: Number(svc) || 0 });
      setSel(o); say(''); load();
    } catch (x) { say(x.message, true); }
  };
  const pay = async () => {
    try {
      const o = await api.pay(sel.id, [{ method, amount: billTotal(sel) }]);
      printReceipt(o); setSel(null); load(); say(`Order #${o.id} paid and closed`);
    } catch (x) { say(x.message, true); } // order stays open
  };
  const gst = sel ? gstBreakup(sel) : [];

  return (
    <div className="split">
      <section>
        <h2>Billing</h2>
        {msg.text && <p className={msg.bad ? 'err' : 'ok'}>{msg.text}</p>}
        <table>
          <thead><tr><th>Order</th><th>Time</th><th>Status</th><th>Total</th><th /></tr></thead>
          <tbody>{newestFirst(orders).map(o => (
            <tr key={o.id}><td>#{o.id} {o.type === 'DINE_IN' ? 'Table ' + o.tableNo : o.type}</td><td>{timeOf(o.createdAt)}</td><td>{o.status.replace('_', ' ')}</td><td>{money(billTotal(o))}</td>
              <td><button className="btn ghost" onClick={() => pick(o)}>Open bill</button></td></tr>))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="mute">No open orders to bill.</p>}
      </section>

      {sel && (
        <div className="card stack">
          <h3>Bill for order #{sel.id}</h3>
          {sel.lines.map((l, i) => <div className="row between" key={i}><span>{l.qty} x {l.name} <small className="mute">GST {l.taxRate}%</small></span><span>{money(l.unitPrice * l.qty)}</span></div>)}
          <div className="row"><input type="number" min="0" placeholder="Discount ₹" value={disc} onChange={e => setDisc(e.target.value)} />
            <input type="number" min="0" placeholder="Service %" value={svc} onChange={e => setSvc(e.target.value)} />
            <button className="btn ghost" onClick={apply}>Apply</button></div>
          {sel.discount > 0 && <>
            <div className="row between"><span className="mute">Items total</span><span>{money(sel.subtotal)}</span></div>
            <div className="row between"><span className="mute">Discount</span><span>-{money(sel.discount)}</span></div></>}
          <div className="row between"><span className="mute">Base Price</span><span>{money(gst.reduce((t, g) => t + g.taxable, 0))}</span></div>
          {gst.map(g => <div key={g.rate} className="stack tight">
            <div className="row between"><span className="mute">GST Amount ({g.rate}%)</span><span>{money(g.gst)}</span></div>
            <div className="row between"><span className="mute">CGST ({g.rate / 2}%) | SGST ({g.rate / 2}%)</span><span>{money(g.cgst)} | {money(g.sgst)}</span></div></div>)}
          {sel.serviceCharge > 0 && <div className="row between"><span className="mute">Service charge</span><span>{money(sel.serviceCharge)}</span></div>}
          <div className="row between"><b>Total Price (Net)</b><b>{money(billTotal(sel))}</b></div>
          <hr />
          <select value={method} onChange={e => setMethod(e.target.value)}>{METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          <button className="btn" onClick={pay}>Take {money(billTotal(sel))} and print receipt</button>
        </div>
      )}
    </div>
  );
}
