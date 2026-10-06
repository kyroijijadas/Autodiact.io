import express from 'express';
import cors from 'cors';
import authRoutes from './app/Routes/authRoutes.js'; // Import your new routes
import quizRoutes from './app/Routes/quizRoutes.js'; // <-- 1. ADD THIS (Import the quiz routes)

const app = express();
const PORT = 3000;

app.use(cors()); 
app.use(express.json()); 

// Mount the auth routes under the /api prefix
app.use('/api', authRoutes);
app.use('/api/quizzes', quizRoutes); // <-- 2. ADD THIS (Mounts the route)

app.get('/', (req, res) => {
    res.json({ message: "Autodidact.io Express API is running!" });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});