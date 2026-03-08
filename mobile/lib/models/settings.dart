class AppSettings {
  final int focusMinutes;
  final int shortBreakMinutes;
  final int longBreakMinutes;
  final bool soundEnabled;
  final bool showProgressRing;
  final String theme;
  final String uiStyle;
  final String font;
  final bool changeWallpaper;
  final String focusBackground;
  final String breakBackground;

  const AppSettings({
    this.focusMinutes = 25,
    this.shortBreakMinutes = 5,
    this.longBreakMinutes = 15,
    this.soundEnabled = true,
    this.showProgressRing = true,
    this.theme = 'midnight',
    this.uiStyle = 'glass',
    this.font = 'segoe',
    this.changeWallpaper = false,
    this.focusBackground = '',
    this.breakBackground = '',
  });

  AppSettings copyWith({
    int? focusMinutes,
    int? shortBreakMinutes,
    int? longBreakMinutes,
    bool? soundEnabled,
    bool? showProgressRing,
    String? theme,
    String? uiStyle,
    String? font,
    bool? changeWallpaper,
    String? focusBackground,
    String? breakBackground,
  }) {
    return AppSettings(
      focusMinutes: focusMinutes ?? this.focusMinutes,
      shortBreakMinutes: shortBreakMinutes ?? this.shortBreakMinutes,
      longBreakMinutes: longBreakMinutes ?? this.longBreakMinutes,
      soundEnabled: soundEnabled ?? this.soundEnabled,
      showProgressRing: showProgressRing ?? this.showProgressRing,
      theme: theme ?? this.theme,
      uiStyle: uiStyle ?? this.uiStyle,
      font: font ?? this.font,
      changeWallpaper: changeWallpaper ?? this.changeWallpaper,
      focusBackground: focusBackground ?? this.focusBackground,
      breakBackground: breakBackground ?? this.breakBackground,
    );
  }

  Map<String, dynamic> toJson() => {
    'focusMinutes': focusMinutes,
    'shortBreakMinutes': shortBreakMinutes,
    'longBreakMinutes': longBreakMinutes,
    'soundEnabled': soundEnabled,
    'showProgressRing': showProgressRing,
    'theme': theme,
    'uiStyle': uiStyle,
    'font': font,
    'changeWallpaper': changeWallpaper,
    'focusBackground': focusBackground,
    'breakBackground': breakBackground,
  };

  factory AppSettings.fromJson(Map<String, dynamic> json) => AppSettings(
    focusMinutes: json['focusMinutes'] ?? 25,
    shortBreakMinutes: json['shortBreakMinutes'] ?? 5,
    longBreakMinutes: json['longBreakMinutes'] ?? 15,
    soundEnabled: json['soundEnabled'] ?? true,
    showProgressRing: json['showProgressRing'] ?? true,
    theme: json['theme'] ?? 'midnight',
    uiStyle: json['uiStyle'] ?? 'glass',
    font: json['font'] ?? 'segoe',
    changeWallpaper: json['changeWallpaper'] ?? false,
    focusBackground: json['focusBackground'] ?? '',
    breakBackground: json['breakBackground'] ?? '',
  );
}
