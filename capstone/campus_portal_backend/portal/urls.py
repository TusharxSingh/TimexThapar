from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    user_info,
    change_pin,
    update_profile,
    generate_timetable,
    TeacherViewSet,
    CourseViewSet,
    RoomViewSet,
    TimeSlotViewSet,
    save_timetable,
    get_timetable,
    delete_timetable
)

router = DefaultRouter()
router.register(r'teachers', TeacherViewSet)
router.register(r'courses', CourseViewSet)
router.register(r'rooms', RoomViewSet)
router.register(r'timeslots', TimeSlotViewSet)

urlpatterns = [
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('user-info/', user_info, name='user_info'),
    path('profile/', update_profile, name='update_profile'),
    path('change-pin/', change_pin, name='change_pin'),
    path('generate-timetable/', generate_timetable, name='generate_timetable'),
    path('', include(router.urls)),
    path('timetable/save/', save_timetable, name='save_timetable'),
    path('timetable/', get_timetable, name='get_timetable'),
    path('timetable/delete/', delete_timetable, name='delete_timetable'),
]