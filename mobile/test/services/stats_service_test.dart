import 'package:flutter_test/flutter_test.dart';
import 'package:pulsodoro/services/stats_service.dart';

void main() {
  late StatsService stats;

  setUp(() {
    stats = StatsService();
  });

  test('starts with zero stats', () {
    final r = stats.getStats();
    expect(r.today, 0);
    expect(r.week, 0);
  });

  test('getStats returns 7 daily entries', () {
    final r = stats.getStats();
    expect(r.daily.length, 7);
  });
}
