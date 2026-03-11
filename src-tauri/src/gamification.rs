use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

// --- Persisted State ---

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct GamificationState {
    #[serde(default)]
    pub total_xp: u64,
    #[serde(default)]
    pub current_level: u32,
    #[serde(default)]
    pub xp_in_current_level: u64,
    #[serde(default)]
    pub total_rounds_completed: u32,
    #[serde(default)]
    pub unlocked_achievements: HashMap<String, String>,
}

// --- Events emitted to frontend ---

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum GamificationEvent {
    XpGained {
        amount: u64,
        new_total: u64,
        source: String,
    },
    LevelUp {
        new_level: u32,
        total_xp: u64,
    },
    AchievementUnlocked {
        id: String,
        name: String,
        description: String,
        xp_reward: u64,
    },
}

// --- Frontend response ---

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GamificationResponse {
    pub total_xp: u64,
    pub current_level: u32,
    pub xp_in_current_level: u64,
    pub xp_to_next_level: u64,
    pub total_rounds_completed: u32,
    pub achievements: Vec<AchievementInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AchievementInfo {
    pub id: String,
    pub name: String,
    pub description: String,
    pub xp_reward: u64,
    pub unlocked: bool,
    pub unlocked_at: Option<String>,
}

// --- XP Curve ---

/// XP required to go from level (n-1) to level n.
/// Formula: 100 * n^1.5, rounded.
pub fn xp_for_level(level: u32) -> u64 {
    if level == 0 {
        return 0;
    }
    (100.0 * (level as f64).powf(1.5)).round() as u64
}

// --- Achievement Definitions (compile-time) ---

struct AchievementDef {
    id: &'static str,
    name: &'static str,
    description: &'static str,
    xp_reward: u64,
    condition: AchievementCondition,
}

enum AchievementCondition {
    TotalSessions(u64),
    StreakDays(u32),
    LevelReached(u32),
    RoundsCompleted(u32),
}

const ACHIEVEMENTS: &[AchievementDef] = &[
    // Milestones
    AchievementDef {
        id: "first_session",
        name: "First Focus",
        description: "Complete your first focus session",
        xp_reward: 50,
        condition: AchievementCondition::TotalSessions(1),
    },
    AchievementDef {
        id: "sessions_10",
        name: "Getting Started",
        description: "Complete 10 focus sessions",
        xp_reward: 100,
        condition: AchievementCondition::TotalSessions(10),
    },
    AchievementDef {
        id: "sessions_50",
        name: "Dedicated",
        description: "Complete 50 focus sessions",
        xp_reward: 150,
        condition: AchievementCondition::TotalSessions(50),
    },
    AchievementDef {
        id: "sessions_100",
        name: "Centurion",
        description: "Complete 100 focus sessions",
        xp_reward: 200,
        condition: AchievementCondition::TotalSessions(100),
    },
    AchievementDef {
        id: "sessions_500",
        name: "Focus Master",
        description: "Complete 500 focus sessions",
        xp_reward: 200,
        condition: AchievementCondition::TotalSessions(500),
    },
    // Streaks
    AchievementDef {
        id: "streak_3",
        name: "On a Roll",
        description: "Maintain a 3-day streak",
        xp_reward: 75,
        condition: AchievementCondition::StreakDays(3),
    },
    AchievementDef {
        id: "streak_7",
        name: "Week Warrior",
        description: "Maintain a 7-day streak",
        xp_reward: 100,
        condition: AchievementCondition::StreakDays(7),
    },
    AchievementDef {
        id: "streak_30",
        name: "Unstoppable",
        description: "Maintain a 30-day streak",
        xp_reward: 200,
        condition: AchievementCondition::StreakDays(30),
    },
    // Rounds
    AchievementDef {
        id: "first_round",
        name: "Full Circuit",
        description: "Complete your first full round",
        xp_reward: 75,
        condition: AchievementCondition::RoundsCompleted(1),
    },
    AchievementDef {
        id: "rounds_10",
        name: "Round Master",
        description: "Complete 10 full rounds",
        xp_reward: 100,
        condition: AchievementCondition::RoundsCompleted(10),
    },
    AchievementDef {
        id: "rounds_50",
        name: "Endurance",
        description: "Complete 50 full rounds",
        xp_reward: 150,
        condition: AchievementCondition::RoundsCompleted(50),
    },
    // Levels
    AchievementDef {
        id: "level_5",
        name: "Rising Star",
        description: "Reach level 5",
        xp_reward: 50,
        condition: AchievementCondition::LevelReached(5),
    },
    AchievementDef {
        id: "level_10",
        name: "Seasoned",
        description: "Reach level 10",
        xp_reward: 100,
        condition: AchievementCondition::LevelReached(10),
    },
    AchievementDef {
        id: "level_25",
        name: "Veteran",
        description: "Reach level 25",
        xp_reward: 150,
        condition: AchievementCondition::LevelReached(25),
    },
];

// --- Core Logic ---

impl GamificationState {
    pub fn load(config_dir: &PathBuf) -> Self {
        let path = config_dir.join("gamification.json");
        if let Ok(data) = fs::read_to_string(&path) {
            serde_json::from_str(&data).unwrap_or_default()
        } else {
            Self::default()
        }
    }

    pub fn save(&self, config_dir: &PathBuf) {
        let path = config_dir.join("gamification.json");
        let _ = fs::create_dir_all(config_dir);
        if let Ok(json) = serde_json::to_string_pretty(self) {
            let _ = fs::write(&path, json);
        }
    }

    /// Main entry point called after a focus session completes.
    pub fn process_focus_completion(
        &mut self,
        is_long_break: bool,
        total_sessions: u64,
        current_streak: u32,
        config_dir: &PathBuf,
    ) -> Vec<GamificationEvent> {
        let mut events = Vec::new();

        // 1. Award base XP
        let base_xp: u64 = if is_long_break { 50 } else { 25 };
        let source = if is_long_break {
            "Full round"
        } else {
            "Focus session"
        };
        self.apply_xp(base_xp, source, &mut events);

        // 2. Track rounds
        if is_long_break {
            self.total_rounds_completed += 1;
        }

        // 3. Check achievements (may award more XP via achievement rewards)
        self.check_achievements(total_sessions, current_streak, &mut events);

        // 4. Save
        self.save(config_dir);

        events
    }

    fn apply_xp(&mut self, amount: u64, source: &str, events: &mut Vec<GamificationEvent>) {
        self.total_xp += amount;
        self.xp_in_current_level += amount;

        events.push(GamificationEvent::XpGained {
            amount,
            new_total: self.total_xp,
            source: source.to_string(),
        });

        // Check for level ups (possibly multiple)
        loop {
            let next_level = self.current_level + 1;
            let xp_needed = xp_for_level(next_level);
            if xp_needed == 0 || self.xp_in_current_level < xp_needed {
                break;
            }
            self.xp_in_current_level -= xp_needed;
            self.current_level = next_level;
            events.push(GamificationEvent::LevelUp {
                new_level: self.current_level,
                total_xp: self.total_xp,
            });
        }
    }

    fn check_achievements(
        &mut self,
        total_sessions: u64,
        current_streak: u32,
        events: &mut Vec<GamificationEvent>,
    ) {
        let mut xp_from_achievements: Vec<(u64, String)> = Vec::new();

        for def in ACHIEVEMENTS {
            if self.unlocked_achievements.contains_key(def.id) {
                continue;
            }
            let met = match def.condition {
                AchievementCondition::TotalSessions(n) => total_sessions >= n,
                AchievementCondition::StreakDays(n) => current_streak >= n,
                AchievementCondition::LevelReached(n) => self.current_level >= n,
                AchievementCondition::RoundsCompleted(n) => self.total_rounds_completed >= n,
            };
            if met {
                let now = Utc::now().to_rfc3339();
                self.unlocked_achievements.insert(def.id.to_string(), now);
                events.push(GamificationEvent::AchievementUnlocked {
                    id: def.id.to_string(),
                    name: def.name.to_string(),
                    description: def.description.to_string(),
                    xp_reward: def.xp_reward,
                });
                xp_from_achievements.push((def.xp_reward, def.name.to_string()));
            }
        }

        // Award achievement XP (may trigger further level ups)
        for (xp, name) in xp_from_achievements {
            self.apply_xp(xp, &format!("Achievement: {}", name), &mut *events);
        }
    }

    pub fn get_response(&self) -> GamificationResponse {
        let xp_to_next = xp_for_level(self.current_level + 1);
        let achievements = ACHIEVEMENTS
            .iter()
            .map(|def| {
                let unlock = self.unlocked_achievements.get(def.id);
                AchievementInfo {
                    id: def.id.to_string(),
                    name: def.name.to_string(),
                    description: def.description.to_string(),
                    xp_reward: def.xp_reward,
                    unlocked: unlock.is_some(),
                    unlocked_at: unlock.cloned(),
                }
            })
            .collect();

        GamificationResponse {
            total_xp: self.total_xp,
            current_level: self.current_level,
            xp_in_current_level: self.xp_in_current_level,
            xp_to_next_level: xp_to_next,
            total_rounds_completed: self.total_rounds_completed,
            achievements,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn xp_curve_level_1() {
        assert_eq!(xp_for_level(1), 100);
    }

    #[test]
    fn xp_curve_level_2() {
        assert_eq!(xp_for_level(2), 283);
    }

    #[test]
    fn xp_curve_level_10() {
        assert_eq!(xp_for_level(10), 3162);
    }

    #[test]
    fn xp_curve_level_0_returns_0() {
        assert_eq!(xp_for_level(0), 0);
    }

    #[test]
    fn apply_xp_no_level_up() {
        let mut state = GamificationState::default();
        let mut events = Vec::new();
        state.apply_xp(50, "test", &mut events);
        assert_eq!(state.total_xp, 50);
        assert_eq!(state.current_level, 0);
        assert_eq!(state.xp_in_current_level, 50);
        assert_eq!(events.len(), 1); // only XpGained
    }

    #[test]
    fn apply_xp_single_level_up() {
        let mut state = GamificationState::default();
        let mut events = Vec::new();
        // Level 0→1 requires xp_for_level(1) = 100
        state.apply_xp(100, "test", &mut events);
        assert_eq!(state.current_level, 1);
        assert_eq!(state.xp_in_current_level, 0);
        assert_eq!(events.len(), 2); // XpGained + LevelUp
    }

    #[test]
    fn apply_xp_multiple_level_ups() {
        let mut state = GamificationState::default();
        let mut events = Vec::new();
        // Level 0→1 = 100, level 1→2 = 283. Total to reach level 2 = 383.
        state.apply_xp(400, "test", &mut events);
        assert_eq!(state.current_level, 2);
        assert_eq!(state.xp_in_current_level, 17); // 400 - 100 - 283
        assert_eq!(events.len(), 3); // XpGained + 2x LevelUp
    }

    #[test]
    fn process_focus_completion_short_break() {
        let mut state = GamificationState::default();
        let dir = PathBuf::from("/tmp/pulsodoro_test_nonexistent");
        let events = state.process_focus_completion(false, 1, 1, &dir);
        // Should get: XpGained(25) + first_session achievement + XpGained(50 from achievement) + possibly level up
        assert!(events
            .iter()
            .any(|e| matches!(e, GamificationEvent::XpGained { amount: 25, .. })));
        assert_eq!(state.total_rounds_completed, 0);
    }

    #[test]
    fn process_focus_completion_long_break() {
        let mut state = GamificationState::default();
        let dir = PathBuf::from("/tmp/pulsodoro_test_nonexistent");
        let events = state.process_focus_completion(true, 1, 1, &dir);
        assert!(events
            .iter()
            .any(|e| matches!(e, GamificationEvent::XpGained { amount: 50, .. })));
        assert_eq!(state.total_rounds_completed, 1);
    }

    #[test]
    fn achievement_not_double_unlocked() {
        let mut state = GamificationState::default();
        let dir = PathBuf::from("/tmp/pulsodoro_test_nonexistent");
        state.process_focus_completion(false, 1, 1, &dir);
        let events2 = state.process_focus_completion(false, 2, 1, &dir);
        // first_session should NOT appear in second batch
        assert!(!events2.iter().any(|e| matches!(
            e,
            GamificationEvent::AchievementUnlocked { ref id, .. } if id == "first_session"
        )));
    }

    #[test]
    fn round_trip_serialization() {
        let mut state = GamificationState::default();
        state.total_xp = 500;
        state.current_level = 3;
        state.xp_in_current_level = 42;
        state.total_rounds_completed = 7;
        state.unlocked_achievements.insert(
            "first_session".to_string(),
            "2026-03-11T00:00:00Z".to_string(),
        );

        let json = serde_json::to_string(&state).unwrap();
        let loaded: GamificationState = serde_json::from_str(&json).unwrap();
        assert_eq!(loaded.total_xp, 500);
        assert_eq!(loaded.current_level, 3);
        assert_eq!(loaded.xp_in_current_level, 42);
        assert_eq!(loaded.total_rounds_completed, 7);
        assert!(loaded.unlocked_achievements.contains_key("first_session"));
    }

    #[test]
    fn default_state_loads_from_empty_json() {
        let state: GamificationState = serde_json::from_str("{}").unwrap();
        assert_eq!(state.total_xp, 0);
        assert_eq!(state.current_level, 0);
        assert!(state.unlocked_achievements.is_empty());
    }

    #[test]
    fn get_response_includes_all_achievements() {
        let state = GamificationState::default();
        let resp = state.get_response();
        assert_eq!(resp.achievements.len(), ACHIEVEMENTS.len());
        assert!(resp.achievements.iter().all(|a| !a.unlocked));
    }
}
