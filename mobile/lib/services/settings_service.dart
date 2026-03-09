import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/settings.dart';

class SettingsService extends ChangeNotifier {
  AppSettings _settings = const AppSettings();
  AppSettings get settings => _settings;

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    final json = prefs.getString('settings');
    if (json != null) {
      _settings = AppSettings.fromJson(jsonDecode(json));
      notifyListeners();
    }
  }

  Future<void> update(AppSettings newSettings) async {
    _settings = newSettings;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('settings', jsonEncode(_settings.toJson()));
  }
}
