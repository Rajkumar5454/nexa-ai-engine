import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Eye, FileText, ChevronLeft, Cookie, Share2 } from 'lucide-react';

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
            <p className="text-gray-500">Last updated: May 07, 2026</p>
          </div>
        </div>

        <div className="prose prose-invert prose-violet max-w-none space-y-12 text-gray-400 leading-relaxed">
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-5 h-5 text-violet-400" />
              <h2 className="text-2xl font-semibold text-white m-0">Introduction</h2>
            </div>
            <p>
              At Nexa.AI, accessible from https://nexaai.live, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Nexa.AI and how we use it.
            </p>
            <p>
              If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us. This Privacy Policy applies only to our online activities and is valid for visitors to our website with regards to the information that they shared and/or collect in Nexa.AI.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-violet-400" />
              <h2 className="text-2xl font-semibold text-white m-0">Information We Collect</h2>
            </div>
            <p className="mb-6">The personal information that you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information.</p>
            <ul className="space-y-4 list-none p-0">
              <li className="bg-white/5 border border-white/10 rounded-xl p-5">
                <strong className="text-white block mb-1">Account Information</strong>
                When you register for an Account, we may ask for your contact information, including items such as name, email address, and profile picture (via Google OAuth).
              </li>
              <li className="bg-white/5 border border-white/10 rounded-xl p-5">
                <strong className="text-white block mb-1">Service Usage Data</strong>
                We collect the prompts you enter and the website designs you generate to provide you with the core functionality of our AI engine and allow you to retrieve your projects.
              </li>
              <li className="bg-white/5 border border-white/10 rounded-xl p-5">
                <strong className="text-white block mb-1">Log Files</strong>
                Nexa.AI follows a standard procedure of using log files. These files log visitors when they visit websites. The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable.
              </li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Cookie className="w-5 h-5 text-violet-400" />
              <h2 className="text-2xl font-semibold text-white m-0">Cookies and Web Beacons</h2>
            </div>
            <p>
              Like any other website, Nexa.AI uses 'cookies'. These cookies are used to store information including visitors' preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users' experience by customizing our web page content based on visitors' browser type and/or other information.
            </p>
            <div className="bg-violet-600/10 border border-violet-500/20 rounded-xl p-6 mt-4">
              <h3 className="text-lg font-bold text-white mb-2">Google DoubleClick DART Cookie</h3>
              <p className="text-sm m-0">
                Google is one of a third-party vendor on our site. It also uses cookies, known as DART cookies, to serve ads to our site visitors based upon their visit to www.website.com and other sites on the internet. However, visitors may choose to decline the use of DART cookies by visiting the Google ad and content network Privacy Policy at the following URL – <a href="https://policies.google.com/technologies/ads" className="text-violet-400 hover:underline">https://policies.google.com/technologies/ads</a>
              </p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Share2 className="w-5 h-5 text-violet-400" />
              <h2 className="text-2xl font-semibold text-white m-0">Advertising Partners Privacy Policies</h2>
            </div>
            <p>
              Third-party ad servers or ad networks uses technologies like cookies, JavaScript, or Web Beacons that are used in their respective advertisements and links that appear on Nexa.AI, which are sent directly to users' browser. They automatically receive your IP address when this occurs. These technologies are used to measure the effectiveness of their advertising campaigns and/or to personalize the advertising content that you see on websites that you visit.
            </p>
            <p>
              Note that Nexa.AI has no access to or control over these cookies that are used by third-party advertisers.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-5 h-5 text-violet-400" />
              <h2 className="text-2xl font-semibold text-white m-0">Third Party Privacy Policies</h2>
            </div>
            <p>
              Nexa.AI's Privacy Policy does not apply to other advertisers or websites. Thus, we are advising you to consult the respective Privacy Policies of these third-party ad servers for more detailed information. It may include their practices and instructions about how to opt-out of certain options.
            </p>
            <p>
              You can choose to disable cookies through your individual browser options. To know more detailed information about cookie management with specific web browsers, it can be found at the browsers' respective websites.
            </p>
          </section>

          <section className="bg-gradient-to-r from-violet-600/10 to-transparent border-l-2 border-violet-500 p-8 rounded-r-2xl">
            <h2 className="text-xl font-bold text-white mb-4">GDPR & CCPA Rights</h2>
            <p className="m-0">
              We would like to make sure you are fully aware of all of your data protection rights. Every user is entitled to the following:
            </p>
            <ul className="list-disc pl-5 mt-4 space-y-2 text-sm">
              <li><strong>The right to access</strong> – You have the right to request copies of your personal data.</li>
              <li><strong>The right to rectification</strong> – You have the right to request that we correct any information you believe is inaccurate.</li>
              <li><strong>The right to erasure</strong> – You have the right to request that we erase your personal data, under certain conditions.</li>
              <li><strong>The right to restrict processing</strong> – You have the right to request that we restrict the processing of your personal data, under certain conditions.</li>
            </ul>
          </section>

          <section className="border-t border-white/10 pt-12 text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">Questions?</h2>
            <p className="mb-8">If you have any questions about this Privacy Policy, please contact us.</p>
            <Link to="/contact">
              <button className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 px-8 rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg shadow-violet-600/20">
                Contact Support
              </button>
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
