from datetime import timedelta
from django.utils import timezone
from django.db.models import Count
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from skills.models import Skill
from tasks.models import Task, TaskCompletion
from streaks.models import Streak


class DashboardSummaryView(APIView):
    """
    API View for retrieving dashboard summary data.

    Returns aggregated metrics for the authenticated user:
    - Total skills / tasks / completed / pending counts
    - **Dynamically computed** current and longest streaks
    - Active days in the current week (for the streak widget)

    Streaks are derived from distinct ``TaskCompletion.completed_date``
    values — **not** from the cached ``Streak`` model — so they are
    always accurate even if a day is missed.

    Authentication: Required (IsAuthenticated)
    HTTP Methods: GET
    """
    permission_classes = [IsAuthenticated]

    # ── helpers ────────────────────────────────────────────────────
    @staticmethod
    def _compute_streaks(active_dates):
        """
        Given a **sorted ascending** list of ``datetime.date`` objects,
        return ``(current_streak, longest_streak)``.

        Rules:
        - Consecutive active days form a streak.
        - Missing one day resets the streak.
        - ``current_streak`` counts only if the chain reaches today
          (or yesterday, so you don't lose the streak mid-day).
        """
        from django.utils import timezone as tz

        if not active_dates:
            return 0, 0

        today = tz.now().date()

        # Walk backwards to compute current streak
        current = 0
        check = today
        for d in reversed(active_dates):
            if d == check:
                current += 1
                check -= timedelta(days=1)
            elif d < check:
                # Allow "yesterday counts" — the user hasn't had a chance
                # to be active today yet, so look one day earlier on first
                # iteration only.
                if current == 0 and d == today - timedelta(days=1):
                    current = 1
                    check = d - timedelta(days=1)
                else:
                    break

        # Walk forward once to compute longest streak
        longest = 1
        run = 1
        for i in range(1, len(active_dates)):
            if active_dates[i] == active_dates[i - 1] + timedelta(days=1):
                run += 1
                longest = max(longest, run)
            elif active_dates[i] != active_dates[i - 1]:
                run = 1

        return current, longest

    # ── GET ────────────────────────────────────────────────────────
    def get(self, request):
        user = request.user

        # Basic counts via aggregated queries
        from django.db.models import Q
        total_skills = Skill.objects.filter(user=user).count()
        task_stats = Task.objects.filter(user=user).aggregate(
            total=Count('id'),
            completed=Count('id', filter=Q(status='completed')),
            pending=Count('id', filter=Q(status='pending'))
        )
        total_tasks = task_stats['total']
        completed_tasks = task_stats['completed']
        pending_tasks = task_stats['pending']

        # ── Dynamic streak calculation ────────────────────────────
        active_dates = list(
            TaskCompletion.objects.filter(user=user)
            .values_list('completed_date', flat=True)
            .distinct()
            .order_by('completed_date')
        )
        current_streak, longest_streak = self._compute_streaks(active_dates)

        # Persist back to Streak model so other views stay in sync
        streak_obj, _ = Streak.objects.get_or_create(user=user)
        streak_obj.current_streak = current_streak
        streak_obj.longest_streak = max(longest_streak, streak_obj.longest_streak)
        if active_dates:
            streak_obj.last_active_date = active_dates[-1]
        streak_obj.save(update_fields=['current_streak', 'longest_streak', 'last_active_date'])

        # ── Active days in the current week (Mon–Sun) ─────────────
        today = timezone.now().date()
        # Monday of this week
        monday = today - timedelta(days=today.weekday())
        sunday = monday + timedelta(days=6)
        week_active = set(
            TaskCompletion.objects.filter(
                user=user,
                completed_date__gte=monday,
                completed_date__lte=sunday,
            )
            .values_list('completed_date', flat=True)
            .distinct()
        )
        day_names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        streak_active_days = [
            day_names[i]
            for i in range(7)
            if (monday + timedelta(days=i)) in week_active
        ]

        # ── Changes in the last 30 days ───────────────────────────
        thirty_days_ago = today - timedelta(days=30)
        skills_change = Skill.objects.filter(user=user, created_at__gte=thirty_days_ago).count()
        tasks_change = Task.objects.filter(user=user, created_at__gte=thirty_days_ago).count()

        current_streak_trend = "active" if current_streak > 0 else "inactive"
        longest_streak_trend = "best"

        data = {
            "total_skills":       total_skills,
            "total_tasks":        total_tasks,
            "completed_tasks":    completed_tasks,
            "pending_tasks":      pending_tasks,
            "current_streak":     current_streak,
            "longest_streak":     max(longest_streak, streak_obj.longest_streak),
            "tasks_done":         completed_tasks,
            "streak_active_days": streak_active_days,
            "skills_change":      skills_change,
            "tasks_change":       tasks_change,
            "current_streak_trend": current_streak_trend,
            "longest_streak_trend": longest_streak_trend,
        }

        return Response(data, status=status.HTTP_200_OK)



class WeeklyAnalyticsView(APIView):
    """
    API View for retrieving weekly task completion analytics.
    
    Returns task completion counts aggregated by date for the last 7 days.
    Data is filtered only for the authenticated user.
    
    Uses Django ORM aggregation to group TaskCompletion records by date
    and count completed tasks per day.
    
    Authentication: Required (IsAuthenticated)
    HTTP Methods: GET
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Retrieve weekly completion analytics for the authenticated user.
        
        Aggregates TaskCompletion records for the last 7 days, grouped by date,
        returning completion counts per day in chronological order.
        
        Response Example:
        [
            {
                "date": "2026-06-13",
                "completed_tasks": 2
            },
            {
                "date": "2026-06-14",
                "completed_tasks": 5
            }
        ]
        
        Args:
            request: HTTP request object containing authenticated user
            
        Returns:
            Response: List of objects with date and completed_tasks count
        """
        user = request.user
        
        # Calculate date range: last 7 days from today
        today = timezone.now().date()
        seven_days_ago = today - timedelta(days=6)
        
        # Query TaskCompletion records for the user within last 7 days
        # Group by completed_date and count tasks per day
        weekly_data = TaskCompletion.objects.filter(
            user=user,
            completed_date__gte=seven_days_ago,
            completed_date__lte=today
        ).values('completed_date').annotate(
            completed_tasks=Count('id')
        ).order_by('completed_date')
        
        # Format response data
        data = [
            {
                "date": str(item['completed_date']),
                "completed_tasks": item['completed_tasks']
            }
            for item in weekly_data
        ]
        
        return Response(data, status=status.HTTP_200_OK)


class MonthlyAnalyticsView(APIView):
    """
    API View for retrieving monthly task completion analytics.

    Returns task completion counts aggregated **by calendar month** for a
    given year.  Accepts an optional ``?year=`` query parameter (defaults
    to the current year).

    The response also includes an ``available_years`` list so the
    frontend can render a year-selector dropdown.

    Authentication: Required (IsAuthenticated)
    HTTP Methods: GET
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Retrieve monthly completion analytics for the authenticated user.

        Query params:
            year (int, optional) – calendar year to report on.
                                   Defaults to the current year.

        Response Example:
        {
            "year": 2026,
            "available_years": [2025, 2026],
            "months": [
                { "month": 1, "completed_tasks": 12 },
                { "month": 6, "completed_tasks": 6 }
            ]
        }

        Args:
            request: HTTP request object containing authenticated user

        Returns:
            Response: Object with year, available_years, and months list
        """
        from django.db.models.functions import ExtractMonth, ExtractYear

        user = request.user
        current_year = timezone.now().year

        # Parse requested year, default to current
        try:
            year = int(request.query_params.get('year', current_year))
        except (TypeError, ValueError):
            year = current_year

        # Aggregate completions by month for the requested year
        monthly_data = (
            TaskCompletion.objects.filter(
                user=user,
                completed_date__year=year,
            )
            .annotate(month=ExtractMonth('completed_date'))
            .values('month')
            .annotate(completed_tasks=Count('id'))
            .order_by('month')
        )

        months = [
            {
                "month": item['month'],
                "completed_tasks": item['completed_tasks'],
            }
            for item in monthly_data
        ]

        # Distinct years that have any completion data for the user
        available_years = sorted(
            TaskCompletion.objects.filter(user=user)
            .annotate(yr=ExtractYear('completed_date'))
            .values_list('yr', flat=True)
            .distinct()
        )

        # Guarantee the current year is always selectable
        if current_year not in available_years:
            available_years.append(current_year)
            available_years.sort()

        return Response(
            {
                "year": year,
                "available_years": available_years,
                "months": months,
            },
            status=status.HTTP_200_OK,
        )


class RecentActivityView(APIView):
    """
    API View for retrieving recent task completion activity.
    
    Returns the latest 20 task completions for the authenticated user.
    Includes task name, skill name, and completion timestamp.
    Results are ordered by most recent first.
    
    Uses select_related() for efficient querying of related Task and Skill objects.
    
    Authentication: Required (IsAuthenticated)
    HTTP Methods: GET
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Retrieve recent task completion activity for the authenticated user.
        
        Fetches the latest 20 TaskCompletion records ordered by completion time,
        including associated task and skill information.
        
        Response Example:
        [
            {
                "task": "Learn DRF",
                "skill": "Python",
                "completed_at": "2026-06-19T14:30:00Z"
            },
            {
                "task": "Build API",
                "skill": "Django",
                "completed_at": "2026-06-19T10:15:00Z"
            }
        ]
        
        Args:
            request: HTTP request object containing authenticated user
            
        Returns:
            Response: List of objects with task, skill, and completed_at
        """
        user = request.user
        
        # Query latest 20 TaskCompletion records for the user
        # Use select_related() to fetch related Task and Skill objects efficiently
        # Order by completed_at descending (newest first)
        recent_completions = TaskCompletion.objects.filter(
            user=user
        ).select_related('task', 'skill').order_by('-completed_at')[:20]
        
        # Format response data
        data = [
            {
                "task": completion.task.title,
                "skill": completion.skill.name,
                "completed_at": completion.completed_at.isoformat()
            }
            for completion in recent_completions
        ]
        
        return Response(data, status=status.HTTP_200_OK)


class HeatmapAnalyticsView(APIView):
    """
    API View for retrieving heatmap-style task completion counts.

    Returns completion counts grouped by date for the last 365 days.
    Data is filtered only for the authenticated user.

    Uses Django ORM aggregation to group TaskCompletion records by date
    and count completions per day.

    Authentication: Required (IsAuthenticated)
    HTTP Methods: GET
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Retrieve heatmap analytics for the authenticated user.

        Aggregates TaskCompletion records for the last 365 days, grouped by date,
        returning daily completion counts in chronological order.

        Response Example:
        [
            {
                "date": "2026-01-10",
                "count": 4
            }
        ]

        Args:
            request: HTTP request object containing authenticated user

        Returns:
            Response: List of objects with date and count
        """
        user = request.user

        today = timezone.now().date()
        one_year_ago = today - timedelta(days=364)

        heatmap_data = TaskCompletion.objects.filter(
            user=user,
            completed_date__gte=one_year_ago,
            completed_date__lte=today
        ).values('completed_date').annotate(
            count=Count('id')
        ).order_by('completed_date')

        data = [
            {
                "date": str(item['completed_date']),
                "count": item['count']
            }
            for item in heatmap_data
        ]

        return Response(data, status=status.HTTP_200_OK)
