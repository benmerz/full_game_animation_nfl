select team_logo_wikipedia from teams;
select * from teams;



SELECT yardline_100, posteam, play_id, drive_end_transition, series_result, team_logo_wikipedia, play_type, week
FROM bills
JOIN teams ON bills.posteam = teams.team_abbr;

