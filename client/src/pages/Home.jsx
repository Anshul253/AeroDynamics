import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { assetUrl } from '../utils/api';
import { io } from 'socket.io-client';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    api.get('/products')
      .then(res => {
        setProducts(res.data.products);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });

    const socketUrl = 'https://aerodynamics-backendv2.onrender.com';
    const socket = io(socketUrl);
    socket.emit('join:catalog');

    socket.on('price:update', (data) => {
      setProducts(prev => prev.map(p => {
        if (p.id === data.productId) {
          const oldPrice = p.currentPrice;
          const newPrice = data.price;
          const trend = newPrice > oldPrice ? 'up' : newPrice < oldPrice ? 'down' : 'neutral';
          return { ...p, currentPrice: newPrice, _trend: trend, _animating: true };
        }
        return p;
      }));
      setTimeout(() => {
        setProducts(prev => prev.map(p => p.id === data.productId ? { ...p, _animating: false } : p));
      }, 2000);
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (products.length === 0) return;
    const maxSlides = Math.min(3, products.length);
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % maxSlides);
    }, 5000);
    return () => clearInterval(interval);
  }, [products]);

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading catalog...</div>;
  
  if (!products.length) return <div style={{ textAlign: 'center', padding: '10rem' }}>No products found.</div>;

  const maxSlides = Math.min(3, products.length);
  const featured = products.slice(0, maxSlides);
  const catalog = products.slice(maxSlides);

  return (
    <div style={{ paddingBottom: '0' }}>
      {/* 100vh Carousel Hero Section */}
      <div style={{ position: 'relative', height: '100vh', width: '100%', overflow: 'hidden' }}>
        {featured.map((slide, idx) => (
          <div key={slide.id} style={{
            position: 'absolute', inset: 0,
            opacity: idx === currentSlide ? 1 : 0,
            transition: 'opacity 1s ease-in-out',
            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', zIndex: idx === currentSlide ? 1 : 0
          }}>
            <img src={assetUrl(slide.imageUrl)} alt={slide.name} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: -2, filter: 'brightness(0.6)' }} />
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to top, rgba(11, 15, 25, 1) 0%, rgba(0,0,0,0) 30%)', zIndex: -1 }}></div>
            
            <div style={{ zIndex: 10, maxWidth: '800px', padding: '0 2rem', marginTop: '4rem' }}>
              <h1 style={{ fontSize: '4rem', fontWeight: 300, letterSpacing: '2px', color: '#fff', marginBottom: '1rem', textTransform: 'uppercase' }}>{slide.name}</h1>
              <p style={{ fontSize: '1.25rem', color: '#cbd5e1', marginBottom: '2rem', fontWeight: 300 }}>{slide.description}</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                <div className={slide._animating ? (slide._trend === 'up' ? 'price-pulse-up' : 'price-pulse-down') : ''} style={{
                  fontSize: '2.5rem', fontWeight: 300, 
                  color: slide._animating ? (slide._trend === 'up' ? 'var(--price-up)' : 'var(--price-down)') : '#fff',
                  transition: 'color 0.3s ease'
                }}>
                  ₹{slide.currentPrice.toFixed(0)} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Dynamic Market Base</span>
                </div>
                
                <Link to={`/product/${slide.id}`} style={{ background: '#fff', color: '#000', padding: '1rem 3rem', borderRadius: '3rem', fontSize: '1rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px' }} className="hover-lift">
                  Buy Now
                </Link>
              </div>
            </div>
          </div>
        ))}
        {/* Carousel Indicators */}
        <div style={{ position: 'absolute', bottom: '40px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '10px', zIndex: 10 }}>
          {featured.map((_, idx) => (
            <button key={idx} onClick={() => setCurrentSlide(idx)} style={{
              width: idx === currentSlide ? '30px' : '10px', height: '10px', borderRadius: '5px',
              backgroundColor: idx === currentSlide ? '#fff' : 'rgba(255,255,255,0.5)',
              border: 'none', cursor: 'pointer', transition: 'all 0.3s ease'
            }} />
          ))}
        </div>
      </div>

      {/* Grid Flow for Remaining Products */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(600px, 1fr))', 
        background: '#0b0f19'
      }}>
        {catalog.map((product, idx) => {
          const isHot = product.pricingFactors?.demandFactor > 1.1;
          return (
            <Link to={`/product/${product.id}`} key={product.id} style={{
              position: 'relative',
              height: '600px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '4rem',
              overflow: 'hidden',
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.02)'
            }} className="product-tile hover-lift">
              <img 
                src={assetUrl(product.imageUrl)} 
                alt={product.name} 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  zIndex: 0,
                  transition: 'transform 0.5s ease'
                }}
                className="tile-bg"
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11, 15, 25, 0.9) 0%, rgba(0,0,0,0) 60%)', zIndex: 1 }}></div>
              
              <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {isHot && (
                  <span style={{ color: 'var(--primary-color)', fontSize: '0.875rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
                    Trending Highlight
                  </span>
                )}
                <h3 style={{ fontSize: '2rem', fontWeight: 300, color: '#fff', letterSpacing: '1px' }}>{product.name}</h3>
                <div className={product._animating ? (product._trend === 'up' ? 'price-pulse-up' : 'price-pulse-down') : ''} style={{
                  fontSize: '1.5rem', 
                  fontWeight: 300, 
                  color: product._animating ? (product._trend === 'up' ? 'var(--price-up)' : 'var(--price-down)') : '#cbd5e1',
                  transition: 'color 0.3s ease'
                }}>
                  ₹{product.currentPrice.toFixed(0)}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      
      <style>{`
        .product-tile:hover .tile-bg {
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
}
