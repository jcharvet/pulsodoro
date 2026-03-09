import 'package:flutter/material.dart';

class PulsodoroTheme {
  final String id;
  final String name;
  final String description;
  final Color focus;
  final Color shortBreak;
  final Color longBreak;
  final List<Color> bgGradient;
  final Color surface;
  final Color surfaceHover;
  final Color surfaceBorder;
  final Color textPrimary;
  final Color textMuted;
  final Color textDim;
  final Color settingsBg;
  final Color overlay;
  final double blur;

  const PulsodoroTheme({
    required this.id,
    required this.name,
    required this.description,
    required this.focus,
    required this.shortBreak,
    required this.longBreak,
    required this.bgGradient,
    required this.surface,
    required this.surfaceHover,
    required this.surfaceBorder,
    required this.textPrimary,
    required this.textMuted,
    required this.textDim,
    required this.settingsBg,
    required this.overlay,
    required this.blur,
  });
}

class AppThemes {
  static const themes = <String, PulsodoroTheme>{
    'midnight': PulsodoroTheme(
      id: 'midnight',
      name: 'Midnight',
      description: 'The classic PulsoDoro look',
      focus: Color(0xFFE94560),
      shortBreak: Color(0xFF2ECC71),
      longBreak: Color(0xFF9B59B6),
      bgGradient: [Color(0xFF1A1A2E), Color(0xFF16213E), Color(0xFF0F3460)],
      surface: Color(0x14FFFFFF),       // rgba(255,255,255,0.08)
      surfaceHover: Color(0x26FFFFFF),  // rgba(255,255,255,0.15)
      surfaceBorder: Color(0x26FFFFFF), // rgba(255,255,255,0.15)
      textPrimary: Color(0xFFE0E0E0),
      textMuted: Color(0xFFAAAAAA),
      textDim: Color(0xFF888888),
      settingsBg: Color(0xFF1A1A2E),
      overlay: Color(0x80000000),
      blur: 12,
    ),
    'ember': PulsodoroTheme(
      id: 'ember',
      name: 'Ember',
      description: 'Warm and cozy',
      focus: Color(0xFFE67E22),
      shortBreak: Color(0xFF27AE60),
      longBreak: Color(0xFFF1C40F),
      bgGradient: [Color(0xFF1A1210), Color(0xFF2C1810), Color(0xFF3D2014)],
      surface: Color(0x0FFFC896),       // rgba(255,200,150,0.06)
      surfaceHover: Color(0x1FFFC896),  // rgba(255,200,150,0.12)
      surfaceBorder: Color(0x26FFB478), // rgba(255,180,120,0.15)
      textPrimary: Color(0xFFF0E0D0),
      textMuted: Color(0xFFC0A890),
      textDim: Color(0xFF907060),
      settingsBg: Color(0xFF1A1210),
      overlay: Color(0x800A0500),
      blur: 14,
    ),
    'arctic': PulsodoroTheme(
      id: 'arctic',
      name: 'Arctic',
      description: 'Cool and crisp',
      focus: Color(0xFF3498DB),
      shortBreak: Color(0xFF1ABC9C),
      longBreak: Color(0xFFA29BFE),
      bgGradient: [Color(0xFF0A0E1A), Color(0xFF0D1B2A), Color(0xFF1B2838)],
      surface: Color(0x0F96C8FF),       // rgba(150,200,255,0.06)
      surfaceHover: Color(0x1F96C8FF),  // rgba(150,200,255,0.12)
      surfaceBorder: Color(0x2696C8FF), // rgba(150,200,255,0.15)
      textPrimary: Color(0xFFE8F0F8),
      textMuted: Color(0xFFA0B8D0),
      textDim: Color(0xFF708898),
      settingsBg: Color(0xFF0A0E1A),
      overlay: Color(0x8000050F),
      blur: 10,
    ),
    'sakura': PulsodoroTheme(
      id: 'sakura',
      name: 'Sakura',
      description: 'Cherry blossom spring',
      focus: Color(0xFFE891B0),
      shortBreak: Color(0xFFA8D8A8),
      longBreak: Color(0xFFC9A8E8),
      bgGradient: [Color(0xFF2A1520), Color(0xFF301A28), Color(0xFF1E1525)],
      surface: Color(0x0FE891B0),       // rgba(232,145,176,0.06)
      surfaceHover: Color(0x1FE891B0),  // rgba(232,145,176,0.12)
      surfaceBorder: Color(0x26E891B0), // rgba(232,145,176,0.15)
      textPrimary: Color(0xFFF0E0E8),
      textMuted: Color(0xFFC8A0B0),
      textDim: Color(0xFF907080),
      settingsBg: Color(0xFF2A1520),
      overlay: Color(0x800F050A),
      blur: 14,
    ),
    'matcha': PulsodoroTheme(
      id: 'matcha',
      name: 'Matcha',
      description: 'Calm green tea',
      focus: Color(0xFF7AB648),
      shortBreak: Color(0xFF48B6A0),
      longBreak: Color(0xFFB6A848),
      bgGradient: [Color(0xFF0E1A0E), Color(0xFF142018), Color(0xFF1A2614)],
      surface: Color(0x0F7AB648),       // rgba(122,182,72,0.06)
      surfaceHover: Color(0x1F7AB648),  // rgba(122,182,72,0.12)
      surfaceBorder: Color(0x1F7AB648), // rgba(122,182,72,0.12)
      textPrimary: Color(0xFFE0F0D8),
      textMuted: Color(0xFFA0C090),
      textDim: Color(0xFF688060),
      settingsBg: Color(0xFF0E1A0E),
      overlay: Color(0x80050A05),
      blur: 12,
    ),
  };

  static PulsodoroTheme get(String id) => themes[id] ?? themes['midnight']!;
}
