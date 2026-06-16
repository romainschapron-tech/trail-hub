-- Heart-rate fields captured from the Strava activity summary
ALTER TABLE strava_activities ADD COLUMN average_heartrate REAL;
ALTER TABLE strava_activities ADD COLUMN max_heartrate INTEGER;
ALTER TABLE strava_activities ADD COLUMN has_heartrate INTEGER DEFAULT 0;
