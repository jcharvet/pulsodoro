import 'package:flutter/material.dart';
import '../theme/tokens.dart';
import 'glass_panel.dart';

class GlassNavBar extends StatelessWidget {
  final int selectedIndex; // 0=timer, 1=stats
  final bool soundEnabled;
  final Color accent;
  final PulsodoroTheme theme;
  final ValueChanged<int> onTabTap;
  final VoidCallback onSoundToggle;

  const GlassNavBar({
    super.key,
    required this.selectedIndex,
    required this.soundEnabled,
    required this.accent,
    required this.theme,
    required this.onTabTap,
    required this.onSoundToggle,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: GlassPanel(
        color: theme.surface,
        borderColor: theme.surfaceBorder,
        blur: theme.blur,
        borderRadius: 14,
        child: SizedBox(
          height: 50,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _navIcon(Icons.timer_outlined, 0),
              _navIcon(Icons.bar_chart_rounded, 1),
              // Sound toggle (not a screen, just a toggle)
              GestureDetector(
                onTap: onSoundToggle,
                child: Icon(
                  soundEnabled
                      ? Icons.volume_up_rounded
                      : Icons.volume_off_rounded,
                  size: 20,
                  color: soundEnabled
                      ? accent.withValues(alpha: 0.8)
                      : theme.textDim.withValues(alpha: 0.4),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _navIcon(IconData icon, int index) {
    final isActive = selectedIndex == index;
    return GestureDetector(
      onTap: () => onTabTap(index),
      child: Icon(
        icon,
        size: 20,
        color: isActive
            ? accent.withValues(alpha: 0.8)
            : theme.textDim.withValues(alpha: 0.4),
      ),
    );
  }
}
