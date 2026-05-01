from django.urls import path

from apps.reports.views import PlayerComparisonReportView


urlpatterns = [
    path(
        "player-comparison/",
        PlayerComparisonReportView.as_view(),
        name="player-comparison-report",
    ),
]