-- Creates missing table required by Hibernate schema validation.
-- Aligns with `com.schoolmanagement.entity.TeacherAttendance`.

CREATE TABLE IF NOT EXISTS public.teacher_attendance (
    id UUID PRIMARY KEY,
    teacher_id UUID NOT NULL,
    school_id BIGINT NOT NULL,
    type VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    class_id UUID,
    reason VARCHAR(500),
    is_justified BOOLEAN NOT NULL DEFAULT FALSE,
    duration_minutes INTEGER,
    admin_notes VARCHAR(1000),
    recorded_by UUID,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_teacher_attendance_teacher_id ON public.teacher_attendance (teacher_id);
CREATE INDEX IF NOT EXISTS ix_teacher_attendance_school_id ON public.teacher_attendance (school_id);
CREATE INDEX IF NOT EXISTS ix_teacher_attendance_event_date ON public.teacher_attendance (event_date);
