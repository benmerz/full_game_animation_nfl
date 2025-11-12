select team_logo_wikipedia from teams;
select * from teams;



SELECT yardline_100, posteam, play_id, drive_end_transition, series_result, team_logo_wikipedia, play_type, week
FROM bills
JOIN teams ON bills.posteam = teams.team_abbr;



-- Exam questions --
SELECT a.week, t.team_name, a.game_seconds_remaining
from bills a
inner join teams t
    on  t.team_abbr = a.posteam


SELECT play_id, 60 - game_seconds_remaining/60
FROM bills
where week = 1



WITH weekly AS (
  SELECT
    week,
    SUM(air_yards) AS weekly_air_yards
  FROM bills
  WHERE passer_player_name = 'J.Allen'
  GROUP BY week
)
SELECT
  week,
  SUM(weekly_air_yards) OVER (
    ORDER BY week
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS cum_air_yards
FROM weekly
ORDER BY week;