import { store } from '../../../src/services/store';
import { AttendanceRecord } from '@packages/types/src';

export const adminAttendanceService = {
  getAll: (): AttendanceRecord[] => store.getAttendance(),
  recordEntry: (agentId: string) => store.recordEntryCheckin(agentId),
  recordEvent: (agentId: string, eventId: string) => store.recordEventCheckin(agentId, eventId)
};
