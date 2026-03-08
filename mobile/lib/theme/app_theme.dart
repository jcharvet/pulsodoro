import 'package:flutter/material.dart';
import 'tokens.dart';

ThemeData buildAppTheme(PulsodoroTheme tokens) {
  return ThemeData.dark().copyWith(
    scaffoldBackgroundColor: tokens.bgGradient[0],
    colorScheme: ColorScheme.dark(
      primary: tokens.focus,
      secondary: tokens.shortBreak,
      tertiary: tokens.longBreak,
      surface: tokens.settingsBg,
    ),
    textTheme: TextTheme(
      bodyLarge: TextStyle(color: tokens.textPrimary),
      bodyMedium: TextStyle(color: tokens.textMuted),
      bodySmall: TextStyle(color: tokens.textDim),
    ),
  );
}
