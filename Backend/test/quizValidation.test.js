import test from 'node:test';
import assert from 'node:assert/strict';
import { validateQuizPayload } from '../app/Controllers/QuizController.js';
import { parseAttemptId } from '../app/Controllers/ResultController.js';
import { requireRole } from '../app/Middleware/authMiddleware.js';
import { getProfileTableForRole } from '../app/Models/User.js';
import { gradeAnswers } from '../app/Models/Result.js';

const validQuiz = {
    title: 'PHP Fundamentals',
    description: 'Review core PHP concepts.',
    subject: 'Programming',
    time_limit_seconds: 900,
    questions: [
        {
            text: 'What does PDO stand for?',
            options: [
                { text: 'PHP Data Objects', is_correct: true },
                { text: 'Personal Database Output', is_correct: false }
            ]
        }
    ]
};

test('accepts a quiz with valid questions and exactly one correct option', () => {
    const result = validateQuizPayload(validQuiz);
    assert.equal(result.error, undefined);
    assert.equal(result.value.questions[0].options[0].is_correct, true);
});

test('normalizes whitespace in quiz text and choices', () => {
    const result = validateQuizPayload({
        ...validQuiz,
        title: '  PHP Fundamentals  ',
        questions: [{
            ...validQuiz.questions[0],
            text: ' What does PDO stand for? ',
            options: [
                { text: ' PHP Data Objects ', is_correct: true },
                validQuiz.questions[0].options[1]
            ]
        }]
    });
    assert.equal(result.value.title, 'PHP Fundamentals');
    assert.equal(result.value.questions[0].text, 'What does PDO stand for?');
    assert.equal(result.value.questions[0].options[0].text, 'PHP Data Objects');
});

test('rejects quizzes without exactly one correct option per question', () => {
    const result = validateQuizPayload({
        ...validQuiz,
        questions: [{
            ...validQuiz.questions[0],
            options: validQuiz.questions[0].options.map((option) => ({
                ...option,
                is_correct: false
            }))
        }]
    });
    assert.match(result.error, /exactly one correct option/);
});

test('rejects choices outside the supported count', () => {
    const result = validateQuizPayload({
        ...validQuiz,
        questions: [{
            ...validQuiz.questions[0],
            options: [validQuiz.questions[0].options[0]]
        }]
    });
    assert.match(result.error, /between 2 and 10 options/);
});

test('requires a valid time limit', () => {
    const result = validateQuizPayload({
        ...validQuiz,
        time_limit_seconds: 30
    });
    assert.match(result.error, /60 to 86400 seconds/);
});

test('requires a subject for professor-authored quizzes', () => {
    const result = validateQuizPayload({
        ...validQuiz,
        subject: ' '
    });
    assert.match(result.error, /Subject is required/);
});

test('accepts only positive integer attempt IDs from JSON requests', () => {
    assert.equal(parseAttemptId(12), 12);
    assert.equal(parseAttemptId(0), null);
    assert.equal(parseAttemptId(-1), null);
    assert.equal(parseAttemptId('12'), null);
    assert.equal(parseAttemptId(true), null);
});

test('maps each role to a separate profile table and rejects unknown roles', () => {
    assert.equal(getProfileTableForRole('student'), 'student_profiles');
    assert.equal(getProfileTableForRole('professor'), 'professor_profiles');
    assert.equal(getProfileTableForRole('admin'), 'admin_profiles');
    assert.throws(() => getProfileTableForRole('owner'), /Unsupported user role/);
    assert.throws(() => getProfileTableForRole('toString'), /Unsupported user role/);
});

test('role middleware allows only the configured role', () => {
    const middleware = requireRole('admin');
    let responseStatus;
    let nextCalled = false;
    const response = {
        status(status) {
            responseStatus = status;
            return this;
        },
        json() {
            return this;
        }
    };

    middleware({ auth: { role: 'professor' } }, response, () => {
        nextCalled = true;
    });
    assert.equal(responseStatus, 403);
    assert.equal(nextCalled, false);

    middleware({ auth: { role: 'admin' } }, response, () => {
        nextCalled = true;
    });
    assert.equal(nextCalled, true);
});

test('grades selected choices using the stored answer key', () => {
    const result = gradeAnswers([
        { question_id: 1, option_id: 10, is_correct: true },
        { question_id: 1, option_id: 11, is_correct: false },
        { question_id: 2, option_id: 20, is_correct: false },
        { question_id: 2, option_id: 21, is_correct: true }
    ], [
        { question_id: 1, option_id: 10 },
        { question_id: 2, option_id: 20 }
    ]);

    assert.deepEqual(result, { score: 1, totalQuestions: 2 });
});

test('counts unanswered questions as wrong and rejects choices from another question', () => {
    const options = [
        { question_id: 1, option_id: 10, is_correct: true },
        { question_id: 2, option_id: 20, is_correct: true }
    ];

    assert.deepEqual(
        gradeAnswers(options, [{ question_id: 1, option_id: 10 }]),
        { score: 1, totalQuestions: 2 }
    );
    assert.throws(
        () => gradeAnswers(options, [
            { question_id: 1, option_id: 20 },
            { question_id: 2, option_id: 20 }
        ]),
        { code: 'INVALID_ANSWERS' }
    );
});
