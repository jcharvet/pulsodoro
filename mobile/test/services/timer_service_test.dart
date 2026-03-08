import 'package:flutter_test/flutter_test.dart';
import 'package:pulsodoro/models/timer_state.dart';
import 'package:pulsodoro/services/timer_service.dart';

void main() {
  late TimerService timer;

  setUp(() {
    timer = TimerService();
  });

  group('defaults', () {
    test('starts in Idle with 25:00', () {
      final s = timer.status;
      expect(s.state, TimerState.idle);
      expect(s.remainingSecs, 25 * 60);
      expect(s.totalSecs, 25 * 60);
      expect(s.cycle, 1);
      expect(s.isRunning, false);
    });
  });

  group('start', () {
    test('transitions Idle to Focus and sets running', () {
      timer.start();
      expect(timer.status.state, TimerState.focus);
      expect(timer.status.isRunning, true);
      expect(timer.status.remainingSecs, 25 * 60);
    });

    test('from Focus only sets running', () {
      timer.start();
      timer.pause();
      expect(timer.status.isRunning, false);
      timer.start();
      expect(timer.status.state, TimerState.focus);
      expect(timer.status.isRunning, true);
    });
  });

  group('pause', () {
    test('sets isRunning false', () {
      timer.start();
      timer.pause();
      expect(timer.status.isRunning, false);
    });
  });

  group('reset', () {
    test('returns to Idle with cycle 1', () {
      timer.start();
      timer.skip();
      timer.reset();
      expect(timer.status.state, TimerState.idle);
      expect(timer.status.cycle, 1);
      expect(timer.status.isRunning, false);
    });

    test('respects custom durations', () {
      timer.setDurations(focus: 10, shortBreak: 3, longBreak: 7);
      timer.start();
      timer.reset();
      expect(timer.status.remainingSecs, 10 * 60);
    });
  });

  group('tick', () {
    test('decrements remaining', () {
      timer.start();
      final before = timer.status.remainingSecs;
      timer.tick();
      expect(timer.status.remainingSecs, before - 1);
    });

    test('does nothing when not running', () {
      timer.start();
      timer.pause();
      final before = timer.status.remainingSecs;
      timer.tick();
      expect(timer.status.remainingSecs, before);
    });

    test('does nothing when idle', () {
      timer.tick();
      expect(timer.status.state, TimerState.idle);
    });

    test('transitions at zero', () {
      timer.setDurations(focus: 0, shortBreak: 5, longBreak: 15);
      timer.start(); // remaining = 0
      final result = timer.tick();
      expect(result, TimerState.shortBreak);
    });
  });

  group('skip', () {
    test('Focus to ShortBreak', () {
      timer.start();
      final result = timer.skip();
      expect(result, TimerState.shortBreak);
    });

    test('returns null when Idle', () {
      expect(timer.skip(), null);
    });
  });

  group('full cycle', () {
    test('4 rounds: 3 short breaks then 1 long break', () {
      timer.start();
      // Round 1: Focus -> ShortBreak -> Focus
      expect(timer.skip(), TimerState.shortBreak);
      expect(timer.skip(), TimerState.focus);
      expect(timer.status.cycle, 2);

      // Round 2
      expect(timer.skip(), TimerState.shortBreak);
      expect(timer.skip(), TimerState.focus);
      expect(timer.status.cycle, 3);

      // Round 3
      expect(timer.skip(), TimerState.shortBreak);
      expect(timer.skip(), TimerState.focus);
      expect(timer.status.cycle, 4);

      // Round 4: Focus -> LongBreak -> Focus (cycle resets)
      expect(timer.skip(), TimerState.longBreak);
      expect(timer.skip(), TimerState.focus);
      expect(timer.status.cycle, 1);
    });
  });
}
