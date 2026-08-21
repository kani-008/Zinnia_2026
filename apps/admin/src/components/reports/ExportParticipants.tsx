import React from 'react';
import { exportParticipantsExcel } from '../../../../src/services/exportService';
import { Download } from 'lucide-react';

export const ExportParticipants: React.FC = () => {
  return (
    <button
      onClick={exportParticipantsExcel}
      className="btn-temporal py-2 px-4 text-xs font-bold w-full"
    >
      <Download className="w-4 h-4" />
      <span>Export Participants (.xlsx)</span>
    </button>
  );
};
