import 'package:audioplayers/audioplayers.dart';

class AudioService {
  final _player = AudioPlayer();

  /// Play a short chime. Uses a bundled asset.
  Future<void> playChime() async {
    try {
      await _player.play(AssetSource('chime.wav'), volume: 0.7);
    } catch (_) {
      // Asset not found or audio unavailable — silently skip
    }
  }

  void dispose() {
    _player.dispose();
  }
}
