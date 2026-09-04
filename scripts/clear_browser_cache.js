// Clear all cached symposium registration, payment, attendance, and form draft data.
// NOTE: This must be run in the DevTools console on EVERY device that has been tested on, phones included.

['zin26_live_teams_v2','zin26_live_members_v2','zin26_live_registrations_v2',
 'zin26_live_attendance_v2','zin26_current_team_v2','zin26_registration_form_draft']
  .forEach(k => { localStorage.removeItem(k); sessionStorage.removeItem(k); });
location.reload();
