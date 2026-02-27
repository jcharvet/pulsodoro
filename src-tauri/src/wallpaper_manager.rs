use crate::timer::TimerState;
use tauri::{AppHandle, Manager};

pub struct WallpaperManager {
    original_wallpaper: Option<String>,
}

impl WallpaperManager {
    pub fn new() -> Self {
        let original = wallpaper::get().ok();
        Self {
            original_wallpaper: original,
        }
    }

    pub fn set_wallpaper_for_state(&self, app: &AppHandle, state: TimerState) {
        let filename = match state {
            TimerState::Focus => "focus.jpg",
            TimerState::ShortBreak | TimerState::LongBreak => "break.jpg",
            TimerState::Idle => {
                self.restore_wallpaper();
                return;
            }
        };

        if let Ok(resource_path) = app
            .path()
            .resolve(format!("resources/wallpapers/{}", filename), tauri::path::BaseDirectory::Resource)
        {
            let _ = wallpaper::set_from_path(resource_path.to_str().unwrap_or_default());
        }
    }

    pub fn restore_wallpaper(&self) {
        if let Some(ref path) = self.original_wallpaper {
            let _ = wallpaper::set_from_path(path);
        }
    }
}
