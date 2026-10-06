 import Quiz from '../Models/Quiz.js';

class QuizController {

    static async createQuiz(req, res) {
        const { title, description } = req.body;

        if (!title || !description) {
            return res.status(400).json({ error: "Title and description are required" });
        }

        try {
            const newQuizId = await Quiz.create(title, description);
            res.status(201).json({ 
                message: "Quiz created successfully!", 
                quizId: newQuizId 
            });
        } catch (error) {
            console.error("Database error:", error);
            res.status(500).json({ error: "Failed to create quiz" });
        }

    }

    static async getAllQuizzes(req, res) {
        try {
            // Ask the Model to fetch the data
            const quizzes = await Quiz.getAllQuizzes();
            
            // Send the data back to Thunder Client/React as JSON
            res.status(200).json(quizzes);
        } catch (error) {
            console.error("Database error:", error);
            res.status(500).json({ error: "Failed to fetch quizzes" });
        }
    }

    static async getQuizByID(req, res) {
        const quizId = req.params.id; // Get the quiz ID from the URL parameter
        try{
            const quiz = await Quiz.getQuizByID(quizId);

            if (!quiz) {
                res.status(404).json({ error: "Quiz not found" });
            }

            res.status(200).json(quiz);

        }catch(error){
            console.error("Database error:", error);
            res.status(500).json({ error: "Failed to fetch quiz" });
        }
    }



}

export default QuizController;