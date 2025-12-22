from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import viewsets, status
from django.contrib.auth.hashers import check_password

from .models import Teacher, Course, Room, TimeSlot, TimetableEntry
from .serializers import TeacherSerializer, CourseSerializer, RoomSerializer, TimeSlotSerializer, TimetableEntrySerializer

from portal.services.genetic_algorithm import generate_timetable as ga_generate_timetable

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_info(request):
    user = request.user
    return Response({
        "username": user.username,
        "role": user.role,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "roll_number": user.roll_number,
        "branch": user.branch,
        "year_of_study": user.year_of_study,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_pin(request):
    """
    Allow authenticated users (students in particular) to update their PIN securely.
    """
    user = request.user
    current_pin = request.data.get("current_pin", "")
    new_pin = request.data.get("new_pin", "")
    confirm_pin = request.data.get("confirm_pin", "")

    if not new_pin or not confirm_pin:
        return Response({"detail": "New PIN and confirmation are required."}, status=status.HTTP_400_BAD_REQUEST)

    if new_pin != confirm_pin:
        return Response({"detail": "New PIN and confirmation do not match."}, status=status.HTTP_400_BAD_REQUEST)

    if not new_pin.isdigit() or len(new_pin) not in (4, 6):
        return Response({"detail": "PIN must be 4 or 6 digits."}, status=status.HTTP_400_BAD_REQUEST)

    if not user.has_usable_password():
        return Response({"detail": "Your account does not support PIN changes."}, status=status.HTTP_400_BAD_REQUEST)

    if not check_password(current_pin, user.password):
        return Response({"detail": "Current PIN is incorrect."}, status=status.HTTP_400_BAD_REQUEST)

    if check_password(new_pin, user.password):
        return Response({"detail": "New PIN must be different from the current PIN."}, status=status.HTTP_400_BAD_REQUEST)

    # Update both the login password (hashed) and the optional plain PIN field
    user.set_password(new_pin)
    user.pin = new_pin
    user.save(update_fields=["password", "pin"])

    return Response({"message": "PIN updated successfully."}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """
    Allow users to update their display name information.
    """
    user = request.user
    first_name = (request.data.get("first_name") or "").strip()
    last_name = (request.data.get("last_name") or "").strip()
    roll_number = (request.data.get("roll_number") or "").strip()
    branch = (request.data.get("branch") or "").strip()
    year_of_study = request.data.get("year_of_study")

    if not first_name:
        return Response({"detail": "First name is required."}, status=status.HTTP_400_BAD_REQUEST)

    if year_of_study not in (None, "", "null"):
        try:
            year_of_study = int(year_of_study)
            if year_of_study < 1 or year_of_study > 10:
                return Response({"detail": "Year must be between 1 and 10."}, status=status.HTTP_400_BAD_REQUEST)
        except (TypeError, ValueError):
            return Response({"detail": "Year must be a number."}, status=status.HTTP_400_BAD_REQUEST)
    else:
        year_of_study = None

    user.first_name = first_name
    user.last_name = last_name
    user.roll_number = roll_number or None
    user.branch = branch or None
    user.year_of_study = year_of_study
    user.save(update_fields=["first_name", "last_name", "roll_number", "branch", "year_of_study"])

    return Response(
        {
            "message": "Profile updated successfully.",
            "first_name": user.first_name,
            "last_name": user.last_name,
            "roll_number": user.roll_number,
            "branch": user.branch,
            "year_of_study": user.year_of_study,
        },
        status=status.HTTP_200_OK
    )
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_timetable(request):
    try:
        max_hours = request.data.get("max_hours_per_day", 5)

        teachers = list(Teacher.objects.values("id", "first_name", "last_name"))
        courses = list(Course.objects.values("id", "name", "teacher_id","number_of_lectures", "number_of_labs"))
        rooms = list(Room.objects.values("id", "name", "type"))

        timeslots = [
            {
                "id": ts.id,
                "day": ts.day.name,
                "slot": f"{ts.start_time.strftime('%H:%M')} - {ts.end_time.strftime('%H:%M')}"
            }
            for ts in TimeSlot.objects.select_related("day").all()
        ]

        constraints = {"max_hours_per_day": int(max_hours)}

        result = ga_generate_timetable(teachers, courses, rooms, timeslots, constraints)
        return Response(result)

    except Exception as e:
        print(f"\U0001F525 Error in generate_timetable: {e}")
        return Response({"error": str(e)}, status=500)

class TeacherViewSet(viewsets.ModelViewSet):
    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer
    permission_classes = [IsAuthenticated]

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]

class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated]

class TimeSlotViewSet(viewsets.ModelViewSet):
    queryset = TimeSlot.objects.all()
    serializer_class = TimeSlotSerializer
    permission_classes = [IsAuthenticated]

@api_view(["POST"])
def save_timetable(request):
    """
    Delete old timetable and save new one.
    Expected: JSON list of entries [{subject, type, room, day, time, teacher}]
    """
    TimetableEntry.objects.all().delete()
    serializer = TimetableEntrySerializer(data=request.data, many=True)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Timetable saved successfully."})
    else:
        print("Serializer errors:", serializer.errors)
        return Response(serializer.errors, status=400)

@api_view(["GET"])
def get_timetable(request):
    teacher_id = request.query_params.get('teacher_id', None)

    if not teacher_id:
        return Response({"error": "Teacher id is required."}, status=400)

    # Filter timetable entries by teacher's name
    timetable = TimetableEntry.objects.filter(teacher=teacher_id)
    
    if not timetable.exists():
        return Response({"error": "No timetable entries found for this teacher."}, status=404)
    print("Timetable Entries:", timetable)
    
    serializer = TimetableEntrySerializer(timetable, many=True)
    return Response(serializer.data)



@api_view(["DELETE"])
def delete_timetable(request):
    TimetableEntry.objects.all().delete()
    return Response({"message": "Timetable deleted successfully."})