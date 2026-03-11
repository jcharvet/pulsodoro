use chrono::{Datelike, Local, NaiveDate};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SessionStats {
    pub sessions: HashMap<String, u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StatsResponse {
    pub today: u32,
    pub week: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeatmapDay {
    pub date: String,
    pub count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WeekData {
    pub week_start: String,
    pub sessions: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetailedStatsResponse {
    pub today: u32,
    pub week: u32,
    pub total_sessions: u32,
    pub current_streak: u32,
    pub longest_streak: u32,
    pub heatmap: Vec<HeatmapDay>,
    pub weekly_trend: Vec<WeekData>,
}

impl SessionStats {
    pub fn load(config_dir: &PathBuf) -> Self {
        let path = config_dir.join("stats.json");
        if let Ok(data) = fs::read_to_string(&path) {
            serde_json::from_str(&data).unwrap_or_default()
        } else {
            Self::default()
        }
    }

    pub fn save(&self, config_dir: &PathBuf) {
        let path = config_dir.join("stats.json");
        if let Err(e) = fs::create_dir_all(config_dir) {
            eprintln!("[ERROR] Failed to create config directory: {}", e);
            return;
        }
        match serde_json::to_string_pretty(self) {
            Ok(json) => {
                if let Err(e) = fs::write(&path, json) {
                    eprintln!("[ERROR] Failed to write stats to file: {}", e);
                }
            }
            Err(e) => {
                eprintln!("[ERROR] Failed to serialize stats: {}", e);
            }
        }
    }

    pub fn record_completion(&mut self, config_dir: &PathBuf) {
        let today = Local::now().format("%Y-%m-%d").to_string();
        *self.sessions.entry(today).or_insert(0) += 1;
        self.save(config_dir);
    }

    pub fn get_response(&self) -> StatsResponse {
        let now = Local::now();
        let today_key = now.format("%Y-%m-%d").to_string();
        let today = *self.sessions.get(&today_key).unwrap_or(&0);

        let week = (0..7)
            .map(|days_ago| {
                let date = (now - chrono::Duration::days(days_ago))
                    .format("%Y-%m-%d")
                    .to_string();
                *self.sessions.get(&date).unwrap_or(&0)
            })
            .sum();

        StatsResponse { today, week }
    }

    pub fn get_detailed_response(&self) -> DetailedStatsResponse {
        let now = Local::now();
        let today_date = now.date_naive();
        let today_key = today_date.format("%Y-%m-%d").to_string();

        let today = *self.sessions.get(&today_key).unwrap_or(&0);

        let week: u32 = (0..7)
            .map(|days_ago| {
                let date = (now - chrono::Duration::days(days_ago))
                    .format("%Y-%m-%d")
                    .to_string();
                *self.sessions.get(&date).unwrap_or(&0)
            })
            .sum();

        let total_sessions: u32 = self.sessions.values().sum();

        let (current_streak, longest_streak) = self.compute_streaks(today_date);

        let heatmap = self.compute_heatmap(today_date, 84);

        let weekly_trend = self.compute_weekly_trend(today_date, 8);

        DetailedStatsResponse {
            today,
            week,
            total_sessions,
            current_streak,
            longest_streak,
            heatmap,
            weekly_trend,
        }
    }

    pub fn compute_streaks(&self, today: NaiveDate) -> (u32, u32) {
        // Current streak: consecutive days from today going backwards
        let mut current_streak: u32 = 0;
        let mut day = today;
        loop {
            let key = day.format("%Y-%m-%d").to_string();
            if *self.sessions.get(&key).unwrap_or(&0) > 0 {
                current_streak += 1;
                day -= chrono::Duration::days(1);
            } else {
                break;
            }
        }

        // Longest streak: find the longest consecutive run across all data
        let mut dates: Vec<NaiveDate> = self
            .sessions
            .iter()
            .filter(|(_, &count)| count > 0)
            .filter_map(|(date_str, _)| NaiveDate::parse_from_str(date_str, "%Y-%m-%d").ok())
            .collect();
        dates.sort();

        let mut longest_streak: u32 = 0;
        let mut run: u32 = 0;
        let mut prev: Option<NaiveDate> = None;

        for date in &dates {
            match prev {
                Some(p) if *date - p == chrono::Duration::days(1) => {
                    run += 1;
                }
                _ => {
                    run = 1;
                }
            }
            if run > longest_streak {
                longest_streak = run;
            }
            prev = Some(*date);
        }

        (current_streak, longest_streak)
    }

    fn compute_heatmap(&self, today: NaiveDate, days: i64) -> Vec<HeatmapDay> {
        (0..days)
            .rev()
            .map(|days_ago| {
                let date = today - chrono::Duration::days(days_ago);
                let key = date.format("%Y-%m-%d").to_string();
                let count = *self.sessions.get(&key).unwrap_or(&0);
                HeatmapDay { date: key, count }
            })
            .collect()
    }

    fn compute_weekly_trend(&self, today: NaiveDate, weeks: usize) -> Vec<WeekData> {
        // Find the Monday of the current week
        let weekday = today.weekday().num_days_from_monday();
        let this_monday = today - chrono::Duration::days(weekday as i64);

        (0..weeks)
            .rev()
            .map(|weeks_ago| {
                let week_start = this_monday - chrono::Duration::weeks(weeks_ago as i64);
                let sessions: u32 = (0..7)
                    .map(|d| {
                        let date = week_start + chrono::Duration::days(d);
                        let key = date.format("%Y-%m-%d").to_string();
                        *self.sessions.get(&key).unwrap_or(&0)
                    })
                    .sum();
                WeekData {
                    week_start: week_start.format("%Y-%m-%d").to_string(),
                    sessions,
                }
            })
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_stats(entries: &[(&str, u32)]) -> SessionStats {
        let mut sessions = HashMap::new();
        for (date, count) in entries {
            sessions.insert(date.to_string(), *count);
        }
        SessionStats { sessions }
    }

    #[test]
    fn total_sessions_sums_all() {
        let stats = make_stats(&[("2026-03-01", 3), ("2026-03-02", 5), ("2026-03-10", 2)]);
        let resp = stats.get_detailed_response();
        assert_eq!(resp.total_sessions, 10);
    }

    #[test]
    fn streak_consecutive_days() {
        let today = Local::now().date_naive();
        let d0 = today.format("%Y-%m-%d").to_string();
        let d1 = (today - chrono::Duration::days(1))
            .format("%Y-%m-%d")
            .to_string();
        let d2 = (today - chrono::Duration::days(2))
            .format("%Y-%m-%d")
            .to_string();

        let stats = make_stats(&[(&d0, 1), (&d1, 2), (&d2, 1)]);
        let (current, longest) = stats.compute_streaks(today);
        assert_eq!(current, 3);
        assert_eq!(longest, 3);
    }

    #[test]
    fn streak_broken_yesterday() {
        let today = Local::now().date_naive();
        let d0 = today.format("%Y-%m-%d").to_string();
        // Gap yesterday, sessions 2 days ago
        let d2 = (today - chrono::Duration::days(2))
            .format("%Y-%m-%d")
            .to_string();

        let stats = make_stats(&[(&d0, 1), (&d2, 1)]);
        let (current, _) = stats.compute_streaks(today);
        assert_eq!(current, 1);
    }

    #[test]
    fn streak_zero_if_no_today() {
        let today = Local::now().date_naive();
        let d1 = (today - chrono::Duration::days(1))
            .format("%Y-%m-%d")
            .to_string();

        let stats = make_stats(&[(&d1, 3)]);
        let (current, _) = stats.compute_streaks(today);
        assert_eq!(current, 0);
    }

    #[test]
    fn longest_streak_across_history() {
        let stats = make_stats(&[
            ("2026-01-01", 1),
            ("2026-01-02", 1),
            ("2026-01-03", 1),
            ("2026-01-04", 1),
            ("2026-01-05", 1),
            // Gap
            ("2026-01-10", 1),
            ("2026-01-11", 1),
        ]);
        let date = NaiveDate::from_ymd_opt(2026, 1, 15).unwrap();
        let (_, longest) = stats.compute_streaks(date);
        assert_eq!(longest, 5);
    }

    #[test]
    fn heatmap_returns_correct_count() {
        let today = Local::now().date_naive();
        let d0 = today.format("%Y-%m-%d").to_string();
        let stats = make_stats(&[(&d0, 4)]);

        let heatmap = stats.compute_heatmap(today, 7);
        assert_eq!(heatmap.len(), 7);
        assert_eq!(heatmap.last().unwrap().date, d0);
        assert_eq!(heatmap.last().unwrap().count, 4);
    }

    #[test]
    fn weekly_trend_returns_correct_weeks() {
        let today = Local::now().date_naive();
        let stats = make_stats(&[]);
        let trend = stats.compute_weekly_trend(today, 8);
        assert_eq!(trend.len(), 8);
    }

    #[test]
    fn empty_stats_returns_all_zeros() {
        let stats = SessionStats::default();
        let resp = stats.get_detailed_response();
        assert_eq!(resp.total_sessions, 0);
        assert_eq!(resp.current_streak, 0);
        assert_eq!(resp.longest_streak, 0);
        assert_eq!(resp.heatmap.len(), 84);
        assert_eq!(resp.weekly_trend.len(), 8);
    }
}
