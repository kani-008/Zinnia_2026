import React, { useState } from 'react';
import { WebsiteNavbar } from '../components/layout/Navbar';
import { WebsiteFooter } from '../components/layout/Footer';
import { audioManager } from '../core/AudioManager';
import { Phone, Mail, MapPin, Send, CheckCircle2, Navigation, MessageSquare, Clock } from 'lucide-react';

export const WebsiteContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    audioManager.playBlip();
    setSubmitted(true);
  };

  return (
    <div className="relative w-screen min-h-screen overflow-x-hidden bg-[#0D0D0F] text-[#F2F2F0] font-sans flex flex-col justify-between">
      {/* Top Navbar */}
      <WebsiteNavbar />

      <main className="relative z-20 max-w-7xl mx-auto w-full pt-28 pb-16 px-4 sm:px-6 lg:px-8 flex-1">
        {/* Page Header */}
        <div className="text-center space-y-3 mb-12">
          <div className="inline-block relative">
            <span className="px-4 py-1 bg-[#F5D90A] text-black font-sans font-black text-xs sm:text-sm uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_#000000] -rotate-1 inline-block">
              COMMUNICATION HUB
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl uppercase tracking-tight text-white">
            CONTACT <span className="text-[#00E5FF]">US</span>
          </h1>
          <p className="font-mono text-xs sm:text-sm text-zinc-400 max-w-2xl mx-auto">
            Got questions about ZINNIA '26 event rules, schedule, registrations, or campus directions? Reach out to the organizing team!
          </p>
        </div>

        {/* 2-Column Comic Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Contact Coordinates & Team (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Campus & Institution Info Card */}
            <div className="bg-[#121217] border-2 border-[#2E2E38] rounded-xl p-6 shadow-[4px_4px_0px_#000000] relative overflow-hidden">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[#F5D90A] text-black flex items-center justify-center font-black">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-comic font-black text-lg text-white uppercase tracking-wide">
                    CAMPUS HEADQUARTERS
                  </h3>
                  <p className="font-mono text-xs text-[#00E5FF]">Government College of Engineering, Erode</p>
                </div>
              </div>

              <div className="space-y-2 text-xs font-mono text-zinc-300 leading-relaxed border-t border-[#27272A] pt-4">
                <p className="font-bold text-white">Department of Computer Science &amp; Engineering</p>
                <p>NH-544 (Salem-Cochin National Highway), Chithode,</p>
                <p>Erode - 638316, Tamil Nadu, India</p>
              </div>

              <div className="mt-4 pt-4 border-t border-[#27272A] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Clock className="w-4 h-4 text-[#F5D90A] shrink-0" />
                  <span>Symposium Date: Sep 24, 2026</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <Navigation className="w-4 h-4 text-[#00E5FF] shrink-0" />
                  <span>~14 km from Erode Central Bus Stand</span>
                </div>
              </div>
            </div>

            {/* Coordinators Hotline Card */}
            <div className="bg-[#121217] border-2 border-[#2E2E38] rounded-xl p-6 shadow-[4px_4px_0px_#000000]">
              <h3 className="font-comic font-black text-lg text-white uppercase tracking-wide mb-4 flex items-center gap-2">
                <span className="text-[#FF2E63]">⚡</span>
                <span>ORGANIZING COMMITTEE</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                {/* Staff Lead */}
                <div className="p-4 bg-[#181820] border border-[#33333E] rounded-lg space-y-1.5">
                  <span className="text-[10px] text-[#F5D90A] font-bold tracking-widest uppercase">
                    STAFF CONVENER
                  </span>
                  <h4 className="font-bold text-sm text-white">Dr. A. Senthil Kumar</h4>
                  <p className="text-zinc-400 text-[11px]">Professor &amp; Head, Dept of CSE</p>
                  <a href="tel:+919840123456" className="inline-flex items-center gap-1.5 text-[#00E5FF] hover:underline pt-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span>+91 98401 23456</span>
                  </a>
                </div>

                {/* Student Convener */}
                <div className="p-4 bg-[#181820] border border-[#33333E] rounded-lg space-y-1.5">
                  <span className="text-[10px] text-[#00E5FF] font-bold tracking-widest uppercase">
                    STUDENT CONVENER
                  </span>
                  <h4 className="font-bold text-sm text-white">R. Kanishkar</h4>
                  <p className="text-zinc-400 text-[11px]">Final Year CSE &bull; Student Lead</p>
                  <a href="tel:+919445198765" className="inline-flex items-center gap-1.5 text-[#00E5FF] hover:underline pt-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span>+91 94451 98765</span>
                  </a>
                </div>
              </div>

              {/* Direct Mail & Helpline */}
              <div className="mt-4 pt-4 border-t border-[#27272A] flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
                <a 
                  href="mailto:zinnia26@gceerode.ac.in" 
                  className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#1E1E28] border border-[#33333E] flex items-center justify-center text-[#FF2E63]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase">Official Inquiries</p>
                    <p className="font-bold text-[#FF2E63]">zinnia26@gceerode.ac.in</p>
                  </div>
                </a>

                <a 
                  href="tel:+911234567890" 
                  className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#1E1E28] border border-[#33333E] flex items-center justify-center text-[#00E5FF]">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase">General Helpline</p>
                    <p className="font-bold text-[#00E5FF]">+91 12345 67890</p>
                  </div>
                </a>
              </div>
            </div>

          </div>

          {/* RIGHT: Transmission Form (5 Cols) */}
          <div className="lg:col-span-5">
            <div className="bg-[#121217] border-2 border-[#2E2E38] rounded-xl p-6 shadow-[5px_5px_0px_#000000] relative">
              <div className="flex items-center justify-between border-b border-[#27272A] pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#00E5FF]" />
                  <h3 className="font-comic font-black text-lg text-white uppercase tracking-wide">
                    SEND A MESSAGE
                  </h3>
                </div>
                <span className="font-mono text-[10px] text-[#F5D90A] uppercase px-2 py-0.5 rounded bg-[#F5D90A]/10 border border-[#F5D90A]/30">
                  FAST DISPATCH
                </span>
              </div>

              {submitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[#00E5FF]/20 text-[#00E5FF] flex items-center justify-center mx-auto border-2 border-[#00E5FF]">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="font-comic font-black text-2xl text-white">TRANSMISSION RECEIVED!</h4>
                  <p className="font-mono text-xs text-zinc-400 max-w-xs mx-auto">
                    Thank you, {formData.name || 'Agent'}! The ZINNIA '26 organizing desk will reply to your inquiry shortly.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: '', email: '', phone: '', subject: 'General Inquiry', message: '' });
                    }}
                    className="px-5 py-2 bg-[#00E5FF] text-black font-mono font-bold text-xs uppercase rounded hover:bg-[#00B4D8] transition-colors"
                  >
                    SEND ANOTHER QUERY
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block font-mono text-xs uppercase text-zinc-400 mb-1">
                      Full Name <span className="text-[#FF2E63]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Hunter"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-[#1A1A22] border border-[#33333E] rounded-lg px-3.5 py-2 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-[#00E5FF] transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-mono text-xs uppercase text-zinc-400 mb-1">
                        Email Address <span className="text-[#FF2E63]">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="you@college.edu"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-[#1A1A22] border border-[#33333E] rounded-lg px-3.5 py-2 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-[#00E5FF] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-xs uppercase text-zinc-400 mb-1">
                        Mobile Number
                      </label>
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-[#1A1A22] border border-[#33333E] rounded-lg px-3.5 py-2 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-[#00E5FF] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono text-xs uppercase text-zinc-400 mb-1">
                      Inquiry Category
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full bg-[#1A1A22] border border-[#33333E] rounded-lg px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#00E5FF] transition-colors"
                    >
                      <option value="General Inquiry">General Symposium Inquiry</option>
                      <option value="Event Rules">Event Specific Guidelines</option>
                      <option value="Paper Presentation">Paper Presentation Submission</option>
                      <option value="Registration & Pass">Registration &amp; Event Pass</option>
                      <option value="Accommodation">Hospitality &amp; Campus Access</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-xs uppercase text-zinc-400 mb-1">
                      Your Message / Query <span className="text-[#FF2E63]">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Write your question or request here..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full bg-[#1A1A22] border border-[#33333E] rounded-lg px-3.5 py-2 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-[#00E5FF] transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#00E5FF] hover:bg-[#F5D90A] text-black border-2 border-black shadow-[3px_3px_0px_#000000] font-sans font-black text-xs sm:text-sm uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
                  >
                    <span>TRANSMIT MESSAGE</span>
                    <Send className="w-4 h-4 fill-current" />
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Bottom Footer */}
      <WebsiteFooter />
    </div>
  );
};

export default WebsiteContactPage;
