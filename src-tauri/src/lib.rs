mod settings;
mod stats;
mod timer;
mod wallpaper_manager;

use settings::AppSettings;
use stats::SessionStats;
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::Duration;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    webview::NewWindowResponse,
    AppHandle, Emitter, Manager, State, WebviewUrl, WebviewWindowBuilder,
};
use timer::{PomodoroTimer, TimerStatus};
use wallpaper_manager::WallpaperManager;

struct AppState {
    timer: PomodoroTimer,
    wallpaper: Mutex<WallpaperManager>,
    settings: Mutex<AppSettings>,
    stats: Mutex<SessionStats>,
    config_dir: PathBuf,
}

#[tauri::command]
fn start_timer(state: State<AppState>) -> TimerStatus {
    state.timer.start();
    state.timer.get_status()
}

#[tauri::command]
fn pause_timer(state: State<AppState>) -> TimerStatus {
    state.timer.pause();
    state.timer.get_status()
}

#[tauri::command]
fn reset_timer(state: State<AppState>, _app: AppHandle) -> TimerStatus {
    state.timer.reset();
    state.wallpaper.lock().unwrap().restore_wallpaper();
    state.timer.get_status()
}

#[tauri::command]
fn skip_timer(state: State<AppState>, app: AppHandle) -> TimerStatus {
    if let Some(new_state) = state.timer.skip() {
        let change_wallpaper = state.settings.lock().unwrap().change_wallpaper;
        if change_wallpaper {
            state
                .wallpaper
                .lock()
                .unwrap()
                .set_wallpaper_for_state(&app, new_state);
        }

        let message = match new_state {
            timer::TimerState::Focus => "Focus time! Let's get to work.",
            timer::TimerState::ShortBreak => "Short break! Take a breather.",
            timer::TimerState::LongBreak => "Long break! You've earned it.",
            timer::TimerState::Idle => unreachable!("transition_to_next_state never returns Idle"),
        };
        let _ = app.emit("timer-notification", message);
    }
    state.timer.get_status()
}

#[tauri::command]
fn get_timer_status(state: State<AppState>) -> TimerStatus {
    state.timer.get_status()
}

#[tauri::command]
fn get_settings(state: State<AppState>) -> AppSettings {
    state.settings.lock().unwrap().clone()
}

#[tauri::command]
fn save_settings(state: State<AppState>, settings: AppSettings) -> AppSettings {
    state.timer.set_durations(
        settings.focus_minutes,
        settings.short_break_minutes,
        settings.long_break_minutes,
    );
    settings.save(&state.config_dir);
    let mut current = state.settings.lock().unwrap();
    *current = settings;
    current.clone()
}

#[tauri::command]
fn load_image(path: String) -> Result<String, String> {
    let data = std::fs::read(&path).map_err(|e| format!("Failed to read {}: {}", path, e))?;
    let ext = path.rsplit('.').next().unwrap_or("png").to_lowercase();
    let mime = match ext.as_str() {
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "bmp" => "image/bmp",
        _ => "image/png",
    };
    use base64::Engine;
    let b64 = base64::engine::general_purpose::STANDARD.encode(&data);
    Ok(format!("data:{};base64,{}", mime, b64))
}

#[tauri::command]
fn get_stats(state: State<AppState>) -> stats::StatsResponse {
    state.stats.lock().unwrap().get_response()
}

#[tauri::command]
fn get_detailed_stats(state: State<AppState>) -> stats::DetailedStatsResponse {
    state.stats.lock().unwrap().get_detailed_response()
}

#[tauri::command]
async fn toggle_tidal(app: AppHandle, url: String) -> Result<bool, String> {
    if let Some(window) = app.get_webview_window("tidal") {
        let is_minimized = window.is_minimized().unwrap_or(false);
        let is_visible = window.is_visible().unwrap_or(false);

        if is_minimized || !is_visible {
            // Bring window back from minimized or hidden state
            let _ = window.unminimize();
            window.show().map_err(|e| e.to_string())?;
            window.set_focus().map_err(|e| e.to_string())?;
            Ok(true)
        } else {
            window.hide().map_err(|e| e.to_string())?;
            Ok(false)
        }
    } else {
        let parsed_url: url::Url = url.parse().map_err(|e: url::ParseError| e.to_string())?;
        if parsed_url.scheme() != "https"
            || !parsed_url
                .host_str()
                .map_or(false, |h| h.ends_with("tidal.com"))
        {
            return Err("Invalid URL: only https://…tidal.com URLs are allowed".to_string());
        }
        let window = WebviewWindowBuilder::new(&app, "tidal", WebviewUrl::External(parsed_url))
            .title("Tidal - PulsoDoro")
            .inner_size(1024.0, 700.0)
            .on_new_window(|url, _features| {
                if url.scheme() == "https"
                    && url.host_str().map_or(false, |h| h.ends_with("tidal.com"))
                {
                    NewWindowResponse::Allow
                } else {
                    NewWindowResponse::Deny
                }
            })
            .build()
            .map_err(|e| e.to_string())?;

        let app_handle = app.clone();
        window.on_window_event(move |event| {
            if let tauri::WindowEvent::Destroyed = event {
                let _ = app_handle.emit("tidal-closed", ());
            }
        });

        Ok(true)
    }
}

#[tauri::command]
async fn close_tidal(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("tidal") {
        window.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn start_timer_loop(app: AppHandle) {
    std::thread::spawn(move || loop {
        std::thread::sleep(Duration::from_secs(1));

        let state = app.state::<AppState>();
        let transition = state.timer.tick();
        let status = state.timer.get_status();

        let _ = app.emit("timer-update", &status);

        if let Some(new_state) = transition {
            // Record focus completion (only when focus timer naturally reaches 0)
            if new_state == timer::TimerState::ShortBreak
                || new_state == timer::TimerState::LongBreak
            {
                state
                    .stats
                    .lock()
                    .unwrap()
                    .record_completion(&state.config_dir);
            }

            let change_wallpaper = state.settings.lock().unwrap().change_wallpaper;
            if change_wallpaper {
                state
                    .wallpaper
                    .lock()
                    .unwrap()
                    .set_wallpaper_for_state(&app, new_state);
            }

            let message = match new_state {
                timer::TimerState::Focus => "Focus time! Let's get to work.",
                timer::TimerState::ShortBreak => "Short break! Take a breather.",
                timer::TimerState::LongBreak => "Long break! You've earned it.",
                timer::TimerState::Idle => {
                    unreachable!("transition_to_next_state never returns Idle")
                }
            };

            let _ = app.emit("timer-notification", message);
        }
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let config_dir = dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("pulsodoro");
    let settings = AppSettings::load(&config_dir);
    let stats = SessionStats::load(&config_dir);

    let timer = PomodoroTimer::new();
    timer.set_durations(
        settings.focus_minutes,
        settings.short_break_minutes,
        settings.long_break_minutes,
    );

    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .manage(AppState {
            timer,
            wallpaper: Mutex::new(WallpaperManager::new()),
            settings: Mutex::new(settings),
            stats: Mutex::new(stats),
            config_dir,
        })
        .setup(|app| {
            let start_item = MenuItem::with_id(app, "start", "Start", true, None::<&str>)?;
            let pause_item = MenuItem::with_id(app, "pause", "Pause", true, None::<&str>)?;
            let reset_item = MenuItem::with_id(app, "reset", "Reset", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

            let menu = Menu::with_items(app, &[&start_item, &pause_item, &reset_item, &quit_item])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "start" => {
                        let state = app.state::<AppState>();
                        state.timer.start();
                        let status = state.timer.get_status();
                        let change_wallpaper = state.settings.lock().unwrap().change_wallpaper;
                        if change_wallpaper {
                            state
                                .wallpaper
                                .lock()
                                .unwrap()
                                .set_wallpaper_for_state(app, status.state);
                        }
                    }
                    "pause" => {
                        app.state::<AppState>().timer.pause();
                    }
                    "reset" => {
                        let state = app.state::<AppState>();
                        state.timer.reset();
                        state.wallpaper.lock().unwrap().restore_wallpaper();
                    }
                    "quit" => {
                        app.state::<AppState>()
                            .wallpaper
                            .lock()
                            .unwrap()
                            .restore_wallpaper();
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.unminimize();
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            start_timer_loop(app.handle().clone());

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            start_timer,
            pause_timer,
            reset_timer,
            skip_timer,
            get_timer_status,
            get_settings,
            save_settings,
            load_image,
            get_stats,
            get_detailed_stats,
            toggle_tidal,
            close_tidal
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
