from rest_framework import serializers
from .models import CustomUser, Teacher, Course, Room, Day, TimeSlot, TimetableEntry

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'role', 'first_name', 'last_name', 'roll_number', 'branch', 'year_of_study']


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=4)

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'password', 'role', 'first_name', 'last_name',
                  'roll_number', 'branch', 'year_of_study']

    def validate_role(self, value):
        if value not in ('teacher', 'student', 'admin'):
            raise serializers.ValidationError("Role must be teacher, student, or admin.")
        return value

    def validate_username(self, value):
        value = (value or '').strip()
        if not value:
            raise serializers.ValidationError("Username is required.")
        if CustomUser.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Username already taken.")
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()
        return user

class TeacherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Teacher
        fields = '__all__'

class CourseSerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = '__all__'  # Includes all model fields + teacher_name

    def get_teacher_name(self, obj):
        if obj.teacher:
            return f"{obj.teacher.first_name} {obj.teacher.last_name}"
        return None

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = '__all__'

class DaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Day
        fields = '__all__'

class TimeSlotSerializer(serializers.ModelSerializer):
    day = DaySerializer()  # Nested serializer for readability (optional)

    class Meta:
        model = TimeSlot
        fields = '__all__'

class TimetableEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = TimetableEntry
        fields = '__all__'