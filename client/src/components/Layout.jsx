import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <footer style={{ background: '#0b0f19', color: '#cbd5e1', padding: '2rem 0', marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="container" style={{ textAlign: 'center', fontSize: '0.875rem' }}>
          <p>&copy; 2026 AeroDynamics. All rights reserved. Dynamic Pricing Engine Active.</p>
        </div>
      </footer>
    </div>
  );
}
