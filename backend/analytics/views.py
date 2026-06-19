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
    - Total skills count
    - Total tasks count
    - Completed tasks count
    - Pending tasks count
    - Current streak value
    - Longest streak value
    
    Authentication: Required (IsAuthenticated)
    HTTP Methods: GET
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Retrieve dashboard summary for the authenticated user.
        
        Returns a JSON response with aggregated metrics filtered
        only for the logged-in user's data.
        
        Response Example:
        {
            "total_skills": 5,
            "total_tasks": 20,
            "completed_tasks": 12,
            "pending_tasks": 8,
            "current_streak": 7,
            "longest_streak": 15
        }
        
        Args:
            request: HTTP request object containing authenticated user
            
        Returns:
            Response: JSON object with dashboard summary metrics
        """
        user = request.user
        
        # Query total skills for the user
        total_skills = Skill.objects.filter(user=user).count()
        
        # Query total tasks for the user
        total_tasks = Task.objects.filter(user=user).count()
        
        # Query completed tasks for the user
        completed_tasks = Task.objects.filter(
            user=user,
            status='completed'
        ).count()
        
        # Query pending tasks for the user
        pending_tasks = Task.objects.filter(
            user=user,
            status='pending'
        ).count()
        
        # Get streak data from Streak model
        try:
            streak = Streak.objects.get(user=user)
            current_streak = streak.current_streak
            longest_streak = streak.longest_streak
        except Streak.DoesNotExist:
            # Default values if no streak record exists
            current_streak = 0
            longest_streak = 0
        
        # Build response data dictionary
        data = {
            "total_skills": total_skills,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "pending_tasks": pending_tasks,
            "current_streak": current_streak,
            "longest_streak": longest_streak,
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
    
    Returns task completion counts aggregated by date for the last 30 days.
    Data is filtered only for the authenticated user.
    
    Uses Django ORM aggregation to group TaskCompletion records by date
    and count completed tasks per day.
    
    Authentication: Required (IsAuthenticated)
    HTTP Methods: GET
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Retrieve monthly completion analytics for the authenticated user.
        
        Aggregates TaskCompletion records for the last 30 days, grouped by date,
        returning completion counts per day in chronological order.
        
        Response Example:
        [
            {
                "date": "2026-05-20",
                "completed_tasks": 3
            },
            {
                "date": "2026-05-21",
                "completed_tasks": 7
            }
        ]
        
        Args:
            request: HTTP request object containing authenticated user
            
        Returns:
            Response: List of objects with date and completed_tasks count
        """
        user = request.user
        
        # Calculate date range: last 30 days from today
        today = timezone.now().date()
        thirty_days_ago = today - timedelta(days=29)
        
        # Query TaskCompletion records for the user within last 30 days
        # Group by completed_date and count tasks per day
        monthly_data = TaskCompletion.objects.filter(
            user=user,
            completed_date__gte=thirty_days_ago,
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
            for item in monthly_data
        ]
        
        return Response(data, status=status.HTTP_200_OK)


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
