
SELECT  p.player_id, p.firstname
FROM Player p
JOIN Team t on p.team_id = t.team_id
where p.is_active = TRUE;


SELECT  *
FROM Player
WHERE first_name LIKE '%X%' AND last_name LIKE'%Y%'


SELECT p.first_name, p.last_name, p.position
FROM Player p
JOIN Team t on p.team_id = t.team_id
WHERE t.team_name LIKE '%X%';


SELECT s.year, st.stat_name, pss.value
FROM PlayerSeasonStat pss
JOIN Player p ON pss.player_id = p.player_id
JOIN Season s ON pss.season_id = s.season_id
JOIN StatType st ON pss.stat_type_id = st.stat_type_id
WHERE p.player_id = 1
ORDER BY s.year;


