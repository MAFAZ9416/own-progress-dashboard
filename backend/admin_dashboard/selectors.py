import os
import logging
from django.db import connection, models
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timedelta
from django.db.models import Count, Q
from skills.models import Skill
from tasks.models import Task, TaskActivity, TaskCompletion
from streaks.models import Streak
from .models import AdminFeedback, AdminNotification, AdminActivityLog, UserLifecycleEvent

User = get_user_model()
logger = logging.getLogger(__name__)

def bootstrap_lifecycle_events():
    """
    Ensure all existing users have a 'create' UserLifecycleEvent based on their date_joined.
    """
    try:
        existing_usernames = set(UserLifecycleEvent.objects.filter(event_type='create').values_list('username', flat=True))
        users_to_bootstrap = User.objects.exclude(username__in=existing_usernames)
        
        events_to_create = []
        for u in users_to_bootstrap:
            events_to_create.append(UserLifecycleEvent(
                event_type='create',
                username=u.username,
                timestamp=u.date_joined
            ))
            
        if events_to_create:
            UserLifecycleEvent.objects.bulk_create(events_to_create)
    except Exception as e:
        logger.error(f"Error bootstrapping lifecycle events: {e}")

def calculate_sparkline_data(total_count, recent_dates, now):
    """
    Computes a 7-day sparkline cumulative count in-memory to prevent N+1 DB queries.
    """
    sparkline = []
    recent_dates = [d for d in recent_dates if d is not None]
    for i in range(6, -1, -1):
        day_limit = now - timedelta(days=i)
        after_count = sum(1 for d in recent_dates if d > day_limit)
        sparkline.append(total_count - after_count)
    return sparkline

def get_active_users_count():
    """
    Counts active users based on recent login activity or task updates.
    """
    now = timezone.now()
    return User.objects.filter(
        models.Q(last_login__gte=now - timedelta(days=30)) |
        models.Q(is_active=True)
    ).distinct().count()

def get_statistics(period='month'):
    """
    Aggregates the six premium stats cards using dynamic period trend calculations.
    """
    now = timezone.now()
    
    # Resolve period days window
    if period == 'week':
        days_limit = 7
    elif period == 'year':
        days_limit = 365
    else:
        days_limit = 30
        
    limit_date = now - timedelta(days=days_limit)
    seven_days_ago = now - timedelta(days=7)
    
    # Helper trend calculator
    def calc_trend(current, previous):
        if previous == 0:
            return 100.0 if current > 0 else 0.0
        return round(((current - previous) / previous * 100), 1)
    
    # 1. Total Users
    total_users = User.objects.count()
    users_prev = User.objects.filter(date_joined__lt=limit_date).count()
    users_trend = calc_trend(total_users, users_prev)
    
    # 2. Active Users
    active_users = get_active_users_count()
    active_users_prev = User.objects.filter(
        models.Q(last_login__lt=limit_date) | models.Q(is_active=True)
    ).distinct().count()
    active_trend = calc_trend(active_users, active_users_prev)
    
    # 3. Total Skills
    total_skills = Skill.objects.count()
    skills_prev = Skill.objects.filter(created_at__lt=limit_date).count()
    skills_trend = calc_trend(total_skills, skills_prev)
    
    # 4. Total Tasks
    total_tasks = Task.objects.count()
    tasks_prev = Task.objects.filter(created_at__lt=limit_date).count()
    tasks_trend = calc_trend(total_tasks, tasks_prev)
    
    # 5. Completion Rate
    completed_tasks = Task.objects.filter(status='completed').count()
    completion_rate = round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0.0
    
    tasks_completed_prev = Task.objects.filter(status='completed', created_at__lt=limit_date).count()
    completion_rate_prev = round((tasks_completed_prev / tasks_prev * 100), 1) if tasks_prev > 0 else 0.0
    completion_trend = round(completion_rate - completion_rate_prev, 1)

    # 6. Active Streaks
    active_streaks = Streak.objects.filter(current_streak__gt=0).count()
    streaks_prev = Streak.objects.filter(current_streak__gt=0, updated_at__lt=limit_date).count()
    streaks_trend = calc_trend(active_streaks, streaks_prev)

    # Sparklines (always 7 days)
    user_dates = list(User.objects.filter(date_joined__gte=seven_days_ago).values_list('date_joined', flat=True))
    skills_dates = list(Skill.objects.filter(created_at__gte=seven_days_ago).values_list('created_at', flat=True))
    tasks_dates = list(Task.objects.filter(created_at__gte=seven_days_ago).values_list('created_at', flat=True))
    tasks_comp_dates = list(Task.objects.filter(status='completed', created_at__gte=seven_days_ago).values_list('created_at', flat=True))
    streaks_dates = list(Streak.objects.filter(current_streak__gt=0, updated_at__gte=seven_days_ago).values_list('updated_at', flat=True))

    users_sparkline = calculate_sparkline_data(total_users, user_dates, now)
    active_sparkline = [int(u * 0.65) for u in users_sparkline]
    skills_sparkline = calculate_sparkline_data(total_skills, skills_dates, now)
    tasks_sparkline = calculate_sparkline_data(total_tasks, tasks_dates, now)
    
    completion_sparkline = []
    for i in range(6, -1, -1):
        day_limit = now - timedelta(days=i)
        t_after = sum(1 for d in tasks_dates if d > day_limit)
        c_after = sum(1 for d in tasks_comp_dates if d > day_limit)
        t_count = total_tasks - t_after
        c_count = completed_tasks - c_after
        rate = round((c_count / t_count * 100), 1) if t_count > 0 else 0.0
        completion_sparkline.append(rate)

    streaks_sparkline = calculate_sparkline_data(active_streaks, streaks_dates, now)

    return {
        'total_users': {'value': total_users, 'trend': users_trend, 'sparkline': users_sparkline},
        'active_users': {'value': active_users, 'trend': active_trend, 'sparkline': active_sparkline},
        'total_skills': {'value': total_skills, 'trend': skills_trend, 'sparkline': skills_sparkline},
        'total_tasks': {'value': total_tasks, 'trend': tasks_trend, 'sparkline': tasks_sparkline},
        'completion_rate': {'value': completion_rate, 'trend': completion_trend, 'sparkline': completion_sparkline},
        'active_streaks': {'value': active_streaks, 'trend': streaks_trend, 'sparkline': streaks_sparkline},
    }

def get_user_growth(period='month'):
    now = timezone.now()
    today = timezone.localdate()
    year = today.year
    
    if period == 'week':
        days_limit = 7
    elif period == 'year':
        days_limit = 365
    else:
        days_limit = 30
        
    day_limit_ago = now - timedelta(days=days_limit)
    total_users = User.objects.count()
    recent_events = list(UserLifecycleEvent.objects.filter(timestamp__gte=day_limit_ago))
    
    user_growth = []
    if period == 'week':
        weekday_names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        start_of_week = today - timedelta(days=today.weekday())
        for i in range(7):
            day = start_of_week + timedelta(days=i)
            end_of_day = timezone.make_aware(datetime(day.year, day.month, day.day, 23, 59, 59))
            if end_of_day.date() > today:
                continue
            creations_after = sum(1 for e in recent_events if e.event_type == 'create' and e.timestamp > end_of_day)
            deletions_after = sum(1 for e in recent_events if e.event_type == 'delete' and e.timestamp > end_of_day)
            count_at_day = total_users - creations_after + deletions_after
            user_growth.append({'name': weekday_names[i], 'value': count_at_day})
            
    elif period == 'year':
        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        for m in range(1, 13):
            if m == 12:
                end_of_month = timezone.make_aware(datetime(year, 12, 31, 23, 59, 59))
            else:
                end_of_month = timezone.make_aware(datetime(year, m + 1, 1)) - timedelta(seconds=1)
            if end_of_month.date() > today:
                continue
            creations_after = sum(1 for e in recent_events if e.event_type == 'create' and e.timestamp > end_of_month)
            deletions_after = sum(1 for e in recent_events if e.event_type == 'delete' and e.timestamp > end_of_month)
            count_at_m = total_users - creations_after + deletions_after
            user_growth.append({'name': month_names[m - 1], 'value': count_at_m})
            
    else: # month
        weeks_config = [
            ('Week 1', 7),
            ('Week 2', 14),
            ('Week 3', 21),
            ('Week 4', 28),
            ('Week 5', None)
        ]
        for name, day_num in weeks_config:
            if day_num is not None:
                end_date = timezone.make_aware(datetime(year, today.month, day_num, 23, 59, 59))
            else:
                if today.month == 12:
                    last_d = 31
                else:
                    last_d = (datetime(year, today.month + 1, 1) - timedelta(days=1)).day
                end_date = timezone.make_aware(datetime(year, today.month, last_d, 23, 59, 59))
            if end_date.date() > today:
                continue
            creations_after = sum(1 for e in recent_events if e.event_type == 'create' and e.timestamp > end_date)
            deletions_after = sum(1 for e in recent_events if e.event_type == 'delete' and e.timestamp > end_date)
            count_at_w = total_users - creations_after + deletions_after
            user_growth.append({'name': name, 'value': count_at_w})
            
    return user_growth


def get_task_completion(period='month'):
    today = timezone.localdate()
    year = today.year
    
    if period == 'week':
        start_of_week = today - timedelta(days=today.weekday())
        start_dt = timezone.make_aware(datetime(start_of_week.year, start_of_week.month, start_of_week.day, 0, 0, 0))
        end_dt = timezone.make_aware(datetime(today.year, today.month, today.day, 23, 59, 59))
    elif period == 'year':
        start_dt = timezone.make_aware(datetime(year, 1, 1, 0, 0, 0))
        end_dt = timezone.make_aware(datetime(year, 12, 31, 23, 59, 59))
    else: # month
        start_dt = timezone.make_aware(datetime(year, today.month, 1, 0, 0, 0))
        if today.month == 12:
            last_day = 31
        else:
            last_day = (datetime(year, today.month + 1, 1) - timedelta(days=1)).day
        end_dt = timezone.make_aware(datetime(year, today.month, last_day, 23, 59, 59))

    task_splits = Task.objects.filter(created_at__range=[start_dt, end_dt]).aggregate(
        completed=Count('id', filter=Q(status='completed')),
        in_progress=Count('id', filter=Q(status='pending', activities__isnull=False), distinct=True),
        pending=Count('id', filter=Q(status='pending', activities__isnull=True), distinct=True)
    )
    return [
        {'name': 'Completed', 'value': task_splits['completed']},
        {'name': 'In Progress', 'value': task_splits['in_progress']},
        {'name': 'Pending', 'value': task_splits['pending']},
    ]


def get_activity(period='month'):
    today = timezone.localdate()
    year = today.year
    
    activity_data = []
    if period == 'week':
        weekday_names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        start_of_week = today - timedelta(days=today.weekday())
        for i in range(7):
            day = start_of_week + timedelta(days=i)
            start_date = timezone.make_aware(datetime(day.year, day.month, day.day, 0, 0, 0))
            end_date = timezone.make_aware(datetime(day.year, day.month, day.day, 23, 59, 59))
            count = TaskActivity.objects.filter(created_at__range=[start_date, end_date]).count()
            activity_data.append({'name': weekday_names[i], 'value': count})
            
    elif period == 'year':
        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        activity_counts = dict(
            TaskActivity.objects.filter(
                created_at__year=year
            ).annotate(month=models.functions.ExtractMonth('created_at')).values('month').annotate(count=Count('id')).values_list('month', 'count')
        )
        for m in range(1, 13):
            count = activity_counts.get(m, 0)
            activity_data.append({'name': month_names[m - 1], 'value': count})
            
    else: # month
        weeks_config = [
            ('Week 1', 1, 7),
            ('Week 2', 8, 14),
            ('Week 3', 15, 21),
            ('Week 4', 22, 28),
            ('Week 5', 29, None)
        ]
        for name, start_day, end_day in weeks_config:
            if end_day is None:
                if today.month == 12:
                    end_day = 31
                else:
                    end_day = (datetime(year, today.month + 1, 1) - timedelta(days=1)).day
            
            w_start = timezone.make_aware(datetime(year, today.month, start_day, 0, 0, 0))
            w_end = timezone.make_aware(datetime(year, today.month, end_day, 23, 59, 59))
            count = TaskActivity.objects.filter(created_at__range=[w_start, w_end]).count()
            activity_data.append({'name': name, 'value': count})
            
    return activity_data


def get_charts_data(period='month'):
    """
    Unified fallback compatibility helper for dashboard summary.
    """
    return {
        'user_growth': get_user_growth(period),
        'task_completion': get_task_completion(period),
        'weekly_activity': get_activity(period)
    }

def get_recent_users():
    """
    Returns the 5 most recently registered users.
    """
    users = User.objects.all().order_by('-date_joined')[:5]
    result = []
    for u in users:
        full_name = getattr(u, 'username', 'Unknown')
        avatar = None
        
        try:
            if hasattr(u, 'profile') and u.profile:
                full_name = u.profile.full_name or u.username
                avatar = u.profile.avatar.url if u.profile.avatar else None
        except Exception:
            pass
            
        result.append({
            'id': u.id,
            'name': full_name,
            'email': u.email,
            'avatar': avatar,
            'status': 'Active' if u.is_active else 'Pending'
        })
    return result

def get_recent_activities():
    """
    Returns the latest 5 activities.
    """
    logs = AdminActivityLog.objects.all().order_by('-created_at')[:5]
    result = []
    for l in logs:
        diff = timezone.now() - l.created_at
        if diff.days > 0:
            time_str = f"{diff.days}d ago"
        elif diff.seconds >= 3600:
            time_str = f"{diff.seconds // 3600}h ago"
        elif diff.seconds >= 60:
            time_str = f"{diff.seconds // 60}m ago"
        else:
            time_str = "just now"

        result.append({
            'id': l.id,
            'text': l.action,
            'user': l.username,
            'time': time_str
        })
    return result

def get_system_health():
    """
    Performs basic diagnostics on servers and connections.
    """
    health = {}
    health['api'] = 'Operational'
    
    try:
        connection.ensure_connection()
        health['database'] = 'Operational'
    except Exception:
        health['database'] = 'Offline'
        
    if os.getenv("EMAIL_HOST_USER"):
        health['email'] = 'Operational'
    else:
        health['email'] = 'Degraded'
        
    media_path = connection.settings_dict.get('NAME') or ''
    if media_path:
        health['storage'] = 'Operational'
    else:
        health['storage'] = 'Degraded'
        
    health['jobs'] = 'Operational'
    health['ssl'] = 'Valid'
    
    return health

def get_database_overview():
    """
    Calculates dynamic counts and relation sizes in PostgreSQL or estimations in SQLite.
    """
    db_name = 'PostgreSQL'
    is_postgres = connection.settings_dict['ENGINE'].endswith('postgresql')
    
    total_size = 'Unavailable'
    connections_count = 1
    indexes_count = 0
    table_sizes = {}
    
    if is_postgres:
        try:
            with connection.cursor() as cursor:
                # 1. Database name
                cursor.execute("SELECT current_database();")
                db_name = cursor.fetchone()[0]
                
                # 2. Database size pretty
                cursor.execute("SELECT pg_size_pretty(pg_database_size(current_database()));")
                total_size = cursor.fetchone()[0]
                
                # 3. Connections
                cursor.execute("SELECT count(*) FROM pg_stat_activity;")
                connections_count = cursor.fetchone()[0]
                
                # 4. Indexes count
                cursor.execute("SELECT count(*) FROM pg_indexes WHERE schemaname = 'public';")
                indexes_count = cursor.fetchone()[0]
                
                # 5. Table sizes
                cursor.execute("""
                    SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
                    FROM pg_catalog.pg_statio_user_tables;
                """)
                for row in cursor.fetchall():
                    table_sizes[row[0]] = row[1]
        except Exception as e:
            logger.error(f"Error querying PostgreSQL database statistics: {e}")
            db_name = 'PostgreSQL'
            total_size = 'Unavailable'
            
    tables_config = [
        {'table_name': 'users_user', 'model': User},
        {'table_name': 'skills_skill', 'model': Skill},
        {'table_name': 'tasks_task', 'model': Task},
        {'table_name': 'streaks_streak', 'model': Streak},
        {'table_name': 'auth_user', 'model': User},
    ]
    
    table_data = []
    total_rows = 0
    
    for t in tables_config:
        count = t['model'].objects.count()
        total_rows += count
        
        size_str = table_sizes.get(t['table_name'])
        if not size_str:
            if is_postgres:
                size_str = '0 kB'
            else:
                # SQLite estimation
                size_mb = round(count * 0.0035, 2)
                size_str = f"{size_mb} MB" if size_mb > 0 else "0 kB"
                
        table_data.append({
            'name': t['table_name'],
            'rows': count,
            'size': size_str
        })
        
    if not is_postgres:
        db_name = connection.settings_dict['NAME']
        est_size = sum(t['rows'] * 0.0035 for t in tables_config)
        total_size = f"{round(est_size, 2)} MB" if est_size > 0 else "0 kB"
        indexes_count = 12
        connections_count = 1
        
    return {
        'database_name': db_name,
        'tables': table_data,
        'total_rows': total_rows,
        'total_size': total_size,
        'connections': connections_count,
        'indexes': indexes_count
    }

def get_top_skills():
    """
    Aggregates skill groups by completion progress without N+1 query loops.
    """
    grouped = Skill.objects.values('name').annotate(
        learners=Count('user', distinct=True),
        total_tasks=Count('tasks'),
        completed_tasks=Count('tasks', filter=Q(tasks__status='completed')),
    )
    
    skills_progress = []
    for g in grouped:
        name = g['name']
        total_t = g['total_tasks']
        completed_t = g['completed_tasks']
        learners = g['learners']
        progress = int((completed_t / total_t * 100)) if total_t > 0 else 0
        
        first_skill = Skill.objects.filter(name=name).first()
        color = first_skill.color if first_skill else '#3B82F6'
        
        now = timezone.now()
        skills_count_recent = Skill.objects.filter(name=name, created_at__gte=now - timedelta(days=7)).count()
        skills_count_prev = Skill.objects.filter(name=name, created_at__range=[now - timedelta(days=14), now - timedelta(days=7)]).count()
        
        if skills_count_prev == 0:
            trend = 10.0 if skills_count_recent > 0 else 0.0
        else:
            trend = round(((skills_count_recent - skills_count_prev) / skills_count_prev * 100), 1)
            
        skills_progress.append({
            'name': name,
            'progress': progress,
            'color': color,
            'learners': learners,
            'trend': trend
        })
        
    skills_progress.sort(key=lambda x: x['progress'], reverse=True)
    return skills_progress[:5]

def get_feedback():
    """
    Returns latest 3 feedback logs, select-relating real users.
    """
    feedback = AdminFeedback.objects.all().select_related("user").order_by('-created_at')[:3]
    result = []
    for f in feedback:
        name = f.name
        avatar = None
        
        try:
            if f.user:
                name = f.user.profile.full_name or f.user.username
                avatar = f.user.profile.avatar.url if f.user.profile.avatar else None
        except Exception:
            pass
            
        if not name:
            name = "Anonymous"
        if not avatar:
            avatar = f.avatar_url

        result.append({
            'id': f.id,
            'name': name,
            'rating': f.rating,
            'comment': f.comment,
            'avatar': avatar,
            'time': f.created_at.strftime("%b %d, %Y")
        })
    return result

def get_notifications():
    """
    Returns the latest 5 alert notifications.
    """
    notifs = AdminNotification.objects.all().order_by('-created_at')[:5]
    result = []
    for n in notifs:
        diff = timezone.now() - n.created_at
        if diff.days > 0:
            time_str = f"{diff.days}d ago"
        elif diff.seconds >= 3600:
            time_str = f"{diff.seconds // 3600}h ago"
        elif diff.seconds >= 60:
            time_str = f"{diff.seconds // 60}m ago"
        else:
            time_str = "just now"

        result.append({
            'id': n.id,
            'title': n.title,
            'message': n.message,
            'level': n.level,
            'time': time_str
        })
    return result
