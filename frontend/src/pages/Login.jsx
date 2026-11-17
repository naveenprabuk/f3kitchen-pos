import { useState } from 'react';
import { api } from '../api';

export default function Login({ onLogin }) {
  const [f, setF] = useState({ username: 'admin', password: '' });
  const [err, setErr] = useState('');
  const go = async e => {
    e.preventDefault();
    try { onLogin(await api.login(f)); } catch (x) { setErr(x.message); }
  };
  return (
    <div className="login">
      <form className="card" onSubmit={go}>
        <img src="logo.png" alt="F3 Kitchen" className="logo big" />
        <select value={f.username} onChange={e => setF({ ...f, username: e.target.value })}>
          <option value="admin">Admin</option><option value="cashier">Cashier</option><option value="kitchen">Kitchen</option>
        </select>
        <input type="password" placeholder="Password" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} />
        {err && <p className="err">{err}</p>}
        <button className="btn">Sign in</button>
      </form>
    </div>
  );
}
