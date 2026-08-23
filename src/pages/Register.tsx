import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { store } from '../services/store';

export const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselectedMission = searchParams.get('mission');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    college: '',
    department: 'Computer Science and Engineering',
    year: 'III',
    registered_events: preselectedMission ? [preselectedMission] : [] as string[]
  });

  const [error, setError] = useState<string | null>(null);
  const events = store.getEvents();

  const handleToggleEvent = (id: string) => {
    if (formData.registered_events.includes(id)) {
      setFormData({
        ...formData,
        registered_events: formData.registered_events.filter(e => e !== id)
      });
    } else {
      setFormData({
        ...formData,
        registered_events: [...formData.registered_events, id]
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.email || !formData.phone || !formData.college) {
      setError('Please fill in all required fields.');
      return;
    }

    if (formData.registered_events.length === 0) {
      setError('Please select at least one event.');
      return;
    }

    try {
      const participant = await store.registerParticipant(formData);
      navigate(`/passport?id=${participant.agent_id}`);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white">Participant Registration</h1>
        <p className="text-slate-400 text-sm">Fill in your details to register for ZINNIA 2026</p>
      </div>

      {error && (
        <div className="p-3 bg-red-950/80 border border-red-500 text-red-300 text-xs rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block text-slate-300 font-medium mb-1">Full Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded focus:outline-none focus:border-indigo-500"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded focus:outline-none focus:border-indigo-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-300 font-medium mb-1">College</label>
          <input
            type="text"
            value={formData.college}
            onChange={e => setFormData({ ...formData, college: e.target.value })}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded focus:outline-none focus:border-indigo-500"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Department</label>
            <input
              type="text"
              value={formData.department}
              onChange={e => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Year</label>
            <select
              value={formData.year}
              onChange={e => setFormData({ ...formData, year: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded focus:outline-none focus:border-indigo-500"
            >
              <option value="I">1st Year</option>
              <option value="II">2nd Year</option>
              <option value="III">3rd Year</option>
              <option value="IV">4th Year</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-slate-300 font-medium mb-2">Select Events</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {events.map((e) => (
              <label
                key={e.id}
                className={`p-2.5 rounded border cursor-pointer flex items-center gap-2 ${
                  formData.registered_events.includes(e.id)
                    ? 'bg-indigo-950 border-indigo-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.registered_events.includes(e.id)}
                  onChange={() => handleToggleEvent(e.id)}
                  className="rounded"
                />
                <span className="font-medium text-xs">{e.mission_name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded text-xs transition-colors"
          >
            Submit Registration
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterPage;
