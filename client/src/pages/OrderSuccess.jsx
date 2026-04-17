import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { CheckCircle, XCircle } from 'lucide-react';

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      setErrorMsg('No session ID found.');
      return;
    }

    api.post('/orders/verify', { sessionId })
      .then((res) => {
        if (res.data.status === 'paid') {
          setStatus('success');
        } else {
          setStatus('error');
          setErrorMsg('Payment could not be verified.');
        }
      })
      .catch((err) => {
        setStatus('error');
        setErrorMsg(err.response?.data?.error || 'Verification encountered an error.');
      });
  }, [sessionId]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem 0' }}>
      <div className="glass shadow-dynamic" style={{ background: 'var(--surface-color)', padding: '3rem', borderRadius: '1.5rem', textAlign: 'center', maxWidth: '500px', width: '100%' }}>
        {status === 'verifying' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Verifying Payment...</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Please wait while we confirm your dynamic price lock with Stripe.</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981', marginBottom: '1rem' }}>Payment Successful!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.1rem' }}>
              Your order has been officially placed. Your dynamically adjusted price has been permanently locked in!
            </p>
            <Link to="/orders" className="btn-primary" style={{ width: '100%' }}>
              View Your Orders
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div>
            <XCircle size={64} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#ef4444', marginBottom: '1rem' }}>Payment Failed</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.1rem' }}>
              {errorMsg}
            </p>
            <button onClick={() => navigate('/cart')} className="btn-secondary" style={{ width: '100%' }}>
              Return to Cart
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
