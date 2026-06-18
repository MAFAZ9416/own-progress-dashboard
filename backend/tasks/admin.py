from django.contrib import admin
from .models import Task, TaskCompletion

admin.site.register(Task)
admin.site.register(TaskCompletion)