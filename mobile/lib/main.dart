import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'models/timer_state.dart';
import 'services/timer_service.dart';
import 'services/settings_service.dart';
import 'services/stats_service.dart';
import 'services/audio_service.dart';
import 'services/notification_service.dart';
import 'services/foreground_service.dart';
import 'screens/timer_screen.dart';
import 'screens/stats_screen.dart';
import 'screens/settings_screen.dart';
import 'theme/tokens.dart';
import 'theme/app_theme.dart';
import 'widgets/glass_panel.dart';
import 'widgets/glass_nav_bar.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  runApp(const PulsodoroApp());
}

class PulsodoroApp extends StatefulWidget {
  const PulsodoroApp({super.key});

  @override
  State<PulsodoroApp> createState() => _PulsodoroAppState();
}

class _PulsodoroAppState extends State<PulsodoroApp> {
  final _timerService = TimerService();
  final _settingsService = SettingsService();
  final _statsService = StatsService();
  final _audioService = AudioService();
  final _notificationService = NotificationService();

  Timer? _ticker;
  int _tabIndex = 0;
  bool _settingsOpen = false;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    await _settingsService.load();
    await _statsService.load();
    await _notificationService.init();
    await ForegroundTimerService.init();

    // Apply saved durations
    final s = _settingsService.settings;
    _timerService.setDurations(
      focus: s.focusMinutes,
      shortBreak: s.shortBreakMinutes,
      longBreak: s.longBreakMinutes,
    );

    // Listen for settings changes to update timer durations
    _settingsService.addListener(_onSettingsChanged);

    // Listen for timer transitions to record stats
    _timerService.addListener(_onTimerChanged);

    // Start the 1-second ticker
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
      final transition = _timerService.tick();
      if (transition != null) {
        _onTransition(transition);
      }
      // Update foreground notification with countdown
      final status = _timerService.status;
      if (status.isRunning) {
        ForegroundTimerService.updateNotification(
          '${_stateLabel(status.state)} - ${status.timeDisplay}',
        );
      }
    });

    setState(() {});
  }

  void _onSettingsChanged() {
    final s = _settingsService.settings;
    _timerService.setDurations(
      focus: s.focusMinutes,
      shortBreak: s.shortBreakMinutes,
      longBreak: s.longBreakMinutes,
    );
    setState(() {}); // Rebuild with new theme
  }

  TimerState? _prevState;
  void _onTimerChanged() {
    final current = _timerService.status.state;
    final isRunning = _timerService.status.isRunning;

    // Record completion when Focus ends (transitions to a break)
    if (_prevState == TimerState.focus &&
        (current == TimerState.shortBreak || current == TimerState.longBreak)) {
      _statsService.recordCompletion();
    }

    // Manage foreground service
    if (isRunning && current != TimerState.idle) {
      ForegroundTimerService.start();
    } else if (current == TimerState.idle) {
      ForegroundTimerService.stop();
    }

    _prevState = current;
  }

  void _onTransition(TimerState newState) {
    if (_settingsService.settings.soundEnabled) {
      _audioService.playChime();
    }
    _notificationService.showTransition(newState);
  }

  String _stateLabel(TimerState state) {
    return switch (state) {
      TimerState.idle || TimerState.focus => 'Focus',
      TimerState.shortBreak => 'Short Break',
      TimerState.longBreak => 'Long Break',
    };
  }

  @override
  void dispose() {
    _ticker?.cancel();
    _settingsService.removeListener(_onSettingsChanged);
    _timerService.removeListener(_onTimerChanged);
    _timerService.dispose();
    _settingsService.dispose();
    _statsService.dispose();
    _audioService.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final themeId = _settingsService.settings.theme;
    final theme = AppThemes.get(themeId);
    final accent = _accentForState(_timerService.status, theme);

    return MaterialApp(
      title: 'PulsoDoro',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(theme),
      home: Stack(
        children: [
          // Main scaffold
          Scaffold(
            body: Container(
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
                    // Top bar
                    _buildTopBar(theme, accent),
                    // Screen content
                    Expanded(
                      child: _tabIndex == 0
                          ? TimerScreen(
                              timerService: _timerService,
                              theme: theme,
                              onOpenSettings: () =>
                                  setState(() => _settingsOpen = true),
                            )
                          : StatsScreen(
                              statsService: _statsService,
                              theme: theme,
                              accent: accent,
                            ),
                    ),
                    // Bottom nav
                    GlassNavBar(
                      selectedIndex: _tabIndex,
                      soundEnabled: _settingsService.settings.soundEnabled,
                      accent: accent,
                      theme: theme,
                      onTabTap: (i) => setState(() => _tabIndex = i),
                      onSoundToggle: () {
                        final s = _settingsService.settings;
                        _settingsService.update(
                          s.copyWith(soundEnabled: !s.soundEnabled),
                        );
                      },
                    ),
                    const SizedBox(height: 12),
                  ],
                ),
              ),
            ),
          ),
          // Settings overlay
          if (_settingsOpen)
            SettingsScreen(
              settingsService: _settingsService,
              theme: theme,
              accent: accent,
              onClose: () => setState(() => _settingsOpen = false),
            ),
        ],
      ),
    );
  }

  Widget _buildTopBar(PulsodoroTheme theme, Color accent) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: GlassPanel(
        color: theme.surface,
        borderColor: theme.surfaceBorder,
        blur: theme.blur,
        child: SizedBox(
          height: 44,
          child: Row(
            children: [
              const SizedBox(width: 16),
              Text(
                'PulsoDoro',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: theme.textPrimary.withValues(alpha: 0.8),
                ),
              ),
              const Spacer(),
              ListenableBuilder(
                listenable: _timerService,
                builder: (context, _) {
                  final status = _timerService.status;
                  return Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: accent.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      'Round ${status.cycle}/4',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                        color: accent.withValues(alpha: 0.8),
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(width: 12),
              GestureDetector(
                onTap: () => setState(() => _settingsOpen = true),
                child: Icon(
                  Icons.settings_outlined,
                  size: 18,
                  color: theme.textMuted.withValues(alpha: 0.6),
                ),
              ),
              const SizedBox(width: 16),
            ],
          ),
        ),
      ),
    );
  }

  Color _accentForState(TimerStatus status, PulsodoroTheme theme) {
    return switch (status.state) {
      TimerState.idle || TimerState.focus => theme.focus,
      TimerState.shortBreak => theme.shortBreak,
      TimerState.longBreak => theme.longBreak,
    };
  }
}
