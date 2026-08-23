import * as XLSX from 'xlsx';
import { store } from './store';

export function exportParticipantsExcel(): void {
  const teams = store.getTeams();
  const rows: any[] = [];

  teams.forEach(team => {
    if (team.members && team.members.length > 0) {
      team.members.forEach(m => {
        rows.push({
          'Team ID': team.team_id,
          'Team Name': team.team_name,
          'Member ID': m.id,
          'Member Role': m.is_leader ? 'Leader' : 'Member',
          'Member Name': m.name,
          'Member Email': m.email,
          'Member Phone': m.phone,
          'Hand Band ID': m.band_id || 'UNASSIGNED',
          'Food Claimed': m.food_collected ? 'YES' : 'NO',
          'Food Claimed At': m.food_collected_at ? new Date(m.food_collected_at).toLocaleString() : 'N/A',
          'College': team.college,
          'Department': team.department,
          'Year': team.year,
          'Fee Paid': team.payment ? 'YES' : 'NO',
          'Registered Tracks': team.registered_events.join(', '),
          'Registration Date': new Date(team.created_at).toLocaleString()
        });
      });
    } else {
      rows.push({
        'Team ID': team.team_id,
        'Team Name': team.team_name,
        'College': team.college,
        'Department': team.department,
        'Year': team.year,
        'Fee Paid': team.payment ? 'YES' : 'NO',
        'Registered Tracks': team.registered_events.join(', '),
        'Registration Date': new Date(team.created_at).toLocaleString()
      });
    }
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Teams & Attendees');
  XLSX.writeFile(workbook, `ZINNIA_2026_Teams_Master_${Date.now()}.xlsx`);
}

export function exportAttendanceExcel(): void {
  const attendance = store.getAttendance();
  const data = attendance.map(a => ({
    'Attendance Record ID': a.id,
    'Team ID': a.team_id,
    'Member ID': a.member_id || a.agent_id,
    'Hand Band ID': a.band_id || 'N/A',
    'Attendee Name': a.participant_name,
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
  const members = store.getTeamMembers();
  const teams = store.getTeams();
  const data = members.map(m => {
    const team = teams.find(t => t.team_id === m.team_id);
    return {
      'Team ID': m.team_id,
      'Team Name': team?.team_name || 'N/A',
      'Member ID': m.id,
      'Member Name': m.name,
      'Hand Band ID': m.band_id || 'UNASSIGNED',
      'College': team?.college || 'N/A',
      'Food Collected': m.food_collected ? 'YES' : 'NO',
      'Redemption Time': m.food_collected_at ? new Date(m.food_collected_at).toLocaleString() : 'PENDING'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Food Distribution');
  XLSX.writeFile(workbook, `ZINNIA_2026_Food_Distribution_${Date.now()}.xlsx`);
}

export function exportEventsReportExcel(): void {
  const events = store.getEvents();
  const registrations = store.getEventRegistrations();
  const attendance = store.getAttendance();

  const data = events.map(e => {
    const regCount = registrations.filter(r => r.event_id === e.id).length;
    const attCount = attendance.filter(a => a.event_id === e.id).length;
    return {
      'Event Code': e.code,
      'Event Name': e.mission_name,
      'Type': e.event_type,
      'Venue': e.venue,
      'Schedule': e.schedule_time,
      'Total Registrations': regCount,
      'Actual Attendees': attCount,
      'Turnout %': regCount > 0 ? `${Math.round((attCount / regCount) * 100)}%` : '0%'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Events Summary');
  XLSX.writeFile(workbook, `ZINNIA_2026_Events_Summary_${Date.now()}.xlsx`);
}
