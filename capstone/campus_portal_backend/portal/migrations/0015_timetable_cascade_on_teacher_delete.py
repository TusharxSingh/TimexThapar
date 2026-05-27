from django.db import migrations, models


def remove_orphan_entries(apps, schema_editor):
    TimetableEntry = apps.get_model('portal', 'TimetableEntry')
    TimetableEntry.objects.filter(teacher__isnull=True).delete()


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('portal', '0014_teacher_user_link'),
    ]

    operations = [
        migrations.RunPython(remove_orphan_entries, noop),
        migrations.AlterField(
            model_name='timetableentry',
            name='teacher',
            field=models.ForeignKey(
                db_column='teacher_id',
                null=True,
                on_delete=models.deletion.CASCADE,
                to='portal.teacher',
            ),
        ),
    ]
