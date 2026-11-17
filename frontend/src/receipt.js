import { money, gstBreakup, billTotal } from './api';
import logo from './receiptLogo';

const SILENT = false;              // true = print straight to the default printer with no dialog
const PHONE = '+91 9786450022';
const GSTIN = '';                  // optional: e.g. '33ABCDE1234F1Z5'. Printed under the phone number when filled in.

export function receiptHtml(o) {
  const row = (a, b, st = '') => `<tr style="${st}"><td colspan="3">${a}</td><td align="right">${b}</td></tr>`;
  const gap = '<tr><td colspan="4">&nbsp;</td></tr>';
  const gst = gstBreakup(o);
  const base = gst.reduce((t, g) => t + g.taxable, 0);
  const when = new Date(o.paidAt).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const pd = 'padding-left:10px;white-space:nowrap';
  const items = o.lines.map(l => `<tr><td style="vertical-align:top">${l.name}</td><td align="center" style="vertical-align:top;${pd}">${l.qty}</td><td align="right" style="vertical-align:top;${pd}">${Number(l.unitPrice).toFixed(2)}</td><td align="right" style="vertical-align:top;${pd}">${(l.unitPrice * l.qty).toFixed(2)}</td></tr>`).join('');
  const line = '<hr style="border:0;border-top:1px dashed #000;margin:4px 0">';
  const c = 'text-align:center;margin:0';
  return `<html><head><meta charset="utf-8"></head><body style="font:12px monospace;width:72mm;margin:0;padding:0 3mm 0 6mm;box-sizing:border-box;color:#000">
  <div style="text-align:center"><img src="${logo}" style="width:18mm"></div>
  <p style="${c};margin-top:3px"><span style="background:#000;color:#fff;padding:2px 8px;font-weight:bold;-webkit-print-color-adjust:exact;print-color-adjust:exact">Frenzy-Flavored-Foodies</span></p>
  <p style="${c};margin-top:4px">Ph: ${PHONE}</p>
  ${GSTIN ? `<p style="${c}">GSTIN: ${GSTIN}</p>` : ''}
  <p style="${c};margin-top:4px"><b>Welcome</b></p>
  ${line}
  <p style="${c}"><b>TAX INVOICE</b></p>
  <p style="margin:2px 0">Order ID: ${o.id}</p>
  <p style="margin:2px 0">Date: ${when}</p>
  ${line}
  <table width="100%" style="border-collapse:collapse">
    <tr><td><b>Item</b></td><td align="center" style="${pd}"><b>Qty</b></td><td align="right" style="${pd}"><b>Price</b></td><td align="right" style="${pd}"><b>Amt</b></td></tr>
    ${items}
  </table>
  ${line}
  <table width="100%" style="border-collapse:collapse">
    ${o.discount > 0 ? row('Items total', money(o.subtotal)) + row('Discount', '-' + money(o.discount)) : ''}
    ${row('Base Price', money(base))}
    ${gap}
    ${gst.map(g => row(`CGST (${g.rate / 2}%)`, money(g.cgst)) + row(`SGST (${g.rate / 2}%)`, money(g.sgst))).join('')}
    ${gap}
    ${o.serviceCharge > 0 ? row(`Service charge (${o.serviceChargePct}%)`, money(o.serviceCharge)) : ''}
    ${row('<b>Total Price (Net)</b>', '<b>' + money(billTotal(o)) + '</b>')}
  </table>
  ${line}
  ${o.payments.map(p => `<p style="margin:2px 0">Paid by ${p.method}: ${money(p.amount)}</p>`).join('')}
  <p style="${c};margin-top:6px">Thank you! Visit again.</p></body></html>`;
}

export function printReceipt(o) {
  const html = receiptHtml(o);
  if (window.f3) return window.f3.printHtml(html, SILENT);
  const w = window.open('', '_blank', 'width=380,height=600');
  w.document.write(html); w.document.close();
  const img = w.document.images[0];
  const go = () => w.print();
  if (img && !img.complete) img.onload = go; else go();
}
