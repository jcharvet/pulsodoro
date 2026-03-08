enum TimerState { idle, focus, shortBreak, longBreak }

class TimerStatus {
  final TimerState state;
  final int remainingSecs;
  final int totalSecs;
  final int cycle;
  final bool isRunning;

  const TimerStatus({
    required this.state,
    required this.remainingSecs,
    required this.totalSecs,
    required this.cycle,
    required this.isRunning,
  });

  TimerStatus copyWith({
    TimerState? state,
    int? remainingSecs,
    int? totalSecs,
    int? cycle,
    bool? isRunning,
  }) {
    return TimerStatus(
      state: state ?? this.state,
      remainingSecs: remainingSecs ?? this.remainingSecs,
      totalSecs: totalSecs ?? this.totalSecs,
      cycle: cycle ?? this.cycle,
      isRunning: isRunning ?? this.isRunning,
    );
  }

  double get progress => totalSecs > 0 ? remainingSecs / totalSecs : 1.0;

  String get timeDisplay {
    final m = (remainingSecs ~/ 60).toString().padLeft(2, '0');
    final s = (remainingSecs % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }
}
