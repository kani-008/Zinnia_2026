import * as XLSX from 'xlsx';
import { store } from './store';

export function exportParticipantsExcel(): void {
  const participants = store.getParticipants();
  const data = participants.map(p => ({
    'Agent ID': p.agent_id,
    'Full Name': p.name,
    'Email Address': p.email,
    'Phone': p.phone,
    'College': p.college,
    'Department': p.department,
    'Year': p.year,
    'Clearance Level': p.clearance_level,
    'Status': p.status,
    'Registered Missions Count': p.registered_events.length,
    'Registered Missions IDs': p.registered_events.join(', '),
    'Registration Date': new Date(p.created_at).toLocaleString()
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Participants');
  XLSX.writeFile(workbook, `ZINNIA_2026_Participants_${Date.now()}.xlsx`);
}

export function exportAttendanceExcel(): void {
  const attendance = store.getAttendance();
  const data = attendance.map(a => ({
    'Attendance Record ID': a.id,
    'Agent ID': a.agent_id,
    'Participant Name': a.participant_name,
    'College': a.college,
    'Check-in Type': a.checkin_type,
    'Mission Name': a.event_name || 'N/A (Gate Entry)',
    'Scanned By': a.scanned_by,
    'Location': a.location || 'Main Campus',
    'Timestamp': new Date(a.scanned_at).toLocaleString()
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
  XLSX.writeFile(workbook, `ZINNIA_2026_Attendance_${Date.now()}.xlsx`);
}

export function exportFoodExcel(): void {
  const foodRecords = store.getFoodRecords();
  const data = foodRecords.map(f => ({
    'Record ID': f.id,
    'Agent ID': f.agent_id,
    'Participant Name': f.participant_name,
    'Meal Session': f.meal_session,
    'Status': f.collected ? 'COLLECTED' : 'PENDING',
    'Redemption Time': f.collected_at ? new Date(f.collected_at).toLocaleString() : 'N/A',
    'Distributed By': f.scanned_by
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Food Distribution');
  XLSX.writeFile(workbook, `ZINNIA_2026_Food_Distribution_${Date.now()}.xlsx`);
}

export function exportEventsReportExcel(): void {
  const events = store.getEvents();
  const participants = store.getParticipants();
  const attendance = store.getAttendance();

  const data = events.map(e => {
    const registeredCount = participants.filter(p => p.registered_events.includes(e.id)).length;
    const attendedCount = attendance.filter(a => a.checkin_type === 'EVENT' && a.event_id === e.id).length;

    return {
      'Mission Code': e.code,
      'Mission Name': e.mission_name,
      'Event Title': e.title,
      'Category': e.category,
      'Clearance': e.clearance_level,
      'Schedule': e.schedule_time,
      'Duration': e.duration,
      'Venue': e.venue,
      'Total Registrations': registeredCount,
      'Verified Turnout': attendedCount,
      'Status': e.status
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Missions Overview');
  XLSX.writeFile(workbook, `ZINNIA_2026_Missions_Report_${Date.now()}.xlsx`);
}
