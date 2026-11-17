const BASE = 'http://localhost:8080/api';

async function req(path, opts = {}) {
  let r;
  try {
    r = await fetch(BASE + path, { ...opts, headers: { 'Content-Type': 'application/json' }, body: opts.body && JSON.stringify(opts.body) });
  } catch {
    throw new Error('Cannot reach the F3 Kitchen server. Make sure the backend is running.');
  }
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.message || 'Something went wrong'); }
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}

export const api = {
  login: b => req('/auth/login', { method: 'POST', body: b }),
  menu: all => req('/menu' + (all ? '?includeInactive=true' : '')),
  addItem: b => req('/menu', { method: 'POST', body: b }),
  saveItem: b => req('/menu/' + b.id, { method: 'PUT', body: b }),
  delItem: id => req('/menu/' + id, { method: 'DELETE' }),
  categories: () => req('/categories'),
  addCategory: name => req('/categories', { method: 'POST', body: { name } }),
  renameCategory: (id, name) => req('/categories/' + id, { method: 'PUT', body: { name } }),
  delCategory: id => req('/categories/' + id, { method: 'DELETE' }),
  orders: () => req('/orders'),
  createOrder: b => req('/orders', { method: 'POST', body: b }),
  setStatus: (id, v) => req(`/orders/${id}/status?value=${v}`, { method: 'PUT' }),
  removeLine: (id, i) => req(`/orders/${id}/lines/${i}`, { method: 'DELETE' }),
  billing: (id, b) => req(`/orders/${id}/billing`, { method: 'PUT', body: b }),
  pay: (id, payments) => req(`/orders/${id}/pay`, { method: 'POST', body: { payments } }),
  report: (p, d) => req(`/reports/${p}?date=${d}`)
};

export const money = n => '₹' + Number(n || 0).toFixed(2);

export const GST_SLABS = [0, 5, 12, 18, 28];

// Menu prices include GST. Per rate: gross (after discount) = taxable value + GST, GST = gross * rate / (100 + rate); CGST and SGST are half each.
const r2 = n => Math.round(n * 100) / 100;
export function gstBreakup(o) {
  const by = {};
  const add = (rate, taxable, gst, cgst, sgst) => {
    const x = by[rate] || (by[rate] = { rate: Number(rate), taxable: 0, gst: 0, cgst: 0, sgst: 0 });
    x.taxable += taxable; x.gst += gst; x.cgst += cgst; x.sgst += sgst;
  };
  if (!(o.discount > 0)) {
    // no discount: split each unit price exactly like the Menu page, then multiply by quantity
    o.lines.forEach(l => { const u = priceSplit(l.unitPrice, l.taxRate); add(l.taxRate, u.base * l.qty, u.gst * l.qty, u.cgst * l.qty, u.sgst * l.qty); });
  } else {
    // discount: it is shared across items first, then GST is taken out of what is left
    const factor = (o.subtotal - o.discount) / o.subtotal;
    const gross = {};
    o.lines.forEach(l => { gross[l.taxRate] = (gross[l.taxRate] || 0) + l.unitPrice * l.qty * factor; });
    Object.entries(gross).forEach(([rate, g]) => { const x = priceSplit(g, rate); add(rate, x.base, x.gst, x.cgst, x.sgst); });
  }
  return Object.values(by).map(x => ({ rate: x.rate, taxable: r2(x.taxable), gst: r2(x.gst), cgst: r2(x.cgst), sgst: r2(x.sgst) })).sort((a, b) => a.rate - b.rate);
}

// Break one GST-inclusive price into base price, GST and CGST/SGST (e.g. 160 at 5% -> 152.38 + 7.62, CGST 3.81, SGST 3.81).
export function priceSplit(price, rate) {
  const p = Number(price) || 0, r = Number(rate) || 0;
  const gst = r2(p * r / (100 + r)), cgst = r2(gst / 2);
  return { base: r2(p - gst), gst, cgst, sgst: r2(gst - cgst) };
}

// Total payable = items (GST included) - discount + service charge. GST is already inside the prices.
export const billTotal = o => r2(Number(o.subtotal) - Number(o.discount || 0) + Number(o.serviceCharge || 0));

// Newest first (latest order at the top)
export const newestFirst = list => [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt) || b.id - a.id);
export const timeOf = d => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
