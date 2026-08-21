import React from 'react';
import { exportEventsReportExcel } from '../../../../src/services/exportService';
import { Download } from 'lucide-react';

export const ExportEvents: React.FC = () => {
  return (
    <button
      onClick={exportEventsReportExcel}
      className="btn-temporal py-2 px-4 text-xs font-bold w-full"
    >
      <Download className="w-4 h-4" />
      <span>Export Missions Report (.xlsx)</span>
    </button>
  );
};
