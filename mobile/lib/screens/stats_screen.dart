import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/stats_service.dart';
import '../theme/tokens.dart';
import '../widgets/glass_panel.dart';

class StatsScreen extends StatelessWidget {
  final StatsService statsService;
  final PulsodoroTheme theme;
  final Color accent;

  const StatsScreen({
    super.key,
    required this.statsService,
    required this.theme,
    required this.accent,
  });

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: statsService,
      builder: (context, _) {
        final stats = statsService.getStats();
        final maxDaily = stats.daily.values.fold(0, (a, b) => a > b ? a : b);

        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            children: [
              const SizedBox(height: 40),
              // Today hero
              Text('Today', style: TextStyle(fontSize: 14, color: theme.textMuted)),
              const SizedBox(height: 8),
              Text(
                '${stats.today}',
                style: TextStyle(
                  fontSize: 64,
                  fontWeight: FontWeight.w700,
                  color: accent,
                  height: 1,
                ),
              ),
              const SizedBox(height: 4),
              Text('sessions', style: TextStyle(fontSize: 14, color: theme.textDim)),
              const SizedBox(height: 32),
              // Week total
              GlassPanel(
                color: theme.surface,
                borderColor: theme.surfaceBorder,
                blur: theme.blur,
                borderRadius: 14,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('This Week', style: TextStyle(fontSize: 15, color: theme.textPrimary)),
                    Text(
                      '${stats.week}',
                      style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: accent),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              // 7-day chart
              GlassPanel(
                color: theme.surface,
                borderColor: theme.surfaceBorder,
                blur: theme.blur,
                borderRadius: 14,
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    // Day labels
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: List.generate(7, (i) {
                        final date = DateTime.now().subtract(Duration(days: 6 - i));
                        return Text(
                          DateFormat('E').format(date).substring(0, 1),
                          style: TextStyle(fontSize: 12, color: theme.textDim),
                        );
                      }),
                    ),
                    const SizedBox(height: 12),
                    // Bars
                    SizedBox(
                      height: 100,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: List.generate(7, (i) {
                          final date = DateTime.now().subtract(Duration(days: 6 - i));
                          final key = DateFormat('yyyy-MM-dd').format(date);
                          final count = stats.daily[key] ?? 0;
                          final height = maxDaily > 0 ? (count / maxDaily) * 80 : 0.0;
                          return Column(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              if (count > 0)
                                Text(
                                  '$count',
                                  style: TextStyle(fontSize: 10, color: theme.textDim),
                                ),
                              const SizedBox(height: 4),
                              Container(
                                width: 24,
                                height: height + 4, // minimum 4px
                                decoration: BoxDecoration(
                                  color: count > 0
                                      ? accent.withValues(alpha: 0.7)
                                      : Colors.white.withValues(alpha: 0.06),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                              ),
                            ],
                          );
                        }),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
