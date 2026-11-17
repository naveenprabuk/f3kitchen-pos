import { useEffect, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api, money } from '../api';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const q = v => `"${String(v).replace(/"/g, '""')}"`;

export default function Reports() {
  const [period, setPeriod] = useState('daily');
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA')); // yyyy-mm-dd, local time
  const [r, setR] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api.report(period, date).then(x => { setR(x); setErr(''); }).catch(e => setErr(e.message)); }, [period, date]);

  const chart = r && r.series.map(s => ({ ...s, label: period === 'yearly' ? MONTHS[+s.label - 1] : s.label }));
  const csv = () => {
    const rows = [['Metric', 'Value'], ['Total sales', r.totalSales], ['Orders', r.orderCount], ['Average ticket', r.avgTicket], ['Tax total', r.taxTotal],
      [], ['Payment method', 'Amount'], ...Object.entries(r.payments), [], ['Category', 'Sales'], ...Object.entries(r.categories), [], ['Top item', 'Qty'], ...r.topItems.map(i => [i.name, i.qty])];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows.map(x => x.map(q).join(',')).join('\n')], { type: 'text/csv' }));
    a.download = `f3-kitchen-${period}-${date}.csv`; a.click();
  };

  return (
    <section>
      <div className="row between noprint">
        <h2>Reports</h2>
        <div className="row">
          <select value={period} onChange={e => setPeriod(e.target.value)}>
            <option value="daily">Daily</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option>
          </select>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} title="Any date inside the month or year you want" />
          <button className="btn ghost" disabled={!r || !r.orderCount} onClick={csv}>Export CSV</button>
          <button className="btn ghost" disabled={!r || !r.orderCount} onClick={() => window.print()}>Print / Save PDF</button>
        </div>
      </div>
      {err && <p className="err">{err}</p>}
      {r && <h3 className="mute">F3 Kitchen {period} report: {r.from}{r.from !== r.to && ` to ${r.to}`}</h3>}
      {r && r.orderCount === 0 && <p className="mute">No paid orders in this period.</p>}
      {r && r.orderCount > 0 && <>
        <div className="kpis">
          <div className="card kpi"><span className="mute">Total sales</span><b>{money(r.totalSales)}</b></div>
          <div className="card kpi"><span className="mute">Orders</span><b>{r.orderCount}</b></div>
          <div className="card kpi"><span className="mute">Average ticket</span><b>{money(r.avgTicket)}</b></div>
          <div className="card kpi"><span className="mute">Tax collected</span><b>{money(r.taxTotal)}</b></div>
        </div>
        <div className="card" style={{ height: 260 }}>
          <ResponsiveContainer><BarChart data={chart}><XAxis dataKey="label" stroke="#9a948c" /><YAxis stroke="#9a948c" /><Tooltip formatter={v => money(v)} contentStyle={{ background: '#222', border: '1px solid #333' }} /><Bar dataKey="total" fill="#c98a4b" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer>
        </div>
        <div className="board3">
          <div className="card"><h4>Payment methods</h4><table><tbody>{Object.entries(r.payments).map(([k, v]) => <tr key={k}><td>{k}</td><td>{money(v)}</td></tr>)}</tbody></table></div>
          <div className="card"><h4>Categories</h4><table><tbody>{Object.entries(r.categories).map(([k, v]) => <tr key={k}><td>{k}</td><td>{money(v)}</td></tr>)}</tbody></table></div>
          <div className="card"><h4>Top sellers</h4><table><tbody>{r.topItems.map(i => <tr key={i.name}><td>{i.name}</td><td>{i.qty}</td></tr>)}</tbody></table></div>
        </div>
      </>}
    </section>
  );
}
