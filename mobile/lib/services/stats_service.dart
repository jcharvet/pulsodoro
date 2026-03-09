import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/stats.dart';

class StatsService extends ChangeNotifier {
  Map<String, int> _sessions = {};

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    final json = prefs.getString('stats');
    if (json != null) {
      final decoded = jsonDecode(json) as Map<String, dynamic>;
      _sessions = decoded.map((k, v) => MapEntry(k, v as int));
      notifyListeners();
    }
  }

  Future<void> recordCompletion() async {
    final today = DateFormat('yyyy-MM-dd').format(DateTime.now());
    _sessions[today] = (_sessions[today] ?? 0) + 1;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('stats', jsonEncode(_sessions));
  }

  StatsResponse getStats() {
    final now = DateTime.now();
    final todayKey = DateFormat('yyyy-MM-dd').format(now);
    final today = _sessions[todayKey] ?? 0;

    final daily = <String, int>{};
    int week = 0;
    for (int i = 0; i < 7; i++) {
      final date = now.subtract(Duration(days: i));
      final key = DateFormat('yyyy-MM-dd').format(date);
      final count = _sessions[key] ?? 0;
      daily[key] = count;
      week += count;
    }

    return StatsResponse(today: today, week: week, daily: daily);
  }
}
