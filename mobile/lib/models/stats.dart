class StatsResponse {
  final int today;
  final int week;
  final Map<String, int> daily; // last 7 days

  const StatsResponse({
    required this.today,
    required this.week,
    required this.daily,
  });
}
