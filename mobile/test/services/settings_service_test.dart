import 'package:flutter_test/flutter_test.dart';
import 'package:pulsodoro/models/settings.dart';

void main() {
  group('AppSettings', () {
    test('defaults are correct', () {
      const s = AppSettings();
      expect(s.focusMinutes, 25);
      expect(s.shortBreakMinutes, 5);
      expect(s.longBreakMinutes, 15);
      expect(s.soundEnabled, true);
      expect(s.theme, 'midnight');
    });

    test('toJson and fromJson round-trip', () {
      const original = AppSettings(
        focusMinutes: 30,
        theme: 'ember',
        soundEnabled: false,
      );
      final json = original.toJson();
      final restored = AppSettings.fromJson(json);
      expect(restored.focusMinutes, 30);
      expect(restored.theme, 'ember');
      expect(restored.soundEnabled, false);
    });

    test('fromJson handles missing keys with defaults', () {
      final s = AppSettings.fromJson({});
      expect(s.focusMinutes, 25);
      expect(s.theme, 'midnight');
    });

    test('copyWith preserves unchanged fields', () {
      const s = AppSettings(focusMinutes: 30, theme: 'arctic');
      final updated = s.copyWith(focusMinutes: 45);
      expect(updated.focusMinutes, 45);
      expect(updated.theme, 'arctic');
    });
  });
}
