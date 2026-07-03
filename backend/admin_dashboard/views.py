from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .permissions import IsAdminUser
from .serializers import QuickActionInputSerializer
from .services import seed_initial_data, trigger_quick_action
from . import selectors

class AdminDashboardSummaryView(APIView):
    """
    Unified API view that compiles and returns all admin dashboard aggregates
    in a single optimized response payload.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        selectors.bootstrap_lifecycle_events()
        period = request.query_params.get('period', 'month')
        is_full = request.query_params.get('full', 'true').lower() == 'true'
        
        data = {
            'stats': selectors.get_statistics(period=period),
            'charts': selectors.get_charts_data(period=period),
        }
        
        if is_full:
            data.update({
                'recent_users': selectors.get_recent_users(),
                'recent_activity': selectors.get_recent_activities(),
                'system_health': selectors.get_system_health(),
                'database': selectors.get_database_overview(),
                'top_skills': selectors.get_top_skills(),
                'feedback': selectors.get_feedback(),
                'notifications': selectors.get_notifications()
            })
            
        return Response(data, status=status.HTTP_200_OK)


class AdminQuickActionView(APIView):
    """
    API view for executing administrative system triggers (Backups, Analytical Reports, Alerts).
    """
    permission_classes = [IsAdminUser]

    def post(self, request):
        serializer = QuickActionInputSerializer(data=request.data)
        if serializer.is_valid():
            action_type = serializer.validated_data['action_type']
            username = request.user.username or "admin"
            result = trigger_quick_action(action_type, username)
            
            if result['status'] == 'success':
                return Response(result, status=status.HTTP_200_OK)
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
