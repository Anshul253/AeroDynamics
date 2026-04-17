import { useState, useEffect } from 'react';
import api, { assetUrl } from '../utils/api';
import { Package, Users, LayoutDashboard, Trash2, Plus, Edit, ClipboardList } from 'lucide-react';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showProductModal, setShowProductModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', basePrice: '', stockQuantity: '', category: '' });
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'customer' });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = () => {
    setLoading(true);
    if (activeTab === 'overview') {
      api.get('/analytics/overview').then(res => setStats(res.data)).finally(() => setLoading(false));
    } else if (activeTab === 'products') {
      api.get('/admin/products').then(res => setProducts(res.data.products)).finally(() => setLoading(false));
    } else if (activeTab === 'users') {
      api.get('/admin/users').then(res => setUsers(res.data.users)).finally(() => setLoading(false));
    } else if (activeTab === 'orders') {
      api.get('/admin/orders').then(res => setOrders(res.data.orders)).finally(() => setLoading(false));
    }
  };

  const handleStockUpdate = async (productId, newQuantity) => {
    if (isNaN(newQuantity)) return;
    try {
      await api.put(`/admin/inventory/${productId}`, { quantity: parseInt(newQuantity) });
      fetchData();
    } catch (err) {
      alert('Failed to update stock');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      const res = await api.delete(`/admin/products/${id}`);
      alert(res.data.message);
      fetchData();
    } catch (err) { alert('Failed to delete product.'); }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/products', newProduct);
      setShowProductModal(false);
      setNewProduct({ name: '', basePrice: '', stockQuantity: '', category: '' });
      fetchData();
    } catch (err) { alert('Failed to create product.'); }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      const res = await api.delete(`/admin/users/${id}`);
      alert(res.data.message);
      fetchData();
    } catch (err) { alert(err.response?.data?.error || 'Failed to delete user.'); }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/users', newUser);
      setShowUserModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'customer' });
      fetchData();
    } catch (err) { alert('Failed to create user.'); }
  };

  if (loading && !stats && !products.length && !users.length) return <div style={{padding: '2rem'}}>Loading admin interface...</div>;

  return (
    <div className="container" style={{ paddingTop: '8rem', paddingBottom: '4rem', paddingLeft: '1.5rem', paddingRight: '1.5rem', minHeight: '100vh', display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem' }}>
      
      {/* Sidebar Navigation */}
      <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', height: 'fit-content' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '2rem' }}>Admin Panel</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button onClick={() => setActiveTab('overview')} className={`btn-${activeTab === 'overview' ? 'primary' : 'secondary'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-start', border: 'none', background: activeTab==='overview'?'':'transparent', color: activeTab==='overview'?'':'var(--text-primary)' }}>
            <LayoutDashboard size={20} /> Overview
          </button>
          <button onClick={() => setActiveTab('products')} className={`btn-${activeTab === 'products' ? 'primary' : 'secondary'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-start', border: 'none', background: activeTab==='products'?'':'transparent', color: activeTab==='products'?'':'var(--text-primary)' }}>
            <Package size={20} /> Inventory & Products
          </button>
          <button onClick={() => setActiveTab('users')} className={`btn-${activeTab === 'users' ? 'primary' : 'secondary'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-start', border: 'none', background: activeTab==='users'?'':'transparent', color: activeTab==='users'?'':'var(--text-primary)' }}>
            <Users size={20} /> Manage Users
          </button>
          <button onClick={() => setActiveTab('orders')} className={`btn-${activeTab === 'orders' ? 'primary' : 'secondary'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-start', border: 'none', background: activeTab==='orders'?'':'transparent', color: activeTab==='orders'?'':'var(--text-primary)' }}>
            <ClipboardList size={20} /> Fulfillment & Orders
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <div>
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>Dashboard Overview</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
              <div className="glass shadow-dynamic" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Revenue</p>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>₹{stats?.totalRevenue?.toFixed(0) || 0}</h3>
              </div>
              <div className="glass shadow-dynamic" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Orders</p>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats?.totalOrders || 0}</h3>
              </div>
              <div className="glass shadow-dynamic" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Users</p>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats?.totalUsers || 2}</h3>
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>Product Management</h2>
              <button onClick={() => setShowProductModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={20} /> Add Product
              </button>
            </div>
            
            <div className="glass shadow-dynamic" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.05)', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                    <th style={{ padding: '1rem' }}>Product</th>
                    <th style={{ padding: '1rem' }}>Base Price</th>
                    <th style={{ padding: '1rem' }}>Stock</th>
                    <th style={{ padding: '1rem' }}>Status</th>
                    <th style={{ padding: '1rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <img src={assetUrl(p.imageUrl)} alt={p.name} style={{ width: '40px', height: '40px', borderRadius: '0.5rem', objectFit: 'cover' }} />
                        <span style={{ fontWeight: 500 }}>{p.name}</span>
                      </td>
                      <td style={{ padding: '1rem' }}>₹{p.basePrice}</td>
                      <td style={{ padding: '1rem' }}>
                        <input 
                          type="number" 
                          defaultValue={p.inventory?.quantity} 
                          onBlur={(e) => handleStockUpdate(p.id, e.target.value)}
                          style={{ width: '70px', padding: '0.25rem', borderRadius: '0.25rem', border: '1px solid #ccc' }}
                        />
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ padding: '0.25rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', background: p.isActive ? '#dcfce7' : '#fee2e2', color: p.isActive ? '#166534' : '#991b1b' }}>
                          {p.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <button onClick={() => handleDeleteProduct(p.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}>
                          <Trash2 size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add Product Modal */}
            {showProductModal && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
                <div className="glass" style={{ background: 'var(--surface-color)', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '500px' }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Add New Product</h3>
                  <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input required placeholder="Product Name" value={newProduct.name} onChange={e=>setNewProduct({...newProduct, name: e.target.value})} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }} />
                    <input required type="number" placeholder="Base Price (₹)" value={newProduct.basePrice} onChange={e=>setNewProduct({...newProduct, basePrice: e.target.value})} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }} />
                    <input required type="number" placeholder="Initial Stock Quantity" value={newProduct.stockQuantity} onChange={e=>setNewProduct({...newProduct, stockQuantity: e.target.value})} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }} />
                    <input placeholder="Category" value={newProduct.category} onChange={e=>setNewProduct({...newProduct, category: e.target.value})} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }} />
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                      <button type="button" onClick={() => setShowProductModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                      <button type="submit" className="btn-primary" style={{ flex: 1 }}>Create</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>User Management</h2>
              <button onClick={() => setShowUserModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={20} /> Create User
              </button>
            </div>

            <div className="glass shadow-dynamic" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.05)', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                    <th style={{ padding: '1rem' }}>Name</th>
                    <th style={{ padding: '1rem' }}>Email</th>
                    <th style={{ padding: '1rem' }}>Role</th>
                    <th style={{ padding: '1rem' }}>Total Orders</th>
                    <th style={{ padding: '1rem' }}>Joined</th>
                    <th style={{ padding: '1rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <td style={{ padding: '1rem', fontWeight: 500 }}>{u.name}</td>
                      <td style={{ padding: '1rem' }}>{u.email}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ padding: '0.25rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', background: u.role === 'admin' ? '#dbeafe' : '#f3f4f6', color: u.role === 'admin' ? '#1e40af' : '#374151' }}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>{u.totalOrders}</td>
                      <td style={{ padding: '1rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '1rem' }}>
                        <button onClick={() => handleDeleteUser(u.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}>
                          <Trash2 size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Create User Modal */}
            {showUserModal && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
                <div className="glass" style={{ background: 'var(--surface-color)', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '500px' }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Create New User</h3>
                  <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input required placeholder="Full Name" value={newUser.name} onChange={e=>setNewUser({...newUser, name: e.target.value})} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }} />
                    <input required type="email" placeholder="Email Address" value={newUser.email} onChange={e=>setNewUser({...newUser, email: e.target.value})} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }} />
                    <input required type="password" placeholder="Password" value={newUser.password} onChange={e=>setNewUser({...newUser, password: e.target.value})} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }} />
                    <select required value={newUser.role} onChange={e=>setNewUser({...newUser, role: e.target.value})} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}>
                      <option value="customer">Customer</option>
                      <option value="admin">Administrator</option>
                    </select>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                      <button type="button" onClick={() => setShowUserModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                      <button type="submit" className="btn-primary" style={{ flex: 1 }}>Create</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>Order Fulfillment</h2>
            </div>

            <div className="glass shadow-dynamic" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.05)', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                    <th style={{ padding: '1rem' }}>Order ID</th>
                    <th style={{ padding: '1rem' }}>Customer</th>
                    <th style={{ padding: '1rem' }}>Delivery Address</th>
                    <th style={{ padding: '1rem' }}>Target Date</th>
                    <th style={{ padding: '1rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 && <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>No orders found.</td></tr>}
                  {orders.map(o => (
                    <tr key={o.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <td style={{ padding: '1rem', fontSize: '0.875rem' }}>...{o.id.slice(-6)}<br/><span style={{ color: 'var(--text-secondary)' }}>₹{o.totalAmount}</span></td>
                      <td style={{ padding: '1rem', fontWeight: 500 }}>{o.user?.name}<br/><span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400 }}>{o.user?.email}</span></td>
                      <td style={{ padding: '1rem' }}>
                        {o.address ? (
                          <div style={{ fontSize: '0.875rem' }}>
                            <strong style={{ textTransform: 'uppercase', color: 'var(--primary-color)' }}>{o.address.type}</strong><br/>
                            {o.address.street}<br/>
                            {o.address.city}, {o.address.state} {o.address.zipCode}
                          </div>
                        ) : <span style={{ color: '#ef4444' }}>No Address</span>}
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>
                        {o.deliveryDate ? new Date(o.deliveryDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ padding: '0.25rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', background: o.status === 'paid' ? '#dcfce7' : '#fef3c7', color: o.status === 'paid' ? '#166534' : '#92400e', textTransform: 'uppercase' }}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
