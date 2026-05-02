SELECT
    st.key AS stat_key,
    st.name AS stat_name,
    st.category AS stat_category,
    st.unit AS stat_unit,

    SUM(
        CASE
            WHEN psr.player_id = %s THEN pss.value
            ELSE 0
        END
    ) AS left_value,

    SUM(
        CASE
            WHEN psr.player_id = %s THEN pss.value
            ELSE 0
        END
    ) AS right_value

FROM seasons_playerseasonroster psr

JOIN stats_playerseasonstat pss
    ON pss.player_roster_id = psr.roster_id

JOIN stats_stattype st
    ON pss.stat_type_id = st.stat_type_id

WHERE psr.team_season_id = %s
  AND psr.player_id IN (%s, %s)

GROUP BY
    st.key,
    st.name,
    st.category,
    st.unit

ORDER BY
    CASE st.category
        WHEN 'passing' THEN 1
        WHEN 'rushing' THEN 2
        WHEN 'receiving' THEN 3
        WHEN 'defense' THEN 4
        WHEN 'kicking' THEN 5
        ELSE 999
    END,
    st.name;