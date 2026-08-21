import React from 'react';
import { exportAttendanceExcel } from '../../../../src/services/exportService';
import { Download } from 'lucide-react';

export const ExportAttendance: React.FC = () => {
  return (
    <button
      onClick={exportAttendanceExcel}
      className="btn-temporal py-2 px-4 text-xs font-bold w-full"
    >
      <Download className="w-4 h-4" />
      <span>Export Attendance (.xlsx)</span>
    </button>
  );
};
