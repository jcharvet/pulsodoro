import 'dart:math';
import 'package:flutter/material.dart';

class ProgressRing extends StatelessWidget {
  final double progress;
  final Color color;
  final double size;
  final double strokeWidth;
  final bool showTicks;
  final Color? trackColor;
  final Widget? child;

  const ProgressRing({
    super.key,
    required this.progress,
    required this.color,
    this.size = 280,
    this.strokeWidth = 8,
    this.showTicks = true,
    this.trackColor,
    this.child,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _ProgressRingPainter(
          progress: progress,
          color: color,
          strokeWidth: strokeWidth,
          showTicks: showTicks,
          trackColor: trackColor ?? Colors.white.withValues(alpha: 0.04),
        ),
        child: child != null ? Center(child: child) : null,
      ),
    );
  }
}

class _ProgressRingPainter extends CustomPainter {
  final double progress;
  final Color color;
  final double strokeWidth;
  final bool showTicks;
  final Color trackColor;

  _ProgressRingPainter({
    required this.progress,
    required this.color,
    required this.strokeWidth,
    required this.showTicks,
    required this.trackColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (min(size.width, size.height) - strokeWidth) / 2;

    // Track
    canvas.drawCircle(
      center,
      radius,
      Paint()
        ..color = trackColor
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round,
    );

    // Tick marks
    if (showTicks) {
      for (int i = 0; i < 60; i++) {
        final angle = (i * 6 - 90) * pi / 180;
        final isQuarter = i % 15 == 0;
        final isFive = i % 5 == 0;
        final innerR = radius - (isQuarter ? 14 : isFive ? 10 : 6);
        final outerR = radius - 3;
        canvas.drawLine(
          Offset(center.dx + innerR * cos(angle),
              center.dy + innerR * sin(angle)),
          Offset(center.dx + outerR * cos(angle),
              center.dy + outerR * sin(angle)),
          Paint()
            ..color = Colors.white
                .withValues(alpha: isQuarter ? 0.2 : isFive ? 0.12 : 0.06)
            ..strokeWidth = isQuarter ? 2.0 : 1.0,
        );
      }
    }

    // Progress arc
    if (progress > 0) {
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        -pi / 2,
        2 * pi * progress,
        false,
        Paint()
          ..color = color
          ..style = PaintingStyle.stroke
          ..strokeWidth = strokeWidth
          ..strokeCap = StrokeCap.round,
      );
    }

    // Leading dot
    if (progress > 0 && progress < 1.0) {
      final dotAngle = -pi / 2 + 2 * pi * progress;
      canvas.drawCircle(
        Offset(center.dx + radius * cos(dotAngle),
            center.dy + radius * sin(dotAngle)),
        strokeWidth / 2 + 2,
        Paint()..color = color,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _ProgressRingPainter old) =>
      old.progress != progress || old.color != color;
}
