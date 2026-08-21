import React from 'react';
import { AttendanceRecord } from '@packages/types/src';

export interface AttendanceHistoryProps {
  records: AttendanceRecord[];
}

export const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({ records }) => {
  return (
    <div className="overflow-x-auto font-mono text-xs">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-800 text-slate-400">
            <th className="pb-2 px-2">AGENT ID</th>
            <th className="pb-2 px-2">NAME</th>
            <th className="pb-2 px-2">TYPE</th>
            <th className="pb-2 px-2">TIME</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-900">
          {records.map((r) => (
            <tr key={r.id} className="hover:bg-slate-900/40">
              <td className="py-2 px-2 text-cyan-400 font-bold">{r.agent_id}</td>
              <td className="py-2 px-2 text-white font-sans">{r.participant_name}</td>
              <td className="py-2 px-2 text-slate-300">{r.checkin_type}</td>
              <td className="py-2 px-2 text-slate-400">
                {new Date(r.scanned_at).toLocaleTimeString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
