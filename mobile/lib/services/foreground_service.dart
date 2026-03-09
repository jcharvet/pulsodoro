import 'package:flutter_foreground_task/flutter_foreground_task.dart';

class ForegroundTimerService {
  static Future<void> init() async {
    FlutterForegroundTask.init(
      androidNotificationOptions: AndroidNotificationOptions(
        channelId: 'pulsodoro_timer',
        channelName: 'PulsoDoro Timer',
        channelDescription: 'Shows timer countdown while app is in background',
        channelImportance: NotificationChannelImportance.LOW,
        priority: NotificationPriority.LOW,
      ),
      iosNotificationOptions: const IOSNotificationOptions(),
      foregroundTaskOptions: ForegroundTaskOptions(
        eventAction: ForegroundTaskEventAction.repeat(1000),
        autoRunOnBoot: false,
        autoRunOnMyPackageReplaced: false,
        allowWakeLock: true,
        allowWifiLock: false,
      ),
    );
  }

  static Future<void> start() async {
    if (await FlutterForegroundTask.isRunningService) return;
    await FlutterForegroundTask.startService(
      notificationTitle: 'PulsoDoro',
      notificationText: 'Timer running...',
      callback: _startCallback,
    );
  }

  static Future<void> stop() async {
    await FlutterForegroundTask.stopService();
  }

  static Future<void> updateNotification(String text) async {
    FlutterForegroundTask.updateService(
      notificationTitle: 'PulsoDoro',
      notificationText: text,
    );
  }
}

// This callback must be a top-level function
@pragma('vm:entry-point')
void _startCallback() {
  FlutterForegroundTask.setTaskHandler(_TimerTaskHandler());
}

class _TimerTaskHandler extends TaskHandler {
  @override
  Future<void> onStart(DateTime timestamp, TaskStarter starter) async {
    // Task started
  }

  @override
  void onRepeatEvent(DateTime timestamp) {
    // Runs every second (1000ms as configured).
    // In a full implementation this would tick the timer
    // and update the notification. For now it's a placeholder.
  }

  @override
  Future<void> onDestroy(DateTime timestamp) async {
    // Cleanup
  }
}
