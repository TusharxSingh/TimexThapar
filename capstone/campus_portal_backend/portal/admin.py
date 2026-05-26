from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Teacher, Course, Room, Day, TimeSlot, TimetableEntry


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ("Custom Fields", {"fields": ("role", "roll_number", "branch", "year_of_study")}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Custom Fields", {"fields": ("role",)}),
    )
    list_display = ["username", "email", "first_name", "last_name", "role", "is_staff"]
    list_filter = UserAdmin.list_filter + ("role",)
    search_fields = ("username", "email", "first_name", "last_name", "roll_number")


@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ("first_name", "last_name", "prefix", "designation", "email")
    list_filter = ("designation",)
    search_fields = ("first_name", "last_name", "email", "designation")
    ordering = ("first_name", "last_name")


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "semester", "department", "teacher", "number_of_lectures", "number_of_labs", "credits")
    list_filter = ("semester", "department")
    search_fields = ("name", "code", "department")
    autocomplete_fields = ("teacher",)
    ordering = ("semester", "name")


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ("name", "capacity", "type", "available")
    list_filter = ("type", "available")
    search_fields = ("name",)
    ordering = ("name",)


@admin.register(Day)
class DayAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)


@admin.register(TimeSlot)
class TimeSlotAdmin(admin.ModelAdmin):
    list_display = ("day", "start_time", "end_time")
    list_filter = ("day",)
    ordering = ("day", "start_time")


@admin.register(TimetableEntry)
class TimetableEntryAdmin(admin.ModelAdmin):
    list_display = ("subject", "type", "day", "time", "room", "teacher")
    list_filter = ("type", "day", "teacher")
    search_fields = ("subject", "room", "teacher__first_name", "teacher__last_name")
    autocomplete_fields = ("teacher",)
    ordering = ("day", "time")
