use serde::{Deserialize, Serialize};
use std::sync::Mutex;

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum TimerState {
    Idle,
    Focus,
    ShortBreak,
    LongBreak,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimerStatus {
    pub state: TimerState,
    pub remaining_secs: u32,
    pub cycle: u32,
    pub is_running: bool,
}

#[derive(Debug, Clone)]
pub struct TimerDurations {
    pub focus: u32,
    pub short_break: u32,
    pub long_break: u32,
}

impl Default for TimerDurations {
    fn default() -> Self {
        Self {
            focus: 25 * 60,
            short_break: 5 * 60,
            long_break: 15 * 60,
        }
    }
}

pub struct PomodoroTimer {
    pub status: Mutex<TimerStatus>,
    pub durations: Mutex<TimerDurations>,
}

impl PomodoroTimer {
    pub fn new() -> Self {
        let durations = TimerDurations::default();
        Self {
            status: Mutex::new(TimerStatus {
                state: TimerState::Idle,
                remaining_secs: durations.focus,
                cycle: 1,
                is_running: false,
            }),
            durations: Mutex::new(durations),
        }
    }

    pub fn start(&self) {
        let mut status = self.status.lock().unwrap();
        if status.state == TimerState::Idle {
            status.state = TimerState::Focus;
            status.remaining_secs = self.durations.lock().unwrap().focus;
        }
        status.is_running = true;
    }

    pub fn pause(&self) {
        let mut status = self.status.lock().unwrap();
        status.is_running = false;
    }

    pub fn reset(&self) {
        let mut status = self.status.lock().unwrap();
        *status = TimerStatus {
            state: TimerState::Idle,
            remaining_secs: self.durations.lock().unwrap().focus,
            cycle: 1,
            is_running: false,
        };
    }

    pub fn tick(&self) -> Option<TimerState> {
        let mut status = self.status.lock().unwrap();
        if !status.is_running {
            return None;
        }

        if status.remaining_secs > 0 {
            status.remaining_secs -= 1;
            return None;
        }

        let new_state = match status.state {
            TimerState::Focus => {
                if status.cycle >= 4 {
                    TimerState::LongBreak
                } else {
                    TimerState::ShortBreak
                }
            }
            TimerState::ShortBreak => {
                status.cycle += 1;
                TimerState::Focus
            }
            TimerState::LongBreak => {
                status.cycle = 1;
                TimerState::Focus
            }
            TimerState::Idle => return None,
        };

        let durations = self.durations.lock().unwrap();
        status.state = new_state;
        status.remaining_secs = match new_state {
            TimerState::Focus => durations.focus,
            TimerState::ShortBreak => durations.short_break,
            TimerState::LongBreak => durations.long_break,
            TimerState::Idle => 0,
        };

        Some(new_state)
    }

    pub fn skip(&self) -> Option<TimerState> {
        let mut status = self.status.lock().unwrap();
        if status.state == TimerState::Idle {
            return None;
        }

        let new_state = match status.state {
            TimerState::Focus => {
                if status.cycle >= 4 {
                    TimerState::LongBreak
                } else {
                    TimerState::ShortBreak
                }
            }
            TimerState::ShortBreak => {
                status.cycle += 1;
                TimerState::Focus
            }
            TimerState::LongBreak => {
                status.cycle = 1;
                TimerState::Focus
            }
            TimerState::Idle => return None,
        };

        let durations = self.durations.lock().unwrap();
        status.state = new_state;
        status.remaining_secs = match new_state {
            TimerState::Focus => durations.focus,
            TimerState::ShortBreak => durations.short_break,
            TimerState::LongBreak => durations.long_break,
            TimerState::Idle => 0,
        };

        Some(new_state)
    }

    pub fn get_status(&self) -> TimerStatus {
        self.status.lock().unwrap().clone()
    }

    pub fn set_durations(&self, focus_mins: u32, short_break_mins: u32, long_break_mins: u32) {
        let mut durations = self.durations.lock().unwrap();
        durations.focus = focus_mins * 60;
        durations.short_break = short_break_mins * 60;
        durations.long_break = long_break_mins * 60;
    }
}
