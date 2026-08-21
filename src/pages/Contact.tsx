import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, Shield, Terminal, CheckCircle2 } from 'lucide-react';
import { GlitchText } from '../components/hero/GlitchText';

export const ContactPage: React.FC = () => {
  const [sent, setSent] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [agentEmail, setAgentEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  const staffLeads = [
    { role: 'Faculty Convener', name: 'Dr. A. Senthil Kumar', department: 'Dept of CSE', phone: '+91 98401 23456', email: 'senthil.cse@gce.ac.in' },
    { role: 'Staff Coordinator', name: 'Prof. M. Priya', department: 'Dept of CSE', phone: '+91 98402 34567', email: 'priya.cse@gce.ac.in' }
  ];

  const studentCoordinators = [
    { role: 'Student President', name: 'R. Kanishkar', phone: '+91 94451 98765', email: 'kanishkar.m@gce.ac.in' },
    { role: 'Student Vice President', name: 'D. Harini', phone: '+91 98765 43210', email: 'harini.d@gce.ac.in' },
    { role: 'Technical Operations Lead', name: 'S. Vignesh', phone: '+91 97890 12345', email: 'vignesh.s@gce.ac.in' }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 text-xs font-mono tracking-widest uppercase">
          <Terminal className="w-3.5 h-3.5" />
          COMMUNICATION NODE // CHRONOS HQ
        </div>
        <h1 className="text-3xl sm:text-5xl font-heading font-black text-white">
          COMMAND <GlitchText text="COORDINATES" />
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto font-mono text-xs sm:text-sm">
          Connect with symposium faculty conveners, student coordinators, and technical team leads.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Coordinators Column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel p-6 tech-bracket space-y-4 border-slate-800">
            <h3 className="text-base font-heading font-bold text-white text-cyan-400 flex items-center gap-2">
              <Shield className="w-4 h-4" /> FACULTY CONVENERS
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
              {staffLeads.map((lead, i) => (
                <div key={i} className="p-3 rounded bg-slate-900/60 border border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase">{lead.role}</div>
                  <div className="text-white font-bold text-sm font-sans">{lead.name}</div>
                  <div className="text-slate-400 text-[11px]">{lead.department}</div>
                  <div className="text-cyan-400 text-[11px] pt-1">{lead.phone}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6 tech-bracket space-y-4 border-slate-800">
            <h3 className="text-base font-heading font-bold text-white text-violet-400 flex items-center gap-2">
              <Terminal className="w-4 h-4" /> STUDENT COMMAND DESK
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              {studentCoordinators.map((lead, i) => (
                <div key={i} className="p-3 rounded bg-slate-900/60 border border-slate-800 space-y-1">
                  <div className="text-[9px] text-slate-500 uppercase">{lead.role}</div>
                  <div className="text-white font-bold font-sans text-xs">{lead.name}</div>
                  <div className="text-violet-300 text-[11px] pt-1">{lead.phone}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Physical Address */}
          <div className="glass-panel p-6 tech-bracket space-y-2 border-slate-800 font-mono text-xs text-slate-300">
            <div className="text-emerald-400 font-bold flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4" /> CAMPUS LOCATION
            </div>
            <p className="font-sans text-slate-400">
              Department of Computer Science & Engineering, Government College of Engineering, Tamil Nadu, India.
            </p>
          </div>
        </div>

        {/* Message Dispatch Form */}
        <div className="lg:col-span-5">
          <div className="glass-panel p-6 sm:p-8 tech-bracket border-cyan-500/40 shadow-2xl">
            <h3 className="text-lg font-heading font-bold text-white mb-2">
              DISPATCH TRANSMISSION
            </h3>
            <p className="text-xs font-mono text-slate-400 mb-6">
              Send an inquiry directly to the event operations team.
            </p>

            {sent ? (
              <div className="p-6 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-center font-mono text-xs space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <div className="text-emerald-300 font-bold text-sm">TRANSMISSION RECEIVED</div>
                <p className="text-slate-300">Our temporal dispatch officers will respond to your frequency shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">AGENT / SENDER NAME</label>
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded bg-slate-950 border border-slate-700 text-white font-sans text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">RETURN FREQUENCY (EMAIL)</label>
                  <input
                    type="email"
                    required
                    placeholder="email@domain.com"
                    value={agentEmail}
                    onChange={(e) => setAgentEmail(e.target.value)}
                    className="w-full px-3 py-2.5 rounded bg-slate-950 border border-slate-700 text-white font-sans text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">TRANSMISSION CONTENT</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe your inquiry..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3 py-2.5 rounded bg-slate-950 border border-slate-700 text-white font-sans text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <button type="submit" className="btn-temporal w-full py-2.5">
                  <span>DISPATCH MESSAGE</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
