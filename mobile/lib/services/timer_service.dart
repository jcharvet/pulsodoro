import 'package:flutter/foundation.dart';
import '../models/timer_state.dart';

class TimerService extends ChangeNotifier {
  int _focusSecs = 25 * 60;
  int _shortBreakSecs = 5 * 60;
  int _longBreakSecs = 15 * 60;

  TimerStatus _status = const TimerStatus(
    state: TimerState.idle,
    remainingSecs: 25 * 60,
    totalSecs: 25 * 60,
    cycle: 1,
    isRunning: false,
  );

  TimerStatus get status => _status;

  void setDurations({
    required int focus,
    required int shortBreak,
    required int longBreak,
  }) {
    _focusSecs = focus * 60;
    _shortBreakSecs = shortBreak * 60;
    _longBreakSecs = longBreak * 60;
  }

  void start() {
    if (_status.state == TimerState.idle) {
      _status = TimerStatus(
        state: TimerState.focus,
        remainingSecs: _focusSecs,
        totalSecs: _focusSecs,
        cycle: _status.cycle,
        isRunning: true,
      );
    } else {
      _status = _status.copyWith(isRunning: true);
    }
    notifyListeners();
  }

  void pause() {
    _status = _status.copyWith(isRunning: false);
    notifyListeners();
  }

  void reset() {
    _status = TimerStatus(
      state: TimerState.idle,
      remainingSecs: _focusSecs,
      totalSecs: _focusSecs,
      cycle: 1,
      isRunning: false,
    );
    notifyListeners();
  }

  /// Returns the new state if a transition occurred, null otherwise.
  TimerState? tick() {
    if (!_status.isRunning || _status.state == TimerState.idle) {
      return null;
    }
    if (_status.remainingSecs > 0) {
      _status = _status.copyWith(remainingSecs: _status.remainingSecs - 1);
      notifyListeners();
      return null;
    }
    return _transitionToNext();
  }

  /// Forces transition to next state. Returns new state or null if Idle.
  TimerState? skip() {
    if (_status.state == TimerState.idle) return null;
    return _transitionToNext();
  }

  TimerState? _transitionToNext() {
    late final TimerState newState;
    int newCycle = _status.cycle;

    switch (_status.state) {
      case TimerState.focus:
        newState =
            _status.cycle >= 4 ? TimerState.longBreak : TimerState.shortBreak;
      case TimerState.shortBreak:
        newCycle = _status.cycle + 1;
        newState = TimerState.focus;
      case TimerState.longBreak:
        newCycle = 1;
        newState = TimerState.focus;
      case TimerState.idle:
        return null;
    }

    final dur = switch (newState) {
      TimerState.focus => _focusSecs,
      TimerState.shortBreak => _shortBreakSecs,
      TimerState.longBreak => _longBreakSecs,
      TimerState.idle => _focusSecs,
    };

    _status = TimerStatus(
      state: newState,
      remainingSecs: dur,
      totalSecs: dur,
      cycle: newCycle,
      isRunning: _status.isRunning,
    );
    notifyListeners();
    return newState;
  }
}
