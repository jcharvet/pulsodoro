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
    pub total_secs: u32,
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
                total_secs: durations.focus,
                cycle: 1,
                is_running: false,
            }),
            durations: Mutex::new(durations),
        }
    }

    fn transition_to_next_state(
        &self,
        status: &mut std::sync::MutexGuard<TimerStatus>,
    ) -> Option<TimerState> {
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
        let dur = match new_state {
            TimerState::Focus => durations.focus,
            TimerState::ShortBreak => durations.short_break,
            TimerState::LongBreak => durations.long_break,
            TimerState::Idle => unreachable!("Idle is handled by early return above"),
        };
        status.remaining_secs = dur;
        status.total_secs = dur;

        Some(new_state)
    }

    pub fn start(&self) {
        let mut status = self.status.lock().unwrap();
        if status.state == TimerState::Idle {
            let durations = self.durations.lock().unwrap();
            status.state = TimerState::Focus;
            status.remaining_secs = durations.focus;
            status.total_secs = durations.focus;
        }
        status.is_running = true;
    }

    pub fn pause(&self) {
        let mut status = self.status.lock().unwrap();
        status.is_running = false;
    }

    pub fn reset(&self) {
        let mut status = self.status.lock().unwrap();
        let focus_dur = self.durations.lock().unwrap().focus;
        *status = TimerStatus {
            state: TimerState::Idle,
            remaining_secs: focus_dur,
            total_secs: focus_dur,
            cycle: 1,
            is_running: false,
        };
    }

    pub fn tick(&self) -> Option<TimerState> {
        let mut status = self.status.lock().unwrap();
        if !status.is_running || status.state == TimerState::Idle {
            return None;
        }

        if status.remaining_secs > 0 {
            status.remaining_secs -= 1;
            return None;
        }

        self.transition_to_next_state(&mut status)
    }

    pub fn skip(&self) -> Option<TimerState> {
        let mut status = self.status.lock().unwrap();
        if status.state == TimerState::Idle {
            return None;
        }

        self.transition_to_next_state(&mut status)
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

#[cfg(test)]
mod tests {
    use super::*;

    /// Helper: create a timer with 1-second durations so tick loops are fast.
    fn short_timer() -> PomodoroTimer {
        let timer = PomodoroTimer::new();
        // 1 minute each — set_durations takes minutes
        // We'll override to 1 second via direct mutex access for speed
        {
            let mut dur = timer.durations.lock().unwrap();
            dur.focus = 1;
            dur.short_break = 1;
            dur.long_break = 1;
        }
        // Also patch the initial status so remaining/total match
        {
            let mut status = timer.status.lock().unwrap();
            status.remaining_secs = 1;
            status.total_secs = 1;
        }
        timer
    }

    // ---------------------------------------------------------------
    // State transition tests (via skip, which forces a transition)
    // ---------------------------------------------------------------

    #[test]
    fn focus_to_short_break_cycle_1() {
        let timer = short_timer();
        timer.start();
        let status = timer.get_status();
        assert_eq!(status.state, TimerState::Focus);
        assert_eq!(status.cycle, 1);

        let result = timer.skip();
        assert_eq!(result, Some(TimerState::ShortBreak));
        let status = timer.get_status();
        assert_eq!(status.state, TimerState::ShortBreak);
        assert_eq!(status.cycle, 1); // cycle not yet incremented until ShortBreak→Focus
    }

    #[test]
    fn focus_to_short_break_cycle_2() {
        let timer = short_timer();
        timer.start();
        // cycle 1: Focus → ShortBreak → Focus (now cycle 2)
        timer.skip(); // ShortBreak
        timer.skip(); // Focus, cycle becomes 2

        let status = timer.get_status();
        assert_eq!(status.state, TimerState::Focus);
        assert_eq!(status.cycle, 2);

        let result = timer.skip();
        assert_eq!(result, Some(TimerState::ShortBreak));
        assert_eq!(timer.get_status().state, TimerState::ShortBreak);
    }

    #[test]
    fn focus_to_short_break_cycle_3() {
        let timer = short_timer();
        timer.start();
        // Advance to cycle 3 Focus
        for _ in 0..4 {
            timer.skip(); // ShortBreak, Focus, ShortBreak, Focus
        }
        let status = timer.get_status();
        assert_eq!(status.state, TimerState::Focus);
        assert_eq!(status.cycle, 3);

        let result = timer.skip();
        assert_eq!(result, Some(TimerState::ShortBreak));
    }

    #[test]
    fn focus_to_long_break_cycle_4() {
        let timer = short_timer();
        timer.start();
        // Advance to cycle 4 Focus
        // cycle 1 Focus → skip → ShortBreak → skip → Focus(cycle 2)
        // → skip → ShortBreak → skip → Focus(cycle 3)
        // → skip → ShortBreak → skip → Focus(cycle 4)
        for _ in 0..6 {
            timer.skip();
        }
        let status = timer.get_status();
        assert_eq!(status.state, TimerState::Focus);
        assert_eq!(status.cycle, 4);

        let result = timer.skip();
        assert_eq!(result, Some(TimerState::LongBreak));
        let status = timer.get_status();
        assert_eq!(status.state, TimerState::LongBreak);
        assert_eq!(status.cycle, 4); // cycle not reset yet
    }

    #[test]
    fn short_break_to_focus_increments_cycle() {
        let timer = short_timer();
        timer.start();
        assert_eq!(timer.get_status().cycle, 1);

        timer.skip(); // Focus → ShortBreak
        assert_eq!(timer.get_status().state, TimerState::ShortBreak);

        let result = timer.skip(); // ShortBreak → Focus
        assert_eq!(result, Some(TimerState::Focus));
        let status = timer.get_status();
        assert_eq!(status.state, TimerState::Focus);
        assert_eq!(status.cycle, 2);
    }

    #[test]
    fn long_break_to_focus_resets_cycle_to_1() {
        let timer = short_timer();
        timer.start();
        // Advance to LongBreak
        for _ in 0..7 {
            timer.skip();
        }
        let status = timer.get_status();
        assert_eq!(status.state, TimerState::LongBreak);

        let result = timer.skip(); // LongBreak → Focus
        assert_eq!(result, Some(TimerState::Focus));
        let status = timer.get_status();
        assert_eq!(status.state, TimerState::Focus);
        assert_eq!(status.cycle, 1);
    }

    #[test]
    fn idle_returns_none_on_skip() {
        let timer = short_timer();
        // Timer starts in Idle
        let result = timer.skip();
        assert_eq!(result, None);
        assert_eq!(timer.get_status().state, TimerState::Idle);
    }

    // ---------------------------------------------------------------
    // start() tests
    // ---------------------------------------------------------------

    #[test]
    fn start_transitions_idle_to_focus_and_sets_running() {
        let timer = PomodoroTimer::new();
        assert_eq!(timer.get_status().state, TimerState::Idle);
        assert!(!timer.get_status().is_running);

        timer.start();

        let status = timer.get_status();
        assert_eq!(status.state, TimerState::Focus);
        assert!(status.is_running);
        assert_eq!(status.remaining_secs, 25 * 60);
        assert_eq!(status.total_secs, 25 * 60);
    }

    #[test]
    fn start_from_focus_only_sets_running() {
        let timer = short_timer();
        timer.start();
        timer.pause();
        assert!(!timer.get_status().is_running);

        // Start again from Focus (not Idle) — should just set is_running
        timer.start();
        let status = timer.get_status();
        assert_eq!(status.state, TimerState::Focus);
        assert!(status.is_running);
    }

    // ---------------------------------------------------------------
    // pause() tests
    // ---------------------------------------------------------------

    #[test]
    fn pause_sets_is_running_false() {
        let timer = short_timer();
        timer.start();
        assert!(timer.get_status().is_running);

        timer.pause();
        assert!(!timer.get_status().is_running);
    }

    // ---------------------------------------------------------------
    // reset() tests
    // ---------------------------------------------------------------

    #[test]
    fn reset_returns_to_idle_with_correct_defaults() {
        let timer = short_timer();
        timer.start();
        timer.skip(); // move to ShortBreak
                      // Now mutate cycle to prove reset clears it
        {
            let mut status = timer.status.lock().unwrap();
            status.cycle = 3;
        }

        timer.reset();

        let status = timer.get_status();
        assert_eq!(status.state, TimerState::Idle);
        assert_eq!(status.cycle, 1);
        assert!(!status.is_running);
        // remaining/total should match the current focus duration (1 sec in short_timer)
        assert_eq!(status.remaining_secs, 1);
        assert_eq!(status.total_secs, 1);
    }

    #[test]
    fn reset_respects_custom_durations() {
        let timer = PomodoroTimer::new();
        timer.set_durations(10, 3, 7); // 10 min focus
        timer.start();
        timer.skip(); // some state change

        timer.reset();

        let status = timer.get_status();
        assert_eq!(status.state, TimerState::Idle);
        assert_eq!(status.remaining_secs, 10 * 60);
        assert_eq!(status.total_secs, 10 * 60);
        assert_eq!(status.cycle, 1);
        assert!(!status.is_running);
    }

    // ---------------------------------------------------------------
    // tick() tests
    // ---------------------------------------------------------------

    #[test]
    fn tick_decrements_remaining_secs() {
        let timer = short_timer();
        timer.start(); // transitions Idle→Focus, sets remaining from durations
                       // Now override remaining to 5 so we can observe decrement clearly
        {
            let mut status = timer.status.lock().unwrap();
            status.remaining_secs = 5;
            status.total_secs = 5;
        }

        let result = timer.tick();
        assert_eq!(result, None); // no transition, just decrement
        assert_eq!(timer.get_status().remaining_secs, 4);
    }

    #[test]
    fn tick_triggers_transition_when_remaining_reaches_zero() {
        let timer = short_timer();
        timer.start();
        // remaining_secs is 1, after start it's still 1
        // First tick: 1 → 0, returns None (decrement)
        let result = timer.tick();
        assert_eq!(result, None);
        assert_eq!(timer.get_status().remaining_secs, 0);

        // Second tick: remaining is 0, triggers transition
        let result = timer.tick();
        assert_eq!(result, Some(TimerState::ShortBreak));
        assert_eq!(timer.get_status().state, TimerState::ShortBreak);
    }

    #[test]
    fn tick_returns_none_when_not_running() {
        let timer = short_timer();
        timer.start();
        timer.pause();
        // Timer is in Focus but not running
        let remaining_before = timer.get_status().remaining_secs;
        let result = timer.tick();
        assert_eq!(result, None);
        // remaining_secs should NOT have changed
        assert_eq!(timer.get_status().remaining_secs, remaining_before);
    }

    #[test]
    fn tick_returns_none_when_idle() {
        let timer = short_timer();
        // Timer starts in Idle, not running
        let result = timer.tick();
        assert_eq!(result, None);
    }

    #[test]
    fn tick_returns_none_when_idle_even_if_running_flag_set() {
        // Edge case: Idle state with is_running somehow true
        // The tick() guard checks both !is_running || Idle
        let timer = short_timer();
        {
            let mut status = timer.status.lock().unwrap();
            status.state = TimerState::Idle;
            status.is_running = true;
        }
        let result = timer.tick();
        assert_eq!(result, None);
    }

    // ---------------------------------------------------------------
    // skip() tests
    // ---------------------------------------------------------------

    #[test]
    fn skip_triggers_transition_to_next_state() {
        let timer = short_timer();
        timer.start();
        assert_eq!(timer.get_status().state, TimerState::Focus);

        let result = timer.skip();
        assert_eq!(result, Some(TimerState::ShortBreak));
        let status = timer.get_status();
        assert_eq!(status.state, TimerState::ShortBreak);
        assert_eq!(status.remaining_secs, 1); // short_break duration
        assert_eq!(status.total_secs, 1);
    }

    #[test]
    fn skip_returns_none_when_idle() {
        let timer = short_timer();
        let result = timer.skip();
        assert_eq!(result, None);
        assert_eq!(timer.get_status().state, TimerState::Idle);
    }

    #[test]
    fn skip_ignores_remaining_time() {
        let timer = short_timer();
        timer.start();
        // Set a large remaining time — skip should still transition
        {
            let mut status = timer.status.lock().unwrap();
            status.remaining_secs = 999;
        }
        let result = timer.skip();
        assert_eq!(result, Some(TimerState::ShortBreak));
    }

    // ---------------------------------------------------------------
    // Full pomodoro cycle test
    // ---------------------------------------------------------------

    #[test]
    fn full_pomodoro_cycle() {
        let timer = short_timer();
        timer.start();

        // Cycle 1: Focus → ShortBreak → Focus
        assert_eq!(timer.get_status().state, TimerState::Focus);
        assert_eq!(timer.get_status().cycle, 1);
        let r = timer.skip();
        assert_eq!(r, Some(TimerState::ShortBreak));
        let r = timer.skip();
        assert_eq!(r, Some(TimerState::Focus));
        assert_eq!(timer.get_status().cycle, 2);

        // Cycle 2: Focus → ShortBreak → Focus
        let r = timer.skip();
        assert_eq!(r, Some(TimerState::ShortBreak));
        let r = timer.skip();
        assert_eq!(r, Some(TimerState::Focus));
        assert_eq!(timer.get_status().cycle, 3);

        // Cycle 3: Focus → ShortBreak → Focus
        let r = timer.skip();
        assert_eq!(r, Some(TimerState::ShortBreak));
        let r = timer.skip();
        assert_eq!(r, Some(TimerState::Focus));
        assert_eq!(timer.get_status().cycle, 4);

        // Cycle 4: Focus → LongBreak → Focus (cycle resets to 1)
        let r = timer.skip();
        assert_eq!(r, Some(TimerState::LongBreak));
        assert_eq!(timer.get_status().cycle, 4); // not reset yet
        let r = timer.skip();
        assert_eq!(r, Some(TimerState::Focus));
        assert_eq!(timer.get_status().cycle, 1); // reset after long break

        // Verify we're back at the beginning of a new pomodoro set
        let status = timer.get_status();
        assert_eq!(status.state, TimerState::Focus);
        assert_eq!(status.cycle, 1);
        assert_eq!(status.remaining_secs, 1);
        assert_eq!(status.total_secs, 1);
        assert!(status.is_running);
    }

    // ---------------------------------------------------------------
    // Full cycle via tick (proves tick triggers transitions at zero)
    // ---------------------------------------------------------------

    #[test]
    fn full_cycle_via_tick() {
        let timer = short_timer();
        timer.start();

        // With 1-second durations, each period takes 2 ticks:
        // tick 1: decrement 1→0, returns None
        // tick 2: remaining==0, triggers transition, returns Some(next)

        // Focus(cycle 1) → ShortBreak
        assert_eq!(timer.tick(), None); // 1→0
        assert_eq!(timer.tick(), Some(TimerState::ShortBreak));

        // ShortBreak → Focus(cycle 2)
        assert_eq!(timer.tick(), None); // 1→0
        assert_eq!(timer.tick(), Some(TimerState::Focus));
        assert_eq!(timer.get_status().cycle, 2);

        // Focus(cycle 2) → ShortBreak
        assert_eq!(timer.tick(), None);
        assert_eq!(timer.tick(), Some(TimerState::ShortBreak));

        // ShortBreak → Focus(cycle 3)
        assert_eq!(timer.tick(), None);
        assert_eq!(timer.tick(), Some(TimerState::Focus));
        assert_eq!(timer.get_status().cycle, 3);

        // Focus(cycle 3) → ShortBreak
        assert_eq!(timer.tick(), None);
        assert_eq!(timer.tick(), Some(TimerState::ShortBreak));

        // ShortBreak → Focus(cycle 4)
        assert_eq!(timer.tick(), None);
        assert_eq!(timer.tick(), Some(TimerState::Focus));
        assert_eq!(timer.get_status().cycle, 4);

        // Focus(cycle 4) → LongBreak
        assert_eq!(timer.tick(), None);
        assert_eq!(timer.tick(), Some(TimerState::LongBreak));

        // LongBreak → Focus(cycle 1)
        assert_eq!(timer.tick(), None);
        assert_eq!(timer.tick(), Some(TimerState::Focus));
        assert_eq!(timer.get_status().cycle, 1);
    }

    // ---------------------------------------------------------------
    // set_durations() tests
    // ---------------------------------------------------------------

    #[test]
    fn set_durations_updates_correctly() {
        let timer = PomodoroTimer::new();
        timer.set_durations(10, 3, 7);

        let durations = timer.durations.lock().unwrap();
        assert_eq!(durations.focus, 10 * 60);
        assert_eq!(durations.short_break, 3 * 60);
        assert_eq!(durations.long_break, 7 * 60);
    }

    #[test]
    fn set_durations_affects_subsequent_transitions() {
        let timer = PomodoroTimer::new();
        timer.set_durations(1, 2, 3); // 1 min, 2 min, 3 min
        timer.start();

        let status = timer.get_status();
        // start() reads durations for Focus
        assert_eq!(status.remaining_secs, 1 * 60);
        assert_eq!(status.total_secs, 1 * 60);

        // Skip to ShortBreak — should use new short_break duration
        timer.skip();
        let status = timer.get_status();
        assert_eq!(status.state, TimerState::ShortBreak);
        assert_eq!(status.remaining_secs, 2 * 60);
        assert_eq!(status.total_secs, 2 * 60);
    }

    #[test]
    fn set_durations_long_break_used_at_cycle_4() {
        let timer = PomodoroTimer::new();
        timer.set_durations(1, 1, 5); // 5 min long break
        timer.start();

        // Fast-forward to cycle 4 Focus
        for _ in 0..6 {
            timer.skip();
        }
        assert_eq!(timer.get_status().state, TimerState::Focus);
        assert_eq!(timer.get_status().cycle, 4);

        timer.skip(); // → LongBreak
        let status = timer.get_status();
        assert_eq!(status.state, TimerState::LongBreak);
        assert_eq!(status.remaining_secs, 5 * 60);
        assert_eq!(status.total_secs, 5 * 60);
    }

    // ---------------------------------------------------------------
    // Constructor / default state test
    // ---------------------------------------------------------------

    #[test]
    fn new_timer_has_correct_defaults() {
        let timer = PomodoroTimer::new();
        let status = timer.get_status();
        assert_eq!(status.state, TimerState::Idle);
        assert_eq!(status.remaining_secs, 25 * 60);
        assert_eq!(status.total_secs, 25 * 60);
        assert_eq!(status.cycle, 1);
        assert!(!status.is_running);

        let durations = timer.durations.lock().unwrap();
        assert_eq!(durations.focus, 25 * 60);
        assert_eq!(durations.short_break, 5 * 60);
        assert_eq!(durations.long_break, 15 * 60);
    }

    // ---------------------------------------------------------------
    // Transition sets remaining_secs and total_secs correctly
    // ---------------------------------------------------------------

    #[test]
    fn transition_sets_remaining_and_total_secs() {
        let timer = PomodoroTimer::new();
        timer.set_durations(25, 5, 15);
        timer.start();

        // Focus → ShortBreak
        timer.skip();
        let status = timer.get_status();
        assert_eq!(status.remaining_secs, 5 * 60);
        assert_eq!(status.total_secs, 5 * 60);

        // ShortBreak → Focus
        timer.skip();
        let status = timer.get_status();
        assert_eq!(status.remaining_secs, 25 * 60);
        assert_eq!(status.total_secs, 25 * 60);
    }

    // ---------------------------------------------------------------
    // Additional edge-case tests
    // ---------------------------------------------------------------

    #[test]
    fn tick_transition_preserves_is_running() {
        let timer = short_timer();
        timer.start();
        assert!(timer.get_status().is_running);

        // Tick through to transition
        timer.tick(); // 1 -> 0
        timer.tick(); // triggers Focus -> ShortBreak

        let status = timer.get_status();
        assert_eq!(status.state, TimerState::ShortBreak);
        assert!(
            status.is_running,
            "is_running should remain true after tick transition"
        );
    }

    #[test]
    fn skip_works_when_paused() {
        let timer = short_timer();
        timer.start();
        timer.pause();
        assert!(!timer.get_status().is_running);

        let result = timer.skip();
        assert_eq!(result, Some(TimerState::ShortBreak));
        assert!(
            !timer.get_status().is_running,
            "skip should not change is_running"
        );
    }

    #[test]
    fn zero_duration_triggers_immediate_transition() {
        let timer = PomodoroTimer::new();
        timer.set_durations(0, 0, 0);
        timer.start();

        // remaining_secs is 0, first tick should trigger transition
        let result = timer.tick();
        assert_eq!(result, Some(TimerState::ShortBreak));
    }
}
