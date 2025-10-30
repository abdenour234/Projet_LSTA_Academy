import { z } from 'zod';

export const activityCreationSchema = z.object({
    title: z.string()
        .min(3, 'Title must be at least 3 characters')
        .max(200, 'Title must not exceed 200 characters')
        .trim(),

    description: z.string()
        .min(10, 'Description must be at least 10 characters')
        .max(1000, 'Description must not exceed 1000 characters')
        .trim(),

    content: z.string()
        .min(1, 'Content is required')
        .trim(),

    type: z.enum(['lesson', 'exercise', 'quiz', 'project', 'evaluation'], {
        errorMap: () => ({ message: 'Please select a valid activity type' })
    }),

    difficulty: z.enum(['easy', 'medium', 'hard'], {
        errorMap: () => ({ message: 'Please select a valid difficulty level' })
    }),

    duration: z.string()
        .min(1, 'Duration is required')
        .trim(),

    subject: z.string()
        .min(2, 'Subject must be at least 2 characters')
        .max(100, 'Subject must not exceed 100 characters')
        .trim(),

    schoolIds: z.array(z.number())
        .min(1, 'At least one school must be selected')
});

export type ActivityCreationFormData = z.infer<typeof activityCreationSchema>;

export const activityBuilderSchema = z.object({
    title: z.string()
        .min(3, 'Title must be at least 3 characters')
        .max(200, 'Title must not exceed 200 characters')
        .trim(),

    description: z.string()
        .min(10, 'Description must be at least 10 characters')
        .max(1000, 'Description must not exceed 1000 characters')
        .trim(),

    content: z.string()
        .min(1, 'Content is required')
        .trim(),

    type: z.enum(['lesson', 'exercise', 'quiz', 'project', 'evaluation'], {
        errorMap: () => ({ message: 'Please select a valid activity type' })
    }),

    difficulty: z.enum(['easy', 'medium', 'hard'], {
        errorMap: () => ({ message: 'Please select a valid difficulty level' })
    }),

    duration: z.string()
        .min(1, 'Duration is required')
        .trim(),

    subject: z.string()
        .min(2, 'Subject must be at least 2 characters')
        .max(100, 'Subject must not exceed 100 characters')
        .trim(),

    schoolIds: z.array(z.number())
        .min(1, 'At least one school must be selected'),

    classId: z.string().optional()
});

export type ActivityBuilderFormData = z.infer<typeof activityBuilderSchema>;
