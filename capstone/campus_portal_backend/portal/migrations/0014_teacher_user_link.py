from django.conf import settings
from django.db import migrations, models


def link_existing_teachers(apps, schema_editor):
    Teacher = apps.get_model('portal', 'Teacher')
    CustomUser = apps.get_model('portal', 'CustomUser')

    teacher_users = CustomUser.objects.filter(role='teacher')
    for user in teacher_users:
        first = (user.first_name or '').strip().lower()
        last = (user.last_name or '').strip().lower()
        if not first:
            continue

        qs = Teacher.objects.filter(user__isnull=True)

        match = None
        if last:
            match = qs.filter(
                first_name__iexact=first, last_name__iexact=last
            ).first()
        if match is None:
            match = qs.filter(first_name__iexact=first).first()

        if match is not None:
            match.user = user
            match.save(update_fields=['user'])


def unlink_teachers(apps, schema_editor):
    Teacher = apps.get_model('portal', 'Teacher')
    Teacher.objects.update(user=None)


class Migration(migrations.Migration):

    dependencies = [
        ('portal', '0013_customuser_branch_customuser_roll_number_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='teacher',
            name='user',
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=models.deletion.SET_NULL,
                related_name='teacher_profile',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.RunPython(link_existing_teachers, unlink_teachers),
    ]
