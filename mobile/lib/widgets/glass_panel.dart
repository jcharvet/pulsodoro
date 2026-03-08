import 'dart:ui';
import 'package:flutter/material.dart';

class GlassPanel extends StatelessWidget {
  final Widget child;
  final Color color;
  final Color borderColor;
  final double blur;
  final double borderRadius;
  final EdgeInsets? padding;

  const GlassPanel({
    super.key,
    required this.child,
    required this.color,
    required this.borderColor,
    this.blur = 12,
    this.borderRadius = 12,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
        child: Container(
          padding: padding,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(borderRadius),
            border: Border.all(color: borderColor, width: 0.5),
          ),
          child: child,
        ),
      ),
    );
  }
}
