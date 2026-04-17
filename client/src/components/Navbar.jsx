import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ShoppingCart, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      zIndex: 100, 
      padding: '1.5rem 3rem',
      background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      color: '#fff'
    }}>
      <Link to="/" style={{ fontSize: '1.5rem', fontWeight: 600, letterSpacing: '1px', color: '#fff' }}>
        AeroDynamics
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', fontSize: '0.875rem', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
        <Link to="/" style={{ color: '#fff' }}>Store</Link>
        <Link to="/orders" style={{ color: '#fff' }}>Orders</Link>
        <Link to="/cart" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
          <ShoppingCart size={18} />
          <span>Cart</span>
        </Link>
        {user ? (
          <>
            {user.role === 'admin' && (
              <Link to="/admin" style={{ color: '#fff' }}>Admin</Link>
            )}
            <button onClick={handleLogout} style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </>
        ) : (
          <Link to="/login" style={{ border: '1px solid #fff', padding: '0.5rem 1.5rem', borderRadius: '2rem', color: '#fff' }}>Sign In</Link>
        )}
      </div>
    </nav>
  );
}
