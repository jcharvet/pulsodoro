import 'package:flutter_test/flutter_test.dart';
import 'package:pulsodoro/main.dart';

void main() {
  testWidgets('App renders smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const PulsodoroApp());
    // App should render the title
    expect(find.text('PulsoDoro'), findsOneWidget);
  });
}
