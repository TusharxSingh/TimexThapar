from rest_framework import serializers
from .models import CustomUser, Teacher, Course, Room, Day, TimeSlot, TimetableEntry

class UserSerializer(serializers.ModelSerializer):
    teacher_id = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'role', 'first_name', 'last_name',
                  'roll_number', 'branch', 'year_of_study', 'teacher_id']

    def get_teacher_id(self, obj):
        profile = getattr(obj, 'teacher_profile', None)
        return profile.id if profile else None


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=4)
    teacher_id = serializers.PrimaryKeyRelatedField(
        queryset=Teacher.objects.all(), write_only=True, required=False, allow_null=True,
    )

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'password', 'role', 'first_name', 'last_name',
                  'roll_number', 'branch', 'year_of_study', 'teacher_id']

    def validate_role(self, value):
        # Admin accounts must be created via Django's createsuperuser / admin site,
        # not through the in-app Users page.
        if value not in ('teacher', 'student'):
            raise serializers.ValidationError(
                "Role must be teacher or student. Admin accounts are managed via Django admin."
            )
        return value

    def validate_username(self, value):
        value = (value or '').strip()
        if not value:
            raise serializers.ValidationError("Username is required.")
        if CustomUser.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Username already taken.")
        return value

    def validate(self, attrs):
        teacher = attrs.get('teacher_id')
        if teacher is not None and Teacher.objects.filter(user=teacher.user).exclude(pk=teacher.pk).exists():
            pass
        if teacher is not None and teacher.user_id is not None:
            raise serializers.ValidationError({
                "teacher_id": "That teacher is already linked to another user."
            })
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        teacher = validated_data.pop('teacher_id', None)
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()

        if user.role == 'teacher':
            if teacher is None:
                # First try to find an existing unlinked Teacher with matching name
                # so we don't create a duplicate row.
                first = (user.first_name or '').strip()
                last = (user.last_name or '').strip()
                if first:
                    qs = Teacher.objects.filter(user__isnull=True, first_name__iexact=first)
                    if last:
                        teacher = qs.filter(last_name__iexact=last).first() or qs.first()
                    else:
                        teacher = qs.first()

            if teacher is None:
                # No matching teacher found, auto-create a new one
                teacher = Teacher.objects.create(
                    first_name=user.first_name or user.username,
                    last_name=user.last_name or '',
                    designation='',
                )
            teacher.user = user
            teacher.save(update_fields=['user'])

        return user

class TeacherSerializer(serializers.ModelSerializer):
    linked_username = serializers.SerializerMethodField()

    class Meta:
        model = Teacher
        fields = '__all__'

    def get_linked_username(self, obj):
        return obj.user.username if obj.user_id else None

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