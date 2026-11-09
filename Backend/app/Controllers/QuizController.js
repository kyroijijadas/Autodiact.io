import Quiz from '../Models/Quiz.js';

export function validateQuizPayload(body) {
    const {
        title,
        description,
        subject,
        time_limit_seconds: timeLimitSeconds,
        questions
    } = body ?? {};

    if (typeof title !== 'string' || !title.trim() || title.trim().length > 255) {
        return { error: 'Title is required and must be 255 characters or fewer' };
    }
    if (typeof description !== 'string' || !description.trim() || description.length > 5000) {
        return { error: 'Description is required and must be 5000 characters or fewer' };
    }
    if (typeof subject !== 'string' || !subject.trim() || subject.trim().length > 100) {
        return { error: 'Subject is required and must be 100 characters or fewer' };
    }
    if (!Number.isSafeInteger(timeLimitSeconds) || timeLimitSeconds < 60 || timeLimitSeconds > 86400) {
        return { error: 'Time limit must be an integer from 60 to 86400 seconds' };
    }
    if (!Array.isArray(questions) || questions.length < 1 || questions.length > 100) {
        return { error: 'A quiz must contain between 1 and 100 questions' };
    }

    const normalizedQuestions = [];
    for (const question of questions) {
        if (
            !question || typeof question.text !== 'string' ||
            !question.text.trim() || question.text.trim().length > 5000
        ) {
            return { error: 'Each question must have text of 5000 characters or fewer' };
        }
        if (!Array.isArray(question.options) || question.options.length < 2 || question.options.length > 10) {
            return { error: 'Each question must have between 2 and 10 options' };
        }

        const options = [];
        for (const option of question.options) {
            if (
                !option || typeof option.text !== 'string' ||
                !option.text.trim() || option.text.trim().length > 1000 ||
                typeof option.is_correct !== 'boolean'
            ) {
                return { error: 'Each option requires text and a boolean is_correct value' };
            }
            options.push({ text: option.text.trim(), is_correct: option.is_correct });
        }
        if (options.filter((option) => option.is_correct).length !== 1) {
            return { error: 'Each question must have exactly one correct option' };
        }
        normalizedQuestions.push({ text: question.text.trim(), options });
    }

    return {
        value: {
            title: title.trim(),
            description: description.trim(),
            subject: subject.trim(),
            timeLimitSeconds,
            questions: normalizedQuestions
        }
    };
}

class QuizController {
    static async createQuiz(req, res) {
        const validation = validateQuizPayload(req.body);
        if (validation.error) {
            return res.status(400).json({ error: validation.error });
        }

        try {
            const { title, description, subject, timeLimitSeconds, questions } = validation.value;
            const quizId = await Quiz.create(
                title,
                description,
                subject,
                timeLimitSeconds,
                req.auth.userId,
                questions
            );
            res.status(201).json({ message: 'Quiz created successfully', quizId });
        } catch (error) {
            if (error.code === 'SUBJECT_NOT_APPROVED') {
                return res.status(403).json({ error: 'You are not approved to create quizzes for this subject' });
            }
            console.error('Database error:', error);
            res.status(500).json({ error: 'Failed to create quiz' });
        }
    }

    static async getAllQuizzes(req, res) {
        try {
            res.status(200).json(await Quiz.getAllQuizzes());
        } catch (error) {
            console.error('Database error:', error);
            res.status(500).json({ error: 'Failed to fetch quizzes' });
        }
    }

    static async getMine(req, res) {
        try {
            res.status(200).json(await Quiz.getMine(req.auth.userId));
        } catch (error) {
            console.error('Database error:', error);
            res.status(500).json({ error: 'Failed to fetch quizzes' });
        }
    }
}

export default QuizController;
