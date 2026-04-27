import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Eye, FileText, ChevronLeft } from 'lucide-react';
import { Button } from '../components/ui/button';

const Privacy = () => {
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
            <Shield className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight">Privacy Policy</h1>
            <p className="text-gray-500">Last updated: April 27, 2026</p>
          </div>
        </div>

        <div className="prose prose-invert prose-violet max-w-none space-y-12 text-gray-400 leading-relaxed">
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-5 h-5 text-violet-400" />
              <h2 className="text-2xl font-semibold text-white m-0">Introduction</h2>
            </div>
            <p>
              At Nexa.AI, we value your privacy. This policy explains how we collect, use, and protect your data when you use our AI web building engine. By using Nexa.AI, you agree to the terms outlined in this document.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-violet-400" />
              <h2 className="text-2xl font-semibold text-white m-0">Information We Collect</h2>
            </div>
            <ul className="space-y-4 list-none p-0">
              <li className="bg-white/5 border border-white/10 rounded-xl p-5">
                <strong className="text-white block mb-1">Account Data</strong>
                When you sign up via Google, we receive your email address, name, and profile picture. This is used solely to identify your account and personalize your dashboard.
              </li>
              <li className="bg-white/5 border border-white/10 rounded-xl p-5">
                <strong className="text-white block mb-1">Generation Data</strong>
                The prompts you enter and the websites you generate are stored in our database so you can access and download them later.
              </li>
              <li className="bg-white/5 border border-white/10 rounded-xl p-5">
                <strong className="text-white block mb-1">Payment Data</strong>
                Payment processing is handled by Razorpay. Nexa.AI does not store your credit card or bank details on our servers.
              </li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-5 h-5 text-violet-400" />
              <h2 className="text-2xl font-semibold text-white m-0">How We Use Your Data</h2>
            </div>
            <p>We use your information to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Provide and maintain the Nexa.AI service.</li>
              <li>Process payments and manage your credit balance.</li>
              <li>Communicate important updates regarding your account.</li>
              <li>Improve our AI models and user experience.</li>
            </ul>
          </section>

          <section className="bg-gradient-to-r from-violet-600/10 to-transparent border-l-2 border-violet-500 p-8 rounded-r-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Google User Data</h2>
            <p className="m-0 italic">
              Nexa.AI's use and transfer to any other app of information received from Google APIs will adhere to the Google API Service User Data Policy, including the Limited Use requirements. We do not sell your personal data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure. We strive to use commercially acceptable means to protect your personal information but cannot guarantee absolute security.
            </p>
          </section>

          <section className="border-t border-white/10 pt-12 text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">Questions?</h2>
            <p className="mb-8">If you have any questions about this Privacy Policy, please contact us.</p>
            <Button className="bg-white/10 hover:bg-white/15 text-white rounded-full px-8 border border-white/10">
              Contact Support
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
