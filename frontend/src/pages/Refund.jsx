import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, RefreshCw } from 'lucide-react';

const Refund = () => {
  return (
    <div className="min-h-screen bg-[#0c0a1a] text-gray-300 py-24 px-6 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 mb-12 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight">Refund Policy</h1>
            <p className="text-gray-500">Last updated: May 7, 2026</p>
          </div>
        </div>

        <div className="prose prose-invert prose-violet max-w-none space-y-10 text-gray-400 leading-relaxed">

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Overview</h2>
            <p>
              Nexa.AI offers subscription plans and digital AI credits to access our website generation service. Because our service delivers digital content that is consumed immediately upon use, we have a specific refund policy outlined below.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Digital Credits and Subscriptions</h2>
            <p>
              All purchases on Nexa.AI are for <strong className="text-white">digital products</strong> — specifically AI generation credits and subscription access. These credits are consumed when you generate website designs using our AI builder.
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-4">
              <li>AI credits are non-transferable and have no cash value.</li>
              <li>Credits consumed during a generation cannot be refunded.</li>
              <li>Unused credits on a cancelled subscription are not refundable.</li>
              <li>Subscription fees are charged in advance and are non-refundable once the billing period has started.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Eligibility for Refunds</h2>
            <p>Refunds may be considered in the following limited circumstances:</p>
            <ul className="list-disc pl-5 space-y-2 mt-4">
              <li>You were charged incorrectly or twice for the same transaction.</li>
              <li>Your account was not activated after a successful payment due to a technical error on our side.</li>
              <li>You contact us within <strong className="text-white">7 days</strong> of the charge and have not used any credits from that purchase.</li>
            </ul>
            <p className="mt-4">
              Refunds are not provided for dissatisfaction with AI-generated output, as the quality of results may vary depending on your prompt and the AI model selected.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">How to Request a Refund</h2>
            <p>
              To request a refund, please email us at{' '}
              <a href="mailto:support@nexaai.live" className="text-violet-400 hover:text-violet-300">
                support@nexaai.live
              </a>{' '}
              with the following information:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-4">
              <li>Your registered email address</li>
              <li>Date of the transaction</li>
              <li>Amount charged</li>
              <li>Reason for the refund request</li>
            </ul>
            <p className="mt-4">
              We will review your request and respond within 3–5 business days.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Payment Processing</h2>
            <p>
              Payments are processed securely via Razorpay. Approved refunds will be credited back to your original payment method within 5–10 business days, depending on your bank or card issuer.
            </p>
          </section>

          <section className="border-t border-white/10 pt-8">
            <h2 className="text-xl font-semibold text-white mb-4">Questions?</h2>
            <p>
              If you have any questions about this Refund Policy, please contact us at{' '}
              <a href="mailto:support@nexaai.live" className="text-violet-400 hover:text-violet-300">
                support@nexaai.live
              </a>.
            </p>
            <div className="flex flex-wrap gap-4 mt-6">
              <Link to="/privacy" className="text-violet-400 hover:text-violet-300 transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="text-violet-400 hover:text-violet-300 transition-colors">Terms of Service</Link>
              <Link to="/contact" className="text-violet-400 hover:text-violet-300 transition-colors">Contact Us</Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Refund;
