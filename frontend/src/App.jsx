import { useState } from 'react';
import Login from './pages/Login';
import MenuPage from './pages/MenuPage';
import Orders from './pages/Orders';
import Billing from './pages/Billing';
import Reports from './pages/Reports';

const TABS = { Orders: ['ADMIN', 'CASHIER', 'KITCHEN'], Billing: ['ADMIN', 'CASHIER'], Menu: ['ADMIN'], Reports: ['ADMIN'] };
const PAGES = { Orders, Billing, Menu: MenuPage, Reports };

export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('Orders');
  if (!user) return <Login onLogin={u => { setUser(u); setTab('Orders'); }} />;
  const Page = PAGES[tab];
  return (
    <div className="app">
      <aside>
        <img src="logo.png" className="logo" alt="F3 Kitchen" />
        {Object.keys(TABS).filter(t => TABS[t].includes(user.role)).map(t =>
          <button key={t} className={t === tab ? 'nav on' : 'nav'} onClick={() => setTab(t)}>{t}</button>)}
        <div className="grow" />
        <small className="mute">Signed in as {user.username}</small>
        <button className="nav" onClick={() => setUser(null)}>Sign out</button>
      </aside>
      <main><Page user={user} /></main>
    </div>
  );
}
