import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import '../models/timer_state.dart';

class NotificationService {
  final _plugin = FlutterLocalNotificationsPlugin();

  Future<void> init() async {
    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const settings = InitializationSettings(android: android);
    await _plugin.initialize(settings);
  }

  Future<void> showTransition(TimerState newState) async {
    final (title, body) = switch (newState) {
      TimerState.focus => ('Focus Time', 'Time to get back to work!'),
      TimerState.shortBreak => ('Short Break', 'Take a quick breather.'),
      TimerState.longBreak => ('Long Break', 'Great work! Take a longer rest.'),
      TimerState.idle => ('Timer Reset', 'Ready for a new session.'),
    };

    await _plugin.show(
      0,
      title,
      body,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'timer_transitions',
          'Timer Transitions',
          channelDescription: 'Notifications when timer state changes',
          importance: Importance.high,
          priority: Priority.high,
        ),
      ),
    );
  }
}
