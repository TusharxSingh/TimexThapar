from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.exceptions import ValidationError

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('teacher', 'Teacher'),
        ('admin', 'Admin'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    pin = models.CharField(max_length=10, blank=True, null=True)
    roll_number = models.CharField(max_length=30, blank=True, null=True)
    branch = models.CharField(max_length=100, blank=True, null=True)
    year_of_study = models.PositiveSmallIntegerField(blank=True, null=True)
    
class Teacher(models.Model):
    prefix = models.CharField(max_length=10, blank=True, null=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    designation = models.CharField(max_length=100)
    email = models.EmailField(max_length=254, blank=True, null=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"
    
class Course(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20)
    semester = models.IntegerField()
    department = models.CharField(max_length=100)
    number_of_lectures = models.PositiveIntegerField(default=0)
    number_of_labs = models.PositiveIntegerField(default=0)
    credits = models.PositiveIntegerField(default=0)
    teacher = models.ForeignKey(Teacher, null=True, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.name} ({self.code})"
    
    class Meta:
        unique_together = ('name', 'semester')

class Room(models.Model):
    ROOM_TYPES = [
        ('Lab', 'Lab'),
        ('Theatre', 'Theatre'),
    ]

    name = models.CharField(max_length=100)
    capacity = models.PositiveIntegerField()
    type = models.CharField(max_length=20, choices=ROOM_TYPES)
    available = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.capacity} capacity)"
    
class Day(models.Model):
    name = models.CharField(max_length=20, unique=True)

    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['name']

class TimeSlot(models.Model):
    day = models.ForeignKey(Day, on_delete=models.CASCADE, related_name="timeslots")
    start_time = models.TimeField()
    end_time = models.TimeField()

    def __str__(self):
        return f"{self.day.name} {self.start_time} - {self.end_time}"

    def clean(self):
        if self.end_time <= self.start_time:
            raise ValidationError("End time must be after start time.")

class TimetableEntry(models.Model):
    subject = models.CharField(max_length=255)
    type = models.CharField(max_length=20)  # 'Lecture' or 'Lab'
    room = models.CharField(max_length=255)
    day = models.CharField(max_length=20)
    time = models.CharField(max_length=50)
    teacher = models.ForeignKey(Teacher, null=True, on_delete=models.SET_NULL, db_column='teacher_id')

    def __str__(self):
        return f"{self.subject} - {self.day} {self.time}"
