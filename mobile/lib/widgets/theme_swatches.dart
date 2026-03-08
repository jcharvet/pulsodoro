import 'package:flutter/material.dart';
import '../theme/tokens.dart';

class ThemeSwatches extends StatelessWidget {
  final String selectedTheme;
  final ValueChanged<String> onSelect;

  const ThemeSwatches({
    super.key,
    required this.selectedTheme,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: AppThemes.themes.entries.map((entry) {
            final t = entry.value;
            final isSelected = entry.key == selectedTheme;
            return GestureDetector(
              onTap: () => onSelect(entry.key),
              child: Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [t.focus, t.shortBreak],
                  ),
                  border: isSelected
                      ? Border.all(color: Colors.white, width: 2.5)
                      : Border.all(color: Colors.white.withValues(alpha: 0.1), width: 1),
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 8),
        Center(
          child: Text(
            AppThemes.get(selectedTheme).name,
            style: TextStyle(
              fontSize: 13,
              color: AppThemes.get(selectedTheme).textMuted,
            ),
          ),
        ),
      ],
    );
  }
}
