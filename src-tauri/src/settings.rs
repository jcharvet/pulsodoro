use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub focus_minutes: u32,
    pub short_break_minutes: u32,
    pub long_break_minutes: u32,
    pub change_wallpaper: bool,
    pub focus_background: String,
    pub break_background: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            focus_minutes: 25,
            short_break_minutes: 5,
            long_break_minutes: 15,
            change_wallpaper: true,
            focus_background: String::new(),
            break_background: String::new(),
        }
    }
}

impl AppSettings {
    pub fn load(config_dir: &PathBuf) -> Self {
        let path = config_dir.join("settings.json");
        if let Ok(data) = fs::read_to_string(&path) {
            serde_json::from_str(&data).unwrap_or_default()
        } else {
            Self::default()
        }
    }

    pub fn save(&self, config_dir: &PathBuf) {
        let path = config_dir.join("settings.json");
        let _ = fs::create_dir_all(config_dir);
        let _ = fs::write(&path, serde_json::to_string_pretty(self).unwrap_or_default());
    }
}
