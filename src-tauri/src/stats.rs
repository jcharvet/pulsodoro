use chrono::Local;
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
        let _ = fs::create_dir_all(config_dir);
        let _ = fs::write(&path, serde_json::to_string_pretty(self).unwrap_or_default());
    }

    pub fn record_completion(&mut self, config_dir: &PathBuf) {
        let today = Local::now().format("%Y-%m-%d").to_string();
        *self.sessions.entry(today).or_insert(0) += 1;
        self.save(config_dir);
    }

    pub fn get_today(&self) -> u32 {
        let today = Local::now().format("%Y-%m-%d").to_string();
        *self.sessions.get(&today).unwrap_or(&0)
    }

    pub fn get_week(&self) -> u32 {
        let now = Local::now();
        (0..7)
            .map(|days_ago| {
                let date = (now - chrono::Duration::days(days_ago))
                    .format("%Y-%m-%d")
                    .to_string();
                *self.sessions.get(&date).unwrap_or(&0)
            })
            .sum()
    }

    pub fn get_response(&self) -> StatsResponse {
        StatsResponse {
            today: self.get_today(),
            week: self.get_week(),
        }
    }
}
