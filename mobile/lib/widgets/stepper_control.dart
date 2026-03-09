import 'package:flutter/material.dart';
import '../theme/tokens.dart';

class StepperControl extends StatelessWidget {
  final String label;
  final int value;
  final int min;
  final int max;
  final Color accent;
  final PulsodoroTheme theme;
  final ValueChanged<int> onChanged;

  const StepperControl({
    super.key,
    required this.label,
    required this.value,
    required this.accent,
    required this.theme,
    required this.onChanged,
    this.min = 1,
    this.max = 120,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            label,
            style: TextStyle(fontSize: 15, color: theme.textPrimary),
          ),
        ),
        GestureDetector(
          onTap: value > min ? () => onChanged(value - 1) : null,
          child: Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: theme.surface,
            ),
            alignment: Alignment.center,
            child: Icon(Icons.remove, size: 18, color: theme.textMuted),
          ),
        ),
        const SizedBox(width: 12),
        SizedBox(
          width: 36,
          child: Text(
            '$value',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: accent,
            ),
          ),
        ),
        const SizedBox(width: 12),
        GestureDetector(
          onTap: value < max ? () => onChanged(value + 1) : null,
          child: Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: theme.surface,
            ),
            alignment: Alignment.center,
            child: Icon(Icons.add, size: 18, color: theme.textMuted),
          ),
        ),
      ],
    );
  }
}
