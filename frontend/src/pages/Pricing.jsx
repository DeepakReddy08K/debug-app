// frontend/src/pages/Pricing.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlans, getMyPlan, createOrder, verifyPayment } from '../services/subscription';

const Pricing = () => {
  const [plans, setPlans] = useState([]);
  const [myPlan, setMyPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allPlans, current] = await Promise.all([getPlans(), getMyPlan()]);
        setPlans(allPlans);
        setMyPlan(current);
      } catch {
        setError('Failed to load plans. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUpgrade = async (planSlug) => {
    setError(null);
    setUpgrading(planSlug);
    try {
      const order = await createOrder(planSlug);

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.body.appendChild(script);

      script.onload = () => {
        const options = {
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: 'Debug For CP',
          description: `Upgrade to ${order.planName}`,
          order_id: order.orderId,
          handler: async (response) => {
            try {
              const result = await verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planSlug,
              });
              if (result.success) {
                const updated = await getMyPlan();
                setMyPlan(updated);
                alert(`✅ ${result.message}`);
              }
            } catch {
              setError('Payment verification failed. Contact support.');
            } finally {
              setUpgrading(null);
            }
          },
          modal: { ondismiss: () => setUpgrading(null) },
          theme: { color: '#6366f1' },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      };

      script.onerror = () => {
        setError('Failed to load payment gateway. Check your connection.');
        setUpgrading(null);
      };

    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
      setUpgrading(null);
    }
  };

  const formatPrice = (paise) => {
    if (paise === 0) return 'Free';
    return `₹${(paise / 100).toFixed(0)}/mo`;
  };

  const getFeatures = (slug) => {
    switch (slug) {
      case 'free':    return ['5 runs/month', 'Free AI models', 'Basic debugging'];
      case 'pro':     return ['200 runs/month', 'Premium AI models', 'Priority support'];
      case 'premium': return ['Unlimited runs', 'Premium AI models', 'Priority support', 'Early access'];
      default:        return [];
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'var(--bg-primary)',
      }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading plans...</span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', padding: '48px 16px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Simple Pricing
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
            Start free. Upgrade when you need more.
          </p>
        </div>

        {/* Current usage bar */}
        {myPlan && (
          <div style={{
            maxWidth: '380px', margin: '0 auto 32px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px', padding: '14px 16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Current plan: <strong style={{ color: 'var(--text-primary)' }}>{myPlan.plan.name}</strong>
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {myPlan.usage.used}/{myPlan.usage.limit ?? '∞'} runs
              </span>
            </div>
            {myPlan.usage.limit && (
              <div style={{
                width: '100%', height: '4px',
                backgroundColor: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden',
              }}>
                <div style={{
                  width: `${Math.min(100, (myPlan.usage.used / myPlan.usage.limit) * 100)}%`,
                  height: '100%',
                  backgroundColor: myPlan.usage.remaining === 0 ? 'var(--danger)' : 'var(--accent)',
                  borderRadius: '2px',
                  transition: 'width 0.3s',
                }} />
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            marginBottom: '24px', textAlign: 'center',
            color: 'var(--danger)',
            backgroundColor: 'rgba(207,34,46,0.08)',
            border: '1px solid var(--danger)',
            borderRadius: '6px', padding: '10px 16px',
            fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        {/* Plan cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
        }}>
          {plans.map((plan) => {
            const isCurrent = myPlan?.plan?.slug === plan.slug;
            const isPro = plan.slug === 'pro';

            return (
              <div
                key={plan.slug}
                style={{
                  position: 'relative',
                  backgroundColor: 'var(--bg-secondary)',
                  border: `1px solid ${isPro ? 'var(--accent)' : 'var(--border-color)'}`,
                  borderRadius: '10px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                {/* Popular badge */}
                {isPro && (
                  <span style={{
                    position: 'absolute', top: '-11px',
                    left: '50%', transform: 'translateX(-50%)',
                    backgroundColor: 'var(--accent)', color: '#fff',
                    fontSize: '10px', fontWeight: 700,
                    padding: '2px 10px', borderRadius: '20px',
                    letterSpacing: '0.5px', whiteSpace: 'nowrap',
                  }}>
                    MOST POPULAR
                  </span>
                )}

                {/* Name + price */}
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                    {plan.name}
                  </h2>
                  <p style={{ fontSize: '26px', fontWeight: 800, color: 'var(--accent)', margin: '0 0 4px' }}>
                    {formatPrice(plan.price_paise)}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                    {plan.description}
                  </p>
                </div>

                {/* Features */}
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  {getFeatures(plan.slug).map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isCurrent ? (
                  <button disabled style={{
                    width: '100%', padding: '9px',
                    fontSize: '13px', fontWeight: 600,
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px', cursor: 'not-allowed',
                  }}>
                    Current Plan
                  </button>
                ) : plan.price_paise === 0 ? (
                  <button disabled style={{
                    width: '100%', padding: '9px',
                    fontSize: '13px', fontWeight: 600,
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px', cursor: 'not-allowed',
                  }}>
                    Free
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.slug)}
                    disabled={upgrading === plan.slug}
                    style={{
                      width: '100%', padding: '9px',
                      fontSize: '13px', fontWeight: 600,
                      backgroundColor: 'var(--accent)',
                      color: '#ffffff',
                      border: 'none', borderRadius: '6px',
                      cursor: upgrading === plan.slug ? 'not-allowed' : 'pointer',
                      opacity: upgrading === plan.slug ? 0.6 : 1,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    {upgrading === plan.slug ? 'Processing...' : `Upgrade to ${plan.name}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Back */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'none', border: 'none',
              color: 'var(--text-muted)', fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            ← Back to Dashboard
          </button>
        </div>

      </div>
    </div>
  );
};

export default Pricing;