import 'package:flutter/material.dart';
import '../models/timer_state.dart';
import '../services/timer_service.dart';
import '../theme/tokens.dart';
import '../widgets/glass_panel.dart';
import '../widgets/progress_ring.dart';
import '../widgets/break_activity.dart';

class TimerScreen extends StatelessWidget {
  final TimerService timerService;
  final PulsodoroTheme theme;
  final VoidCallback onOpenSettings;

  const TimerScreen({
    super.key,
    required this.timerService,
    required this.theme,
    required this.onOpenSettings,
  });

  Color _accentColor(TimerStatus status) {
    return switch (status.state) {
      TimerState.idle || TimerState.focus => theme.focus,
      TimerState.shortBreak => theme.shortBreak,
      TimerState.longBreak => theme.longBreak,
    };
  }

  String _stateLabel(TimerStatus status) {
    return switch (status.state) {
      TimerState.idle || TimerState.focus => 'FOCUS',
      TimerState.shortBreak => 'SHORT BREAK',
      TimerState.longBreak => 'LONG BREAK',
    };
  }

  String _subtitle(TimerStatus status) {
    if (status.state == TimerState.idle) return 'Ready';
    if (!status.isRunning) return 'Paused';
    if (status.state == TimerState.focus) return 'Running...';
    if (status.state == TimerState.longBreak) return 'Long break!';
    return 'Relax!';
  }

  String _buttonLabel(TimerStatus status) {
    if (status.state == TimerState.idle) return 'Start Session';
    if (!status.isRunning) return 'Resume';
    if (status.state == TimerState.focus) return 'Pause';
    return 'Start Break';
  }

  String _secondaryLabel(TimerStatus status) {
    if (status.state == TimerState.idle) return 'Pomodoro settings';
    if (status.state == TimerState.focus) {
      return status.isRunning ? 'End focus session' : 'Reset';
    }
    return 'Skip this break';
  }

  void _onPrimaryTap(TimerStatus status) {
    if (status.state == TimerState.idle) {
      timerService.start();
    } else if (status.isRunning) {
      timerService.pause();
    } else {
      timerService.start();
    }
  }

  void _onSecondaryTap(TimerStatus status) {
    if (status.state == TimerState.idle) {
      onOpenSettings();
    } else if (status.state == TimerState.focus && !status.isRunning) {
      timerService.reset();
    } else {
      timerService.skip();
    }
  }

  bool _isBreak(TimerState state) =>
      state == TimerState.shortBreak || state == TimerState.longBreak;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: timerService,
      builder: (context, _) {
        final status = timerService.status;
        final accent = _accentColor(status);

        return Column(
          children: [
            // Scrollable content area
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    const SizedBox(height: 20),
                    // State label
                    Text(
                      _stateLabel(status),
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 3,
                        color: accent.withValues(alpha: 0.7),
                      ),
                    ),
                    const SizedBox(height: 24),
                    // Progress ring in glass circle
                    Container(
                      width: 280,
                      height: 280,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white.withValues(alpha: 0.04),
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.08),
                          width: 1,
                        ),
                      ),
                      child: ProgressRing(
                        progress: status.progress,
                        color: accent,
                        size: 280,
                        showTicks: true,
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              status.timeDisplay,
                              style: TextStyle(
                                fontSize: 52,
                                fontWeight: FontWeight.w600,
                                color: theme.textPrimary,
                                letterSpacing: 3,
                                height: 1,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              _subtitle(status),
                              style: TextStyle(
                                fontSize: 13,
                                color: accent.withValues(alpha: 0.6),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    // Break activity card
                    if (_isBreak(status.state))
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 40),
                        child: BreakActivityCard(theme: theme),
                      ),
                    if (_isBreak(status.state)) const SizedBox(height: 12),
                    // Session dots in glass pill
                    GlassPanel(
                      color: theme.surface,
                      borderColor: theme.surfaceBorder,
                      blur: theme.blur,
                      borderRadius: 20,
                      padding:
                          const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: List.generate(4, (i) {
                          final roundIndex = i + 1;
                          final isComplete = roundIndex < status.cycle;
                          final isCurrent = roundIndex == status.cycle &&
                              status.state != TimerState.idle;
                          return Container(
                            width: 10,
                            height: 10,
                            margin: const EdgeInsets.symmetric(horizontal: 6),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: isComplete || isCurrent
                                  ? accent
                                  : Colors.white.withValues(alpha: 0.08),
                            ),
                          );
                        }),
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
            // Control panel (pinned at bottom)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: GlassPanel(
                color: theme.surface,
                borderColor: theme.surfaceBorder,
                blur: theme.blur,
                borderRadius: 16,
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        onPressed: () => _onPrimaryTap(status),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: accent,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 0,
                        ),
                        child: Text(
                          _buttonLabel(status),
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    GestureDetector(
                      onTap: () => _onSecondaryTap(status),
                      child: Text(
                        _secondaryLabel(status),
                        style: TextStyle(
                          fontSize: 13,
                          color: theme.textMuted.withValues(alpha: 0.5),
                          decoration: TextDecoration.underline,
                          decorationColor:
                              theme.textMuted.withValues(alpha: 0.3),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],
        );
      },
    );
  }
}
