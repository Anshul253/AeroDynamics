import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { AuthContext } from '../context/AuthContext';
import { ShoppingCart } from 'lucide-react';
import api, { assetUrl } from '../utils/api';
import { io } from 'socket.io-client';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [product, setProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    // Fetch product, history, and recommendations
    Promise.all([
      api.get(`/products/${id}`),
      api.get(`/products/${id}/history`),
      api.get(`/recommendations/product/${id}`)
    ]).then(([prodRes, histRes, recsRes]) => {
      setProduct(prodRes.data);
      // Format history for chart
      const formattedHistory = histRes.data.history.map(pt => ({
        time: new Date(pt.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        price: pt.price,
        basePrice: pt.basePrice
      }));
      if (formattedHistory.length === 0) {
         formattedHistory.push({ time: new Date().toLocaleTimeString(), price: prodRes.data.currentPrice, basePrice: prodRes.data.basePrice });
      }
      setHistory(formattedHistory);
      setRecommendations(recsRes.data.recommendations || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });

    // Real-time updates
    const socketUrl = 'https://aerodynamics-backendv2.onrender.com';
    const socket = io(socketUrl);
    socket.emit('join:product', id);

    socket.on('price:update', (data) => {
      if (data.productId === id) {
        setProduct(prev => ({ ...prev, currentPrice: data.price, pricingFactors: data.factors }));
        setHistory(prev => {
          const newPt = { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), price: data.price, basePrice: product?.basePrice || data.price };
          const updated = [...prev, newPt];
          return updated.slice(Math.max(updated.length - 20, 0)); // Keep last 20 pts
        });
      }
    });

    return () => socket.disconnect();
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) return navigate('/login');
    setAddingToCart(true);
    try {
      await api.post('/cart', { productId: id, quantity: 1 });
      navigate('/cart');
    } catch (err) {
      alert(err.response?.data?.error || 'Error adding to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading product insights...</div>;
  if (!product) return <div>Product not found</div>;

  return (
    <div>
      <div className="glass" style={{ borderRadius: '1rem', overflow: 'hidden', display: 'flex', flexWrap: 'wrap', marginBottom: '3rem' }}>
        <div style={{ flex: '1 1 400px', minHeight: '400px', background: 'var(--surface-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={assetUrl(product.imageUrl)} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div style={{ flex: '1 1 500px', padding: '2.5rem', display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: 'var(--primary-color)', fontWeight: 600, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {product.category}
          </span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, margin: '0.5rem 0', color: 'var(--text-primary)' }}>{product.name}</h1>
          
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', margin: '1rem 0' }}>
            <span style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              ₹{product.currentPrice.toFixed(0)}
            </span>
            <span style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', textDecoration: 'line-through' }}>
              ₹{product.basePrice.toFixed(0)}
            </span>
            {product.currentPrice < product.basePrice && (
              <span style={{ background: '#dcfce7', color: '#166534', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>
                {Math.round((1 - product.currentPrice / product.basePrice) * 100)}% OFF
              </span>
            )}
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '2rem', lineHeight: 1.6 }}>
            {product.description}
          </p>

          <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em', marginBottom: '1rem' }}>Pricing Algorithm Drivers</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Market Demand</div>
                <div style={{ fontWeight: 600 }}>{product.demandStats.viewCount24h} views / 24h</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Stock Availability</div>
                <div style={{ fontWeight: 600, color: product.stock < 10 ? '#ef4444' : 'inherit' }}>{product.stock} units remain</div>
              </div>
            </div>
          </div>

          <button onClick={handleAddToCart} disabled={addingToCart || product.stock === 0} className="btn-primary" style={{ marginTop: 'auto', padding: '1rem', fontSize: '1.1rem' }}>
            <ShoppingCart size={24} />
            {product.stock === 0 ? 'Out of Stock' : addingToCart ? 'Locking in Price...' : 'Add to Cart at Current Price'}
          </button>
        </div>
      </div>

      {/* Price History Chart */}
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>Live Price Fluctuation (7 Days)</h2>
      <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', height: '400px', marginBottom: '4rem' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis domain={['auto', 'auto']} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => '₹'+v} />
            <Tooltip 
              contentStyle={{ background: '#fff', borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(value, name) => ['₹' + Number(value).toFixed(0), name === 'price' ? 'Current Price' : 'Base Price']}
            />
            <Line type="monotone" dataKey="price" stroke="var(--primary-color)" strokeWidth={3} dot={false} activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="basePrice" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ background: 'linear-gradient(to right, #8b5cf6, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>✦ AI Recommended</span>
            Similar Products
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {recommendations.map(rec => (
              <div key={rec.id} onClick={() => navigate('/product/'+rec.id)} className="glass hover-lift" style={{ borderRadius: '0.75rem', cursor: 'pointer', overflow: 'hidden' }}>
                <div style={{ height: '150px', background: 'var(--surface-color)' }}>
                  <img src={assetUrl(rec.imageUrl)} alt={rec.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ padding: '1rem' }}>
                  <h4 style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rec.name}</h4>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>₹{rec.currentPrice.toFixed(0)}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
