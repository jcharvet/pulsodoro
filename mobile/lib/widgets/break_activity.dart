import 'dart:math';
import 'package:flutter/material.dart';
import '../theme/tokens.dart';
import 'glass_panel.dart';

class BreakActivityCard extends StatelessWidget {
  final PulsodoroTheme theme;

  const BreakActivityCard({super.key, required this.theme});

  static const _activities = [
    ('Deep breathing', 'Take 5 deep breaths'),
    ('Stretch', 'Stand up and stretch your body'),
    ('Eye rest', 'Look at something 20ft away for 20 seconds'),
    ('Hydrate', 'Drink a glass of water'),
    ('Walk', 'Take a short walk around'),
    ('Shoulders', 'Roll your shoulders 10 times'),
    ('Wrists', 'Stretch your wrists and fingers'),
    ('Fresh air', 'Step outside for a moment'),
  ];

  @override
  Widget build(BuildContext context) {
    final activity = _activities[Random().nextInt(_activities.length)];
    return GlassPanel(
      color: theme.surface,
      borderColor: theme.surfaceBorder,
      blur: theme.blur,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      child: Column(
        children: [
          Text(
            activity.$1,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: theme.textPrimary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            activity.$2,
            style: TextStyle(fontSize: 12, color: theme.textMuted),
          ),
        ],
      ),
    );
  }
}
