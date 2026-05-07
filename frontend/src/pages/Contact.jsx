import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Mail, MessageSquare, Clock } from 'lucide-react';

const Contact = () => {
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
            <MessageSquare className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight">Contact Us</h1>
            <p className="text-gray-500">We're here to help</p>
          </div>
        </div>

        <div className="prose prose-invert prose-violet max-w-none space-y-10 text-gray-400 leading-relaxed">

          <section className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <h2 className="text-2xl font-semibold text-white mb-4">About Nexa.AI</h2>
            <p>
              Nexa.AI is an AI-powered website generation platform that helps users create frontend website designs from text prompts. Nexa.AI is currently in beta. We help individuals, freelancers, and small businesses generate modern website layouts quickly using AI.
            </p>
          </section>

          <section className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Mail className="w-5 h-5 text-violet-400" />
              <h2 className="text-2xl font-semibold text-white m-0">Email Support</h2>
            </div>
            <p className="mb-4">
              For all support requests, billing questions, account issues, or general inquiries, please contact us at:
            </p>
            <a
              href="mailto:support@nexaai.live"
              className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 text-lg font-semibold transition-colors"
            >
              <Mail className="w-5 h-5" />
              support@nexaai.live
            </a>
          </section>

          <section className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-5 h-5 text-violet-400" />
              <h2 className="text-2xl font-semibold text-white m-0">Response Time</h2>
            </div>
            <p>
              We aim to respond to all inquiries within 24–48 business hours. For billing or account-related matters, please include your registered email address in your message so we can assist you faster.
            </p>
          </section>

          <section className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Business Information</h2>
            <address className="not-italic space-y-2">
              <p><span className="text-white font-medium">Product:</span> Nexa.AI</p>
              <p><span className="text-white font-medium">Website:</span> <a href="https://nexaai.live" className="text-violet-400 hover:text-violet-300">https://nexaai.live</a></p>
              <p><span className="text-white font-medium">Email:</span> <a href="mailto:support@nexaai.live" className="text-violet-400 hover:text-violet-300">support@nexaai.live</a></p>
              <p><span className="text-white font-medium">Status:</span> Currently in Beta</p>
            </address>
          </section>

          <section className="border-t border-white/10 pt-8">
            <h2 className="text-xl font-semibold text-white mb-4">Other Resources</h2>
            <div className="flex flex-wrap gap-4">
              <Link to="/pricing" className="text-violet-400 hover:text-violet-300 transition-colors">Pricing</Link>
              <Link to="/privacy" className="text-violet-400 hover:text-violet-300 transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="text-violet-400 hover:text-violet-300 transition-colors">Terms of Service</Link>
              <Link to="/refund" className="text-violet-400 hover:text-violet-300 transition-colors">Refund Policy</Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Contact;
