import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { assetUrl } from '../utils/api';
import { Trash2, ShoppingCart, Plus, MapPin } from 'lucide-react';

export default function Cart() {
  const [items, setItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({ type: 'home', street: '', city: '', state: '', zipCode: '' });

  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const navigate = useNavigate();

  const fetchData = () => {
    Promise.all([
      api.get('/cart').catch(() => ({ data: { cart: [] } })),
      api.get('/addresses').catch(() => ({ data: { addresses: [] } }))
    ])
    .then(([cartRes, addrRes]) => { 
      setItems(cartRes.data.cart); 
      setAddresses(addrRes.data.addresses);
      if (addrRes.data.addresses.length > 0 && !selectedAddress) {
        setSelectedAddress(addrRes.data.addresses[0].id);
      }
      setLoading(false); 
    });
  };

  useEffect(() => { fetchData(); }, []);

  const handleRemove = async (productId) => {
    try {
      await api.delete('/cart', { data: { productId } });
      fetchData();
    } catch(err) { console.error(err); }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/addresses', newAddress);
      setAddresses([...addresses, res.data.address]);
      setSelectedAddress(res.data.address.id);
      setShowAddressModal(false);
      setNewAddress({ type: 'home', street: '', city: '', state: '', zipCode: '' });
    } catch(err) {
      alert(err.response?.data?.error || 'Failed to save address');
    }
  };

  const handleZipCodeChange = async (e) => {
    const zip = e.target.value;
    setNewAddress(prev => ({ ...prev, zipCode: zip }));
    
    // Auto-fill City and State based on Indian Postal API if 6 digits
    if (zip.length === 6 && /^\d+$/.test(zip)) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${zip}`);
        const data = await res.json();
        if (data && data[0] && data[0].Status === 'Success') {
          const postOffice = data[0].PostOffice[0];
          setNewAddress(prev => ({
            ...prev,
            city: postOffice.District,   // Automatically map district
            state: postOffice.State      // Automatically map state
          }));
        }
      } catch (err) {
        console.error("Postal API error:", err);
      }
    }
  };

  const handleCheckout = async () => {
    if (!selectedAddress) return alert("Please select or add a delivery address.");
    if (!deliveryDate) return alert("Please select a valid future delivery date.");
    
    setCheckingOut(true);
    try {
      const res = await api.post('/orders/create', { deliveryAddressId: selectedAddress, deliveryDate });
      if (res.data.stripeUrl) {
        window.location.href = res.data.stripeUrl; // Redirect to Stripe
      } else {
        alert('Order placed successfully (Stripe not configured - mocked payment).');
        navigate('/orders');
      }
    } catch(err) {
      alert(err.response?.data?.error || 'Checkout failed');
      setCheckingOut(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading cart...</div>;

  if (items.length === 0) {
    return (
      <div className="container" style={{ paddingTop: '8rem', paddingBottom: '4rem', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--surface-color)', borderRadius: '1rem' }} className="shadow-sm">
          <ShoppingCart size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Your cart is empty</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Lock in dynamic prices by adding products to your cart.</p>
          <Link to="/" className="btn-primary">Browse Market</Link>
        </div>
      </div>
    );
  }

  const total = items.reduce((sum, item) => sum + (item.currentPrice * item.quantity), 0);
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1); // Earliest delivery is tomorrow
  const minDateString = minDate.toISOString().split('T')[0];

  return (
    <div className="container" style={{ paddingTop: '10rem', paddingBottom: '4rem', minHeight: '100vh' }}>
      <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem', color: 'var(--text-primary)' }}>Your Cart</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', alignItems: 'start' }}>
        <div className="glass" style={{ padding: '2rem', borderRadius: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {items.map(item => (
              <div key={item.id} style={{ display: 'flex', gap: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '0.5rem', overflow: 'hidden', background: 'var(--surface-color)', flexShrink: 0 }}>
                  <img src={assetUrl(item.imageUrl)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h3 style={{ fontWeight: 600, fontSize: '1.1rem' }}>{item.name}</h3>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>₹{item.currentPrice.toFixed(0)}</div>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    Base: ₹{item.basePrice.toFixed(0)} • Qty: {item.quantity}
                  </div>
                  <button onClick={() => handleRemove(item.productId)} style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#ef4444', width: 'fit-content', fontSize: '0.875rem' }}>
                    <Trash2 size={16} /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', position: 'sticky', top: '6rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Logistics</h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Delivery Address</label>
            {addresses.length > 0 ? (
              <select value={selectedAddress} onChange={e => setSelectedAddress(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '0.5rem', border: '1px solid var(--secondary-color)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}>
                <option value="">-- Choose Address --</option>
                {addresses.map(addr => (
                  <option key={addr.id} value={addr.id}>{addr.type.toUpperCase()}: {addr.street}, {addr.city}</option>
                ))}
              </select>
            ) : (
              <p style={{ fontSize: '0.875rem', color: '#ef4444', marginBottom: '0.5rem' }}>No addresses found.</p>
            )}
            <button onClick={() => setShowAddressModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary-color)', fontSize: '0.875rem', fontWeight: 500 }}>
              <Plus size={16} /> Add New Address
            </button>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Delivery Date</label>
            <input type="date" min={minDateString} value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--secondary-color)', background: 'var(--surface-color)', color: 'var(--text-primary)' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', marginBottom: '1.5rem', fontWeight: 700, fontSize: '1.25rem' }}>
            <span>Total</span>
            <span>₹{total.toFixed(0)}</span>
          </div>
          <button onClick={handleCheckout} disabled={checkingOut} className="btn-primary" style={{ width: '100%', padding: '1rem' }}>
            {checkingOut ? 'Initializing Secure Checkout...' : 'Checkout with Stripe'}
          </button>
        </div>
      </div>

      {showAddressModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass" style={{ background: 'var(--surface-color)', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '500px' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>New Address</h3>
            <form onSubmit={handleAddAddress} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <select value={newAddress.type} onChange={e=>setNewAddress({...newAddress, type: e.target.value})} style={{ padding: '0.75rem', borderRadius: '0.5rem' }}>
                <option value="home">Home</option>
                <option value="office">Office</option>
              </select>
              <input required placeholder="Street Address" value={newAddress.street} onChange={e=>setNewAddress({...newAddress, street: e.target.value})} style={{ padding: '0.75rem', borderRadius: '0.5rem' }} />
              <input required placeholder="City" value={newAddress.city} onChange={e=>setNewAddress({...newAddress, city: e.target.value})} style={{ padding: '0.75rem', borderRadius: '0.5rem' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <input required placeholder="Zip / Pin Code" value={newAddress.zipCode} onChange={handleZipCodeChange} style={{ padding: '0.75rem', borderRadius: '0.5rem' }} />
                <input required placeholder="State" value={newAddress.state} onChange={e=>setNewAddress({...newAddress, state: e.target.value})} style={{ padding: '0.75rem', borderRadius: '0.5rem' }} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowAddressModal(false)} style={{ padding: '0.75rem', borderRadius: '0.5rem', flex: 1, border: '1px solid var(--secondary-color)', color: 'var(--text-primary)' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '0.75rem', borderRadius: '0.5rem', flex: 1 }}>Save Location</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
