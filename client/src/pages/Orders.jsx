import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Package, Clock, CheckCircle } from 'lucide-react';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders')
      .then(res => { setOrders(res.data.orders); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading your orders...</div>;

  if (orders.length === 0) {
    return (
      <div className="container" style={{ paddingTop: '10rem', paddingBottom: '4rem', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--surface-color)', borderRadius: '1rem' }} className="shadow-sm">
          <Package size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No orders found</h2>
          <p style={{ color: 'var(--text-secondary)' }}>You haven't locked in any dynamic prices yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '10rem', paddingBottom: '4rem', minHeight: '100vh' }}>
      <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem', color: 'var(--text-primary)' }}>Your Orders</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {orders.map(order => (
          <div key={order.id} className="glass" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
            <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>ORDER PLACED</p>
                <p style={{ fontWeight: 600 }}>{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>TOTAL</p>
                <p style={{ fontWeight: 600 }}>₹{order.totalAmount.toFixed(0)}</p>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: order.status === 'paid' ? '#dcfce7' : '#fef3c7', color: order.status === 'paid' ? '#166534' : '#b45309', borderRadius: '2rem', fontWeight: 600, fontSize: '0.875rem', textTransform: 'capitalize' }}>
                {order.status === 'paid' ? <CheckCircle size={16} /> : <Clock size={16} />}
                {order.status}
              </div>
            </div>
            <div style={{ padding: '1.5rem' }}>
              {order.items.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: '1.5rem', margin: '1rem 0' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '0.5rem', overflow: 'hidden', background: 'var(--surface-color)', flexShrink: 0 }}>
                    <img src={item.product.imageUrl} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h4 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{item.product.name}</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Quantity: {item.quantity}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end' }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price Locked In</p>
                    <p style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-primary)' }}>₹{item.priceAtPurchase.toFixed(0)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
