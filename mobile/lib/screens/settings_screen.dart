import 'package:flutter/material.dart';
import '../models/settings.dart';
import '../services/settings_service.dart';
import '../theme/tokens.dart';
import '../widgets/stepper_control.dart';
import '../widgets/theme_swatches.dart';

class SettingsScreen extends StatelessWidget {
  final SettingsService settingsService;
  final PulsodoroTheme theme;
  final Color accent;
  final VoidCallback onClose;

  const SettingsScreen({
    super.key,
    required this.settingsService,
    required this.theme,
    required this.accent,
    required this.onClose,
  });

  void _update(AppSettings s) => settingsService.update(s);

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: settingsService,
      builder: (context, _) {
        final s = settingsService.settings;
        return Material(
          type: MaterialType.transparency,
          child: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: theme.bgGradient,
              ),
            ),
            child: SafeArea(
            child: Column(
              children: [
                // Header
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  child: Row(
                    children: [
                      IconButton(
                        onPressed: onClose,
                        icon: Icon(Icons.arrow_back, color: theme.textPrimary),
                      ),
                      Text(
                        'Settings',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w600,
                          color: theme.textPrimary,
                        ),
                      ),
                    ],
                  ),
                ),
                // Scrollable settings
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    children: [
                      _sectionLabel('TIMER'),
                      const SizedBox(height: 12),
                      StepperControl(
                        label: 'Focus',
                        value: s.focusMinutes,
                        accent: accent,
                        theme: theme,
                        max: 120,
                        onChanged: (v) => _update(s.copyWith(focusMinutes: v)),
                      ),
                      const SizedBox(height: 16),
                      StepperControl(
                        label: 'Short Break',
                        value: s.shortBreakMinutes,
                        accent: accent,
                        theme: theme,
                        max: 60,
                        onChanged: (v) => _update(s.copyWith(shortBreakMinutes: v)),
                      ),
                      const SizedBox(height: 16),
                      StepperControl(
                        label: 'Long Break',
                        value: s.longBreakMinutes,
                        accent: accent,
                        theme: theme,
                        max: 60,
                        onChanged: (v) => _update(s.copyWith(longBreakMinutes: v)),
                      ),
                      const SizedBox(height: 28),
                      _sectionLabel('SOUND'),
                      const SizedBox(height: 12),
                      _toggleRow('Transition chime', s.soundEnabled,
                          (v) => _update(s.copyWith(soundEnabled: v))),
                      const SizedBox(height: 28),
                      _sectionLabel('THEME'),
                      const SizedBox(height: 12),
                      ThemeSwatches(
                        selectedTheme: s.theme,
                        onSelect: (id) => _update(s.copyWith(theme: id)),
                      ),
                      const SizedBox(height: 28),
                      _sectionLabel('APPEARANCE'),
                      const SizedBox(height: 12),
                      _toggleRow('Progress ring', s.showProgressRing,
                          (v) => _update(s.copyWith(showProgressRing: v))),
                      const SizedBox(height: 40),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        );
      },
    );
  }

  Widget _sectionLabel(String text) {
    return Text(
      text,
      style: TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w600,
        letterSpacing: 2,
        color: theme.textDim,
      ),
    );
  }

  Widget _toggleRow(String label, bool value, ValueChanged<bool> onChanged) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(fontSize: 15, color: theme.textPrimary)),
        Switch(
          value: value,
          onChanged: onChanged,
          activeThumbColor: accent,
          inactiveTrackColor: theme.surface,
        ),
      ],
    );
  }
}
