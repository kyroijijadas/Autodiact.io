  import pool from './db.js';

  export default class Quiz {

    static async create(title, description) {
        const [result] = await pool.execute('INSERT INTO quizzes (title, description) VALUES (?, ?)', [title, description]);
        return result.insertId; // Returns the new quiz's ID
    }

    // A static method means we can call Quiz.getAllQuizzes() without using 'new Quiz()'
    static async getAllQuizzes() {
        // pool.execute() safely runs the SQL and prevents SQL injection
        const [rows] = await pool.execute('SELECT * FROM quizzes');
        return rows; // Returns the array of quiz objects
    }

    static async getQuizByID(quizId){
        const [rows] = await pool.execute('SELECT * FROM quizzes WHERE id = ?', [quizId]);
        return rows[0]; // Return the first matched quiz, or undefined if not found
    }

  }