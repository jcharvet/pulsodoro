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
    #[serde(default = "default_true")]
    pub sound_enabled: bool,
    #[serde(default)]
    pub custom_youtube_id: String,
    #[serde(default = "default_youtube")]
    pub music_source: String,
    #[serde(default)]
    pub tidal_url: String,
    #[serde(default)]
    pub always_on_top: bool,
    #[serde(default = "default_true")]
    pub show_progress_ring: bool,
    #[serde(default = "default_midnight")]
    pub theme: String,
    #[serde(default = "default_classic")]
    pub ui_style: String,
}

fn default_true() -> bool {
    true
}

fn default_youtube() -> String {
    "youtube".to_string()
}

fn default_midnight() -> String {
    "midnight".to_string()
}

fn default_classic() -> String {
    "classic".to_string()
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            focus_minutes: 25,
            short_break_minutes: 5,
            long_break_minutes: 15,
            change_wallpaper: false,
            focus_background: String::new(),
            break_background: String::new(),
            sound_enabled: true,
            custom_youtube_id: String::new(),
            music_source: "youtube".to_string(),
            tidal_url: String::new(),
            always_on_top: false,
            show_progress_ring: true,
            theme: "midnight".to_string(),
            ui_style: "classic".to_string(),
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
