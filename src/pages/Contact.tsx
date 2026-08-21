import React, { useState } from 'react';
import { sound } from '../services/sound';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { 
  Radio, 
  MapPin, 
  Phone, 
  Mail, 
  Send, 
  CheckCircle2, 
  Building,
  UserCheck
} from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playConfirmTone();
    setSubmitted(true);
  };

  return (
    <div className="page-container py-12 space-y-10 font-mono text-xs">
      {/* Header */}
      <PageHeader
        badgeText="COMMAND HEADQUARTERS & COORDINATES"
        badgeIcon={<Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />}
        title="COMMUNICATIONS"
        glitchWord="CHANNELS"
        description="Direct links to symposium staff conveners, student coordinators, and campus venue coordinates."
        highlightTag="GCE SALEM CSE"
      />

      {/* 12-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Coordinates & Leadership (col-span-5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="cyber-card p-6 cyber-bracket border-slate-800 space-y-4 bg-[#070c1b]/95">
            <div className="text-white font-heading font-bold text-sm border-b border-slate-800 pb-2 flex items-center gap-2 font-sans">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>SYMPOSIUM VENUE COORDINATES</span>
            </div>

            <div className="space-y-1 text-slate-300 font-sans text-xs">
              <div className="font-bold text-white">Department of Computer Science & Engineering</div>
              <div>Government College of Engineering (Autonomous)</div>
              <div className="text-slate-400 text-[11px]">Bangalore Highway, Salem - 636 011, Tamil Nadu</div>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-300 font-mono">
                <Mail className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>zinnia2026.gce@gmail.com</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300 font-mono">
                <Phone className="w-4 h-4 text-fuchsia-400 flex-shrink-0" />
                <span>+91 98401 98765 / +91 94451 23456</span>
              </div>
            </div>
          </div>

          <div className="cyber-card p-6 cyber-bracket border-slate-800 space-y-3 bg-[#070c1b]/95">
            <div className="text-white font-heading font-bold text-sm border-b border-slate-800 pb-2 flex items-center gap-2 font-sans">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>FACULTY & STUDENT COORDINATION</span>
            </div>

            <div className="space-y-3 text-[11px] text-slate-300">
              <div>
                <div className="text-slate-500 uppercase text-[10px] font-bold">STAFF CONVENER & HOD</div>
                <div className="text-white font-bold font-sans">Dr. A. Rajesh, M.E., Ph.D.</div>
                <div className="text-slate-400 font-sans">Head, Department of CSE &bull; GCE Salem</div>
              </div>

              <div>
                <div className="text-slate-500 uppercase text-[10px] font-bold">STUDENT SECRETARY</div>
                <div className="text-white font-bold font-sans">Kanishkar M (Final Year CSE)</div>
                <div className="text-slate-400 font-sans">Secretary, CSE Association 2026</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Transmission Dispatch Form (col-span-7) */}
        <div className="lg:col-span-7">
          <div className="cyber-card p-6 sm:p-8 cyber-bracket border-slate-800 bg-[#070c1b]/95 space-y-5">
            <div className="text-white font-heading font-bold text-sm border-b border-slate-800 pb-2 flex items-center gap-2 font-sans">
              <Send className="w-4 h-4 text-cyan-400" />
              <span>DISPATCH INQUIRY TO ORGANIZERS</span>
            </div>

            {submitted ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-400 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-heading font-bold text-white uppercase font-sans">
                  MESSAGE TRANSMITTED
                </h3>
                <p className="text-slate-300 font-sans text-xs">
                  Your query has been dispatched to the symposium organizing team. We will respond promptly.
                </p>
                <Button variant="SECONDARY" size="sm" onClick={() => setSubmitted(false)}>
                  <span>Send Another Message</span>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-slate-300 font-bold">NAME *</label>
                    <input
                      type="text"
                      placeholder="Your Full Name"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2 rounded bg-[#040711] border border-slate-700 text-white font-sans text-xs focus:border-cyan-400 focus:outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-slate-300 font-bold">EMAIL ADDRESS *</label>
                    <input
                      type="email"
                      placeholder="your.email@college.edu"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2 rounded bg-[#040711] border border-slate-700 text-white font-sans text-xs focus:border-cyan-400 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-300 font-bold">SUBJECT *</label>
                  <input
                    type="text"
                    placeholder="e.g. Mission Schedule Clarification or Registration Query"
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3.5 py-2 rounded bg-[#040711] border border-slate-700 text-white font-sans text-xs focus:border-cyan-400 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-300 font-bold">MESSAGE *</label>
                  <textarea
                    rows={4}
                    placeholder="Type your message or inquiry here..."
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3.5 py-2 rounded bg-[#040711] border border-slate-700 text-white font-sans text-xs focus:border-cyan-400 focus:outline-none"
                    required
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button type="submit" variant="PRIMARY" rightIcon={<Send className="w-3.5 h-3.5" />}>
                    <span>DISPATCH MESSAGE</span>
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ContactPage;
