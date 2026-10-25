const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cbt-examination';
        await mongoose.connect(uri);
        console.log('MongoDB Connected Successfully.');
    } catch (error) {
        console.error('MongoDB Connection Error:', error);
        process.exit(1);
    }
};

// --- SCHEMAS & MODELS ---

const studentSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    qId: { type: String, required: true, unique: true },
    email: { type: String },
    registrationDate: { type: Date, default: Date.now }
});

const questionSchema = new mongoose.Schema({
    category: { type: String, required: true }, // GATE, CAT, IELTS, Other
    subject: { type: String, required: true },
    passage: { type: String }, // Used for IELTS reading passages
    text: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: Number, required: true }, // Index of the correct option (0-3)
    marks: { type: Number, default: 1 },
    negativeMarks: { type: Number, default: 0 },
    difficulty: { type: String, default: 'Medium' }
});

const examSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    duration: { type: Number, required: true }, // in minutes
    totalQuestions: { type: Number, required: true },
    maxMarks: { type: Number, required: true }
});

const resultSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    examCategory: { type: String, required: true },
    answers: { type: Map, of: Number }, // questionId -> optionIndex
    correctCount: { type: Number, required: true },
    incorrectCount: { type: Number, required: true },
    unansweredCount: { type: Number, required: true },
    finalScore: { type: Number, required: true },
    submissionTime: { type: Date, default: Date.now }
});

// Compile Models
const Student = mongoose.model('Student', studentSchema);
const Question = mongoose.model('Question', questionSchema);
const Exam = mongoose.model('Exam', examSchema);
const Result = mongoose.model('Result', resultSchema);

module.exports = {
    connectDB,
    Student,
    Question,
    Exam,
    Result
};
