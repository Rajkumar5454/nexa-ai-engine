import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Sparkles, Zap, Crown, Rocket, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const tiers = [
  {
    id: 'free',
    name: 'Starter',
    tagline: 'For curious builders',
    price: '₹0',
    period: 'forever',
    icon: Sparkles,
    accent: 'from-gray-500 to-gray-700',
    border: 'border-white/10',
    features: [
      '100 AI credits / month',
      '3 active projects',
      'GPT-4o-mini generation',
      'Live preview + code editor',
      'Download project as ZIP',
      'Community support',
    ],
    cta: 'Start Free',
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For solo creators',
    price: '₹500',
    period: '/ month',
    icon: Zap,
    accent: 'from-violet-500 to-blue-500',
    border: 'border-violet-500/60',
    features: [
      '1,500 AI credits / month',
      'Unlimited projects',
      'GPT-5.5 & GPT-5.4 Access',
      'Gemini 1.5 Pro & Flash',
      'Cofounder Audit mode',
      'Email support',
    ],
    cta: 'Upgrade to Pro',
    highlight: true,
    badge: 'Most Popular',
  },
  {
    id: 'business',
    name: 'Business',
    tagline: 'For growing startups',
    price: '₹1,000',
    period: '/ month',
    icon: Crown,
    accent: 'from-indigo-500 to-fuchsia-500',
    border: 'border-white/10',
    features: [
      '4,000 AI credits / month',
      'Everything in Pro',
      'Claude 3.5 Sonnet Support',
      'GitHub / Figma import',
      'Custom brand colors',
      'Priority email + chat support',
    ],
    cta: 'Upgrade to Business',
    highlight: false,
  },
  {
    id: 'agency',
    name: 'Agency',
    tagline: 'For teams shipping at scale',
    price: '₹2,000',
    period: '/ month',
    icon: Rocket,
    accent: 'from-amber-500 to-pink-500',
    border: 'border-white/10',
    features: [
      '10,000 AI credits / month',
      'Everything in Business',
      'Claude 4.7 Opus (Coming Soon)',
      'White-label exports',
      'Private GitHub integration',
      'Dedicated account manager',
      'SLA + 24/7 support',
    ],
    cta: 'Upgrade to Agency',
    highlight: false,
  },
];

const faqs = [
  { q: 'What is an AI credit?', a: 'One credit ≈ one AI request (generate a project, modify code, run an audit). Typical small changes cost 1 credit; full-app generation costs 3–5 credits.' },
  { q: 'Can I change plans anytime?', a: 'Yes — upgrade, downgrade or cancel anytime. Unused credits roll over for 30 days on paid plans.' },
  { q: 'Do I own the code I generate?', a: '100%. Everything you build is yours — download it, deploy it, resell it. No royalties, no lock-in.' },
  { q: 'How does payment work?', a: 'We use Razorpay for secure payments in India and Stripe for international cards. Invoices are generated automatically.' },
];

const Pricing = () => {
  const navigate = useNavigate();
  const { user, token, applySession } = useAuth();
  const { toast } = useToast();
  const [loadingTier, setLoadingTier] = React.useState(null);
  const [billingType, setBillingType] = React.useState('monthly'); // 'monthly' or 'packs'

  const refreshUser = async () => {
    try {
      const { data } = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      applySession(token, data);
    } catch {
      /* non-fatal */
    }
  };

  const handleCta = async (tier) => {
    if (tier.id === 'free') {
      navigate(user ? '/dashboard' : '/signup');
      return;
    }
    if (!user) {
      navigate('/signup', { state: { next: '/pricing' } });
      return;
    }

    setLoadingTier(tier.id);
    try {
      const scriptOk = await loadRazorpayScript();
      if (!scriptOk) {
        toast({ title: 'Razorpay failed to load', description: 'Check your internet connection', variant: 'destructive' });
        return;
      }

      const { data: order } = await axios.post(
        `${API}/payments/create-order`,
        { plan_id: tier.id },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'Nexa.AI',
        description: `${tier.name} — ${order.plan.credits.toLocaleString()} credits`,
        order_id: order.order_id,
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: { color: '#7c3aed' },
        handler: async (response) => {
          try {
            const { data: verify } = await axios.post(
              `${API}/payments/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan_id: tier.id,
              },
              { headers: { Authorization: `Bearer ${token}` } },
            );
            await refreshUser();
            toast({
              title: `Success!`,
              description: `${verify.credits_added.toLocaleString()} credits added. New balance: ${verify.credits.toLocaleString()}`,
            });
            navigate('/dashboard');
          } catch (err) {
            toast({
              title: 'Payment verification failed',
              description: err.response?.data?.detail || 'Please contact support',
              variant: 'destructive',
            });
          }
        },
        modal: {
          ondismiss: () => setLoadingTier(null),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        toast({
          title: 'Payment failed',
          description: resp.error?.description || 'Please try again',
          variant: 'destructive',
        });
      });
      rzp.open();
    } catch (err) {
      toast({
        title: 'Checkout error',
        description: err.response?.data?.detail || err.message || 'Could not start checkout',
        variant: 'destructive',
      });
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0c0a1a] via-[#0f0d24] to-[#0a0a1a] text-white relative" data-testid="pricing-page">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-600/8 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 backdrop-blur-xl bg-[#0c0a1a]/60">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/nexa-logo-tight.png" alt="Nexa.AI" className="h-10 w-auto object-contain" />
            <span className="text-xl font-bold tracking-tight">
              <span className="text-white">Nexa</span>
              <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent"> AI</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/pricing" className="text-sm text-white font-medium">Pricing</Link>
            {user ? (
              <Button onClick={() => navigate('/dashboard')} className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 rounded-full px-5">
                Dashboard
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/login')} className="text-gray-400 hover:text-white">
                  Sign in
                </Button>
                <Button onClick={() => navigate('/signup')} className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 rounded-full px-5">
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 pt-32 pb-24">
        <div className="container mx-auto px-6">
          {/* Hero */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs uppercase tracking-wider text-violet-300 mb-6">
              <Sparkles className="w-3.5 h-3.5" /> Simple, honest pricing
            </span>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-5">
              Build more.{' '}
              <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">Pay less.</span>
            </h1>
            <p className="text-lg text-gray-400 mb-10">
              Start free. Upgrade when your ideas outgrow the starter plan. Cancel anytime.
            </p>

            {/* TOGGLE SWITCH */}
            <div className="flex items-center justify-center gap-4 mb-16">
              <span className={`text-sm font-medium ${billingType === 'monthly' ? 'text-white' : 'text-gray-500'}`}>Monthly Plans</span>
              <button 
                onClick={() => setBillingType(billingType === 'monthly' ? 'packs' : 'monthly')}
                className="w-14 h-7 rounded-full bg-white/10 p-1 relative flex items-center transition-colors hover:bg-white/15"
              >
                <div className={`w-5 h-5 rounded-full bg-violet-500 shadow-lg transform transition-transform duration-200 ease-in-out ${billingType === 'packs' ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
              <span className={`text-sm font-medium ${billingType === 'packs' ? 'text-white' : 'text-gray-500'}`}>One-time Packs</span>
            </div>
          </div>

          {/* Conditional Rendering */}
          {billingType === 'monthly' ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              {tiers.map((tier) => {
                const Icon = tier.icon;
                return (
                  <div
                    key={tier.id}
                    className={`relative rounded-2xl border ${tier.border} bg-white/[0.03] backdrop-blur-xl p-8 flex flex-col ${
                      tier.highlight ? 'md:scale-[1.03] shadow-2xl shadow-violet-600/20' : ''
                    }`}
                  >
                    {tier.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-gradient-to-r from-violet-500 to-blue-500 text-white shadow-lg">
                        {tier.badge}
                      </div>
                    )}
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${tier.accent} flex items-center justify-center mb-5`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-1">{tier.name}</h3>
                    <p className="text-sm text-gray-400 mb-6">{tier.tagline}</p>
                    <div className="mb-6">
                      <span className="text-4xl font-bold">{tier.price}</span>
                      {tier.period && <span className="text-gray-500 ml-1">{tier.period}</span>}
                    </div>
                    <ul className="space-y-3 mb-8 flex-1">
                      {tier.features.map((f) => (
                        <li key={f} className="flex items-start gap-3 text-sm text-gray-300">
                          <Check className="w-4 h-4 mt-0.5 text-violet-400 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={() => handleCta(tier)}
                      disabled={loadingTier === tier.id}
                      className={`w-full rounded-xl font-semibold ${
                        tier.highlight
                          ? 'bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white'
                          : 'bg-white/10 hover:bg-white/15 text-white'
                      }`}
                    >
                      {loadingTier === tier.id ? 'Opening…' : tier.cta}
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              {[
                { id: 'pack_100', name: '100 Credits', price: '₹99', description: 'Perfect for a few quick edits', icon: Zap, accent: 'from-blue-500/20 to-transparent' },
                { id: 'pack_500', name: '500 Credits', price: '₹399', description: 'Great for a full new project', icon: Rocket, accent: 'from-violet-500/20 to-transparent', popular: true },
                { id: 'pack_1000', name: '1,000 Credits', price: '₹749', description: 'Best value for serious builders', icon: Crown, accent: 'from-amber-500/20 to-transparent' },
              ].map((pack) => {
                const Icon = pack.icon;
                return (
                  <div key={pack.id} className={`relative rounded-2xl border border-white/10 bg-white/[0.02] p-8 flex flex-col items-center text-center transition-all hover:bg-white/[0.05] group ${pack.popular ? 'ring-1 ring-violet-500/50 bg-violet-500/5 shadow-2xl shadow-violet-500/10' : ''}`}>
                    {pack.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-600 text-white">
                        Best Value
                      </div>
                    )}
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-b ${pack.accent} border border-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-violet-400" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{pack.name}</h3>
                    <p className="text-sm text-gray-500 mb-8">{pack.description}</p>
                    <div className="text-4xl font-bold mb-8">{pack.price}</div>
                    <Button 
                      onClick={() => handleCta(pack)}
                      disabled={loadingTier === pack.id}
                      className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-semibold py-6"
                    >
                      {loadingTier === pack.id ? 'Opening…' : 'Get Credits'}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* FAQ */}
          <div className="max-w-3xl mx-auto mt-24">
            <h2 className="text-3xl font-bold text-center mb-10">Questions, answered</h2>
            <div className="space-y-4">
              {faqs.map((f) => (
                <details key={f.q} className="group rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex items-center justify-between cursor-pointer text-white font-medium">
                    {f.q}
                    <span className="text-violet-400 text-xl group-open:rotate-45 transition-transform">+</span>
                  </summary>
                  <p className="mt-3 text-gray-400 text-sm leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </div>

          {/* Closing CTA */}
          <div className="max-w-4xl mx-auto mt-24 rounded-2xl border border-white/10 bg-gradient-to-br from-violet-600/20 to-blue-600/10 p-10 text-center">
            <h2 className="text-3xl font-bold mb-3">Ready to ship something new?</h2>
            <p className="text-gray-300 mb-6">Start free. No credit card. Build your first app in 60 seconds.</p>
            <Button
              onClick={() => navigate(user ? '/ide' : '/signup')}
              className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white rounded-full px-8 py-6 text-base font-semibold shadow-xl shadow-violet-600/30"
              data-testid="pricing-bottom-cta"
            >
              Start building for free <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Pricing;
