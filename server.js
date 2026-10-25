require('dotenv').config();
const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const { connectDB, Student, Question, Exam, Result } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname)); // Serve all static files from root directory

// --- SEED SAMPLE DATA ---
async function seedDatabase() {
    console.log("Seeding Exams and Previous Year Questions...");

    // 90 minutes (1.5 hours) duration for all exams
    await Exam.bulkWrite([
        {
            updateOne: {
                filter: { category: 'GATE' },
                update: { name: 'GATE CSE Previous Year', duration: 90, totalQuestions: 15, maxMarks: 30 },
                upsert: true
            }
        },
        {
            updateOne: {
                filter: { category: 'CAT' },
                update: { name: 'CAT Quant & LR Previous Year', duration: 90, totalQuestions: 20, maxMarks: 60 },
                upsert: true
            }
        },
        {
            updateOne: {
                filter: { category: 'IELTS' },
                update: { name: 'IELTS Academic Reading', duration: 90, totalQuestions: 25, maxMarks: 25 },
                upsert: true
            }
        }
    ]);

        const ieltsPassage = "Genetically modified (GM) food is produced from plants which have had their genes tweaked in the lab. Rice is grown everywhere except Antarctica. Scientists use gene splicing to introduce new characteristics, though environmentalists worry about cross-pollination with wild plants. Specialists recommend reviewing current regulatory policies.";

        const allQuestions = [
            // GATE CSE Questions
            {
                category: 'GATE', subject: 'Algorithms',
                text: 'What is the worst-case time complexity of the QuickSort algorithm?',
                options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'],
                correctAnswer: 2, marks: 2, negativeMarks: 0.66
            },
            {
                category: 'GATE', subject: 'Computer Networks',
                text: 'In IPv4, what is the maximum possible length of an IP datagram?',
                options: ['32768 bytes', '65535 bytes', '128000 bytes', '256 bytes'],
                correctAnswer: 1, marks: 2, negativeMarks: 0.66
            },
            {
                category: 'GATE', subject: 'Theory of Computation',
                text: 'Context-Free Languages are closed under which of the following operations?',
                options: ['Union', 'Intersection', 'Complement', 'Both Intersection and Complement'],
                correctAnswer: 0, marks: 2, negativeMarks: 0.66
            },
            {
                category: 'GATE', subject: 'Operating Systems',
                text: 'The minimum number of page frames that must be allocated to a running process is determined by:',
                options: ['Instruction length', 'Operating System design', 'Instruction Set Architecture', 'Physical memory size'],
                correctAnswer: 2, marks: 2, negativeMarks: 0.66
            },
            {
                category: 'GATE', subject: 'Database Management Systems',
                text: 'Which SQL command is used to permanently remove a table and its structure from a database?',
                options: ['DELETE', 'DROP', 'TRUNCATE', 'ALTER'],
                correctAnswer: 1, marks: 2, negativeMarks: 0.66
            },

            // CAT Questions
            {
                category: 'CAT', subject: 'Logical Reasoning',
                text: 'In a sports league, a win yields 3 points, a draw yields 1 point, and a loss yields 0 points. If a team played 8 matches, won 3, and accumulated a total of 11 points, how many matches did they draw?',
                options: ['1', '2', '3', '4'],
                correctAnswer: 1, marks: 3, negativeMarks: 1
            },
            {
                category: 'CAT', subject: 'Quantitative Aptitude',
                text: 'A company conducted a survey of 500 customers. 80% of customers were satisfied. Of the satisfied customers, 60% were repeat customers. How many customers were both satisfied and repeat?',
                options: ['200', '240', '300', '400'],
                correctAnswer: 1, marks: 3, negativeMarks: 1
            },
            {
                category: 'CAT', subject: 'Quantitative Aptitude',
                text: 'The sum of the ages of 5 children born at intervals of 3 years each is 50 years. What is the age of the youngest child?',
                options: ['4 years', '8 years', '10 years', '12 years'],
                correctAnswer: 0, marks: 3, negativeMarks: 1
            },
            {
                category: 'CAT', subject: 'Quantitative Aptitude',
                text: 'A train running at a speed of 60 km/hr crosses a stationary pole in exactly 9 seconds. What is the length of the train?',
                options: ['120 metres', '150 metres', '180 metres', '200 metres'],
                correctAnswer: 1, marks: 3, negativeMarks: 1
            },
            {
                category: 'CAT', subject: 'Data Interpretation',
                text: 'A family spends 30% of its Rs. 75,000 monthly income on rent and 25% on food. What is the combined expenditure on food and rent?',
                options: ['Rs. 30,000', 'Rs. 41,250', 'Rs. 50,000', 'Rs. 55,000'],
                correctAnswer: 1, marks: 3, negativeMarks: 1
            },

            // IELTS Questions
            {
                category: 'IELTS', subject: 'Academic Reading - Passage 1',
                passage: ieltsPassage,
                text: 'Read the excerpt: "Genetically modified food is produced from plants which have had their genes tweaked in the lab." Based on this sentence, the genetic makeup of GM foods has been:',
                options: ['Twisted', 'Altered', 'Cut', 'Ignored'],
                correctAnswer: 1, marks: 1, negativeMarks: 0
            },
            {
                category: 'IELTS', subject: 'Academic Reading - Passage 1',
                passage: ieltsPassage,
                text: 'Read the excerpt: "Rice is grown everywhere except Antarctica." Where is rice unable to be cultivated?',
                options: ['Only in Asia', 'Everywhere except Antarctica', 'In greenhouses only', 'Without water'],
                correctAnswer: 1, marks: 1, negativeMarks: 0
            },
            {
                category: 'IELTS', subject: 'Academic Reading - Passage 1',
                passage: ieltsPassage,
                text: 'Scientists "cut and paste" a gene from another organism into a plant\'s DNA primarily to:',
                options: ['Reduce farm sizes', 'Introduce a new characteristic', 'Change the plant colour', 'Increase water usage'],
                correctAnswer: 1, marks: 1, negativeMarks: 0
            },
            {
                category: 'IELTS', subject: 'Academic Reading - Passage 1',
                passage: ieltsPassage,
                text: 'One major issue identified by environmentalists regarding GM plants is the potential to:',
                options: ['Produce sweeter fruits', 'Infect wild plants with unknown results', 'Stop weeds from growing', 'Kill the original plant'],
                correctAnswer: 1, marks: 1, negativeMarks: 0
            },
            {
                category: 'IELTS', subject: 'Academic Reading - Passage 1',
                passage: ieltsPassage,
                text: 'According to specialists in biotechnology, the existing policies governing GM crops should be:',
                options: ['Tightened', 'Relaxed', 'Reviewed', 'Abandoned'],
                correctAnswer: 2, marks: 1, negativeMarks: 0
            },

            // Additional GATE Questions
            {
                category: 'GATE', subject: 'Data Structures',
                text: 'Which data structure is used to implement recursion?',
                options: ['Queue', 'Stack', 'Heap', 'Graph'],
                correctAnswer: 1, marks: 2, negativeMarks: 0.66
            },
            {
                category: 'GATE', subject: 'Algorithms',
                text: 'What is the time complexity of searching in a balanced binary search tree?',
                options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
                correctAnswer: 1, marks: 2, negativeMarks: 0.66
            },
            {
                category: 'GATE', subject: 'Data Structures',
                text: 'Which traversal of a binary search tree produces keys in sorted order?',
                options: ['Preorder', 'Postorder', 'Inorder', 'Level order'],
                correctAnswer: 2, marks: 2, negativeMarks: 0.66
            },
            {
                category: 'GATE', subject: 'Computer Networks',
                text: 'Which protocol is used to translate a domain name into an IP address?',
                options: ['HTTP', 'DNS', 'FTP', 'SMTP'],
                correctAnswer: 1, marks: 2, negativeMarks: 0.66
            },
            {
                category: 'GATE', subject: 'Computer Networks',
                text: 'Which layer of the OSI model is responsible for end-to-end delivery?',
                options: ['Network', 'Transport', 'Session', 'Data Link'],
                correctAnswer: 1, marks: 2, negativeMarks: 0.66
            },
            {
                category: 'GATE', subject: 'Operating Systems',
                text: 'A process waiting for an I/O operation is in which state?',
                options: ['Running', 'Ready', 'Blocked', 'Terminated'],
                correctAnswer: 2, marks: 2, negativeMarks: 0.66
            },
            {
                category: 'GATE', subject: 'Operating Systems',
                text: 'Which scheduling algorithm can cause starvation of low-priority processes?',
                options: ['FCFS', 'Round Robin', 'Priority Scheduling', 'FIFO'],
                correctAnswer: 2, marks: 2, negativeMarks: 0.66
            },
            {
                category: 'GATE', subject: 'Database Management Systems',
                text: 'Which normal form removes partial functional dependencies?',
                options: ['1NF', '2NF', '3NF', 'BCNF'],
                correctAnswer: 1, marks: 2, negativeMarks: 0.66
            },
            {
                category: 'GATE', subject: 'Database Management Systems',
                text: 'Which property of a transaction ensures that committed changes survive a system failure?',
                options: ['Atomicity', 'Consistency', 'Isolation', 'Durability'],
                correctAnswer: 3, marks: 2, negativeMarks: 0.66
            },
            {
                category: 'GATE', subject: 'Theory of Computation',
                text: 'Which machine recognizes exactly the regular languages?',
                options: ['Finite automaton', 'Pushdown automaton', 'Turing machine only', 'Linear bounded automaton'],
                correctAnswer: 0, marks: 2, negativeMarks: 0.66
            },

            // Additional CAT Questions
            {
                category: 'CAT', subject: 'Quantitative Aptitude',
                text: 'If 3x + 5 = 20, what is the value of x?',
                options: ['3', '5', '7', '10'],
                correctAnswer: 1, marks: 3, negativeMarks: 1
            },
            {
                category: 'CAT', subject: 'Quantitative Aptitude',
                text: 'A product marked at Rs. 800 is sold at a 15% discount. What is its selling price?',
                options: ['Rs. 660', 'Rs. 680', 'Rs. 700', 'Rs. 720'],
                correctAnswer: 1, marks: 3, negativeMarks: 1
            },
            {
                category: 'CAT', subject: 'Quantitative Aptitude',
                text: 'The average of 8 numbers is 24. If one number is removed, the average becomes 22. What is the removed number?',
                options: ['36', '38', '40', '42'],
                correctAnswer: 2, marks: 3, negativeMarks: 1
            },
            {
                category: 'CAT', subject: 'Quantitative Aptitude',
                text: 'A can complete a job in 12 days and B in 18 days. How many days will they take together?',
                options: ['6.2 days', '7.2 days', '8 days', '9 days'],
                correctAnswer: 1, marks: 3, negativeMarks: 1
            },
            {
                category: 'CAT', subject: 'Quantitative Aptitude',
                text: 'What is the probability of drawing a king from a standard deck of 52 cards?',
                options: ['1/13', '1/26', '4/13', '1/4'],
                correctAnswer: 0, marks: 3, negativeMarks: 1
            },
            {
                category: 'CAT', subject: 'Logical Reasoning',
                text: 'If CODE is written as DPEF, how is MATH written using the same pattern?',
                options: ['NBUG', 'NBUI', 'LZSG', 'OCTJ'],
                correctAnswer: 1, marks: 3, negativeMarks: 1
            },
            {
                category: 'CAT', subject: 'Logical Reasoning',
                text: 'Find the next number in the series: 2, 6, 12, 20, 30, ?',
                options: ['40', '42', '44', '46'],
                correctAnswer: 1, marks: 3, negativeMarks: 1
            },
            {
                category: 'CAT', subject: 'Logical Reasoning',
                text: 'Pointing to a woman, Raj says, “She is the daughter of the only child of my grandfather.” How is the woman related to Raj?',
                options: ['Mother', 'Sister', 'Cousin', 'Aunt'],
                correctAnswer: 1, marks: 3, negativeMarks: 1
            },
            {
                category: 'CAT', subject: 'Verbal Ability',
                text: 'Choose the word closest in meaning to “mitigate”.',
                options: ['Increase', 'Reduce', 'Ignore', 'Predict'],
                correctAnswer: 1, marks: 3, negativeMarks: 1
            },
            {
                category: 'CAT', subject: 'Verbal Ability',
                text: 'Choose the correctly spelled word.',
                options: ['Accomodation', 'Acommodation', 'Accommodation', 'Accommadation'],
                correctAnswer: 2, marks: 3, negativeMarks: 1
            },
            {
                category: 'CAT', subject: 'Data Interpretation',
                text: 'A shop sells 120 units in January and 150 in February. What is the percentage increase?',
                options: ['20%', '25%', '30%', '35%'],
                correctAnswer: 1, marks: 3, negativeMarks: 1
            },
            {
                category: 'CAT', subject: 'Quantitative Aptitude',
                text: 'If the ratio of boys to girls in a class is 3:2 and there are 35 students, how many are boys?',
                options: ['15', '18', '21', '24'],
                correctAnswer: 2, marks: 3, negativeMarks: 1
            },
            {
                category: 'CAT', subject: 'Quantitative Aptitude',
                text: 'The simple interest on Rs. 5,000 at 8% per annum for 2 years is:',
                options: ['Rs. 400', 'Rs. 800', 'Rs. 1,000', 'Rs. 1,200'],
                correctAnswer: 1, marks: 3, negativeMarks: 1
            },
            {
                category: 'CAT', subject: 'Logical Reasoning',
                text: 'Five people stand in a line. Anu is before Bala but after Chitra. Deepak is after Bala. Who must be before Anu?',
                options: ['Bala', 'Chitra', 'Deepak', 'Cannot be determined'],
                correctAnswer: 1, marks: 3, negativeMarks: 1
            },
            {
                category: 'CAT', subject: 'Verbal Ability',
                text: 'Select the antonym of “scarce”.',
                options: ['Rare', 'Limited', 'Abundant', 'Insufficient'],
                correctAnswer: 2, marks: 3, negativeMarks: 1
            },

            // Additional IELTS Questions
            {
                category: 'IELTS', subject: 'Academic Reading - Passage 2',
                passage: 'Urban trees improve air quality, reduce summer temperatures, and provide habitats for wildlife. However, they require careful planning because their roots can affect pavements and underground pipes.',
                text: 'Which benefit of urban trees is mentioned in the passage?',
                options: ['They increase traffic', 'They improve air quality', 'They eliminate all noise', 'They require no maintenance'],
                correctAnswer: 1, marks: 1, negativeMarks: 0
            },
            {
                category: 'IELTS', subject: 'Academic Reading - Passage 2',
                passage: 'Urban trees improve air quality, reduce summer temperatures, and provide habitats for wildlife. However, they require careful planning because their roots can affect pavements and underground pipes.',
                text: 'Why do urban trees require careful planning?',
                options: ['They grow only in winter', 'Their roots may affect infrastructure', 'They prevent wildlife habitats', 'Their leaves reduce rainfall'],
                correctAnswer: 1, marks: 1, negativeMarks: 0
            },
            {
                category: 'IELTS', subject: 'Academic Reading - Passage 2',
                passage: 'Urban trees improve air quality, reduce summer temperatures, and provide habitats for wildlife. However, they require careful planning because their roots can affect pavements and underground pipes.',
                text: 'The word “habitats” is closest in meaning to:',
                options: ['Food sources', 'Natural homes', 'Weather patterns', 'Building materials'],
                correctAnswer: 1, marks: 1, negativeMarks: 0
            },
            {
                category: 'IELTS', subject: 'Academic Reading - Passage 2',
                passage: 'Urban trees improve air quality, reduce summer temperatures, and provide habitats for wildlife. However, they require careful planning because their roots can affect pavements and underground pipes.',
                text: 'What can urban trees reduce during summer?',
                options: ['Temperatures', 'Wildlife', 'Pavements', 'Rainfall'],
                correctAnswer: 0, marks: 1, negativeMarks: 0
            },
            {
                category: 'IELTS', subject: 'Academic Reading - Passage 2',
                passage: 'Urban trees improve air quality, reduce summer temperatures, and provide habitats for wildlife. However, they require careful planning because their roots can affect pavements and underground pipes.',
                text: 'The passage suggests that urban trees:',
                options: ['Have benefits and possible drawbacks', 'Always damage buildings', 'Cannot survive in cities', 'Need no planning'],
                correctAnswer: 0, marks: 1, negativeMarks: 0
            },
            {
                category: 'IELTS', subject: 'Academic Reading - Passage 3',
                passage: 'Many museums now offer virtual tours. These tours allow visitors to explore collections remotely and can make exhibitions accessible to people who cannot travel. They do not, however, fully reproduce the experience of seeing an object in person.',
                text: 'What do virtual tours allow visitors to do?',
                options: ['Buy every exhibit', 'Explore collections remotely', 'Travel without computers', 'Replace all museums'],
                correctAnswer: 1, marks: 1, negativeMarks: 0
            },
            {
                category: 'IELTS', subject: 'Academic Reading - Passage 3',
                passage: 'Many museums now offer virtual tours. These tours allow visitors to explore collections remotely and can make exhibitions accessible to people who cannot travel. They do not, however, fully reproduce the experience of seeing an object in person.',
                text: 'Who may particularly benefit from virtual museum tours?',
                options: ['People unable to travel', 'Museum employees only', 'Sculptors only', 'People without internet access'],
                correctAnswer: 0, marks: 1, negativeMarks: 0
            },
            {
                category: 'IELTS', subject: 'Academic Reading - Passage 3',
                passage: 'Many museums now offer virtual tours. These tours allow visitors to explore collections remotely and can make exhibitions accessible to people who cannot travel. They do not, however, fully reproduce the experience of seeing an object in person.',
                text: 'What limitation of virtual tours is stated?',
                options: ['They show no collections', 'They require travel', 'They cannot fully reproduce an in-person experience', 'They are available only at night'],
                correctAnswer: 2, marks: 1, negativeMarks: 0
            },
            {
                category: 'IELTS', subject: 'Academic Reading - Passage 3',
                passage: 'Many museums now offer virtual tours. These tours allow visitors to explore collections remotely and can make exhibitions accessible to people who cannot travel. They do not, however, fully reproduce the experience of seeing an object in person.',
                text: 'The word “accessible” is closest in meaning to:',
                options: ['Available to use', 'Expensive to buy', 'Difficult to understand', 'Hidden from visitors'],
                correctAnswer: 0, marks: 1, negativeMarks: 0
            },
            {
                category: 'IELTS', subject: 'Academic Reading - Passage 3',
                passage: 'Many museums now offer virtual tours. These tours allow visitors to explore collections remotely and can make exhibitions accessible to people who cannot travel. They do not, however, fully reproduce the experience of seeing an object in person.',
                text: 'Which statement best summarizes the passage?',
                options: ['Virtual tours provide remote access but cannot replace every aspect of visiting a museum',
                    'Museums are closing because of virtual tours',
                    'Virtual tours are useful only for museum staff',
                    'Visitors must travel to use virtual tours'],
                correctAnswer: 0, marks: 1, negativeMarks: 0
            },
            {
                category: 'IELTS', subject: 'Academic Reading - Passage 4',
                passage: 'Sleep supports memory by helping the brain organize information learned during the day. Researchers also associate regular sleep with improved concentration. Both very short and irregular sleep may reduce these benefits.',
                text: 'How does sleep support memory?',
                options: ['By organizing newly learned information', 'By preventing learning', 'By increasing noise', 'By shortening the day'],
                correctAnswer: 0, marks: 1, negativeMarks: 0
            },
            {
                category: 'IELTS', subject: 'Academic Reading - Passage 4',
                passage: 'Sleep supports memory by helping the brain organize information learned during the day. Researchers also associate regular sleep with improved concentration. Both very short and irregular sleep may reduce these benefits.',
                text: 'Regular sleep is associated with improved:',
                options: ['Concentration', 'Hunger', 'Noise levels', 'Travel speed'],
                correctAnswer: 0, marks: 1, negativeMarks: 0
            },
            {
                category: 'IELTS', subject: 'Academic Reading - Passage 4',
                passage: 'Sleep supports memory by helping the brain organize information learned during the day. Researchers also associate regular sleep with improved concentration. Both very short and irregular sleep may reduce these benefits.',
                text: 'What may reduce the benefits described in the passage?',
                options: ['Reading regularly', 'Very short or irregular sleep', 'Learning during the day', 'Improved concentration'],
                correctAnswer: 1, marks: 1, negativeMarks: 0
            },
            {
                category: 'IELTS', subject: 'Academic Reading - Passage 4',
                passage: 'Sleep supports memory by helping the brain organize information learned during the day. Researchers also associate regular sleep with improved concentration. Both very short and irregular sleep may reduce these benefits.',
                text: 'The word “associate” is closest in meaning to:',
                options: ['Connect', 'Separate', 'Remove', 'Oppose'],
                correctAnswer: 0, marks: 1, negativeMarks: 0
            },
            {
                category: 'IELTS', subject: 'Academic Reading - Passage 4',
                passage: 'Sleep supports memory by helping the brain organize information learned during the day. Researchers also associate regular sleep with improved concentration. Both very short and irregular sleep may reduce these benefits.',
                text: 'Which title best fits the passage?',
                options: ['The relationship between sleep and mental performance', 'The history of alarm clocks', 'How to avoid learning', 'The causes of daytime noise'],
                correctAnswer: 0, marks: 1, negativeMarks: 0
            },
            {
                category: 'IELTS', subject: 'Academic Reading - Passage 5',
                passage: 'Community gardens transform unused urban land into shared growing spaces. Besides producing vegetables, they can encourage neighbours to cooperate and teach children about local ecosystems.',
                text: 'What can community gardens transform?',
                options: ['Unused urban land', 'National parks', 'Underground stations', 'Private airports'],
                correctAnswer: 0, marks: 1, negativeMarks: 0
            },
            {
                category: 'IELTS', subject: 'Academic Reading - Passage 5',
                passage: 'Community gardens transform unused urban land into shared growing spaces. Besides producing vegetables, they can encourage neighbours to cooperate and teach children about local ecosystems.',
                text: 'What can community gardens produce?',
                options: ['Vegetables', 'Fuel', 'Cars', 'Computer software'],
                correctAnswer: 0, marks: 1, negativeMarks: 0
            },
            {
                category: 'IELTS', subject: 'Academic Reading - Passage 5',
                passage: 'Community gardens transform unused urban land into shared growing spaces. Besides producing vegetables, they can encourage neighbours to cooperate and teach children about local ecosystems.',
                text: 'Community gardens can encourage neighbours to:',
                options: ['Cooperate', 'Move abroad', 'Avoid one another', 'Stop gardening'],
                correctAnswer: 0, marks: 1, negativeMarks: 0
            },
            {
                category: 'IELTS', subject: 'Academic Reading - Passage 5',
                passage: 'Community gardens transform unused urban land into shared growing spaces. Besides producing vegetables, they can encourage neighbours to cooperate and teach children about local ecosystems.',
                text: 'What can children learn about in community gardens?',
                options: ['Local ecosystems', 'Airline schedules', 'Financial markets', 'Road construction'],
                correctAnswer: 0, marks: 1, negativeMarks: 0
            },
            {
                category: 'IELTS', subject: 'Academic Reading - Passage 5',
                passage: 'Community gardens transform unused urban land into shared growing spaces. Besides producing vegetables, they can encourage neighbours to cooperate and teach children about local ecosystems.',
                text: 'Which statement best summarizes the passage?',
                options: ['Community gardens provide food and social and educational benefits',
                    'Community gardens can be used only by farmers',
                    'Urban land cannot support plants',
                    'Children are not involved in community gardens'],
                correctAnswer: 0, marks: 1, negativeMarks: 0
            }
        ];

        const targetCounts = { GATE: 15, CAT: 20, IELTS: 25 };
        for (const [category, targetCount] of Object.entries(targetCounts)) {
            const currentCount = await Question.countDocuments({ category });
            if (currentCount < targetCount) {
                const questionsToAdd = allQuestions
                    .filter(question => question.category === category)
                    .slice(currentCount, targetCount);
                if (questionsToAdd.length > 0) {
                    await Question.insertMany(questionsToAdd);
                }
            }
        }
        console.log("Seeding complete.");
}

connectDB().then(seedDatabase);

// --- API ENDPOINTS ---

// 1. Student Registration
app.post('/api/register', async (req, res) => {
    try {
        const { fullName, phoneNumber, qId, email, category } = req.body;
        
        if (!fullName || !phoneNumber || !qId || !category) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        let student = await Student.findOne({ qId });
        if (!student) {
            student = new Student({ fullName, phoneNumber, qId, email });
            await student.save();
        }
        
        res.json({ studentId: student._id, category });
    } catch (error) {
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// 2. Get Exam Details
app.get('/api/exams/:category', async (req, res) => {
    try {
        const exam = await Exam.findOne({ category: req.params.category });
        if (!exam) return res.status(404).json({ error: 'Exam not found' });
        res.json(exam);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// 3. Get Questions (Without Correct Answers)
app.get('/api/questions/:category', async (req, res) => {
    try {
        // Find questions and exclude correctAnswer to prevent cheating
        const questions = await Question.find({ category: req.params.category }).select('-correctAnswer');
        res.json(questions);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// 4. Submit Examination and Calculate Score Server-Side
app.post('/api/submit', async (req, res) => {
    try {
        const { studentId, category, answers } = req.body;
        
        const exam = await Exam.findOne({ category });
        const questions = await Question.find({ category });
        
        let correctCount = 0;
        let incorrectCount = 0;
        let finalScore = 0;
        let unansweredCount = 0;

        questions.forEach(q => {
            const studentAns = answers[q._id.toString()];
            if (studentAns !== undefined && studentAns !== null) {
                if (studentAns === q.correctAnswer) {
                    correctCount++;
                    finalScore += q.marks;
                } else {
                    incorrectCount++;
                    finalScore -= q.negativeMarks;
                }
            } else {
                unansweredCount++;
            }
        });

        const result = new Result({
            studentId,
            examCategory: category,
            answers,
            correctCount,
            incorrectCount,
            unansweredCount,
            finalScore
        });

        await result.save();
        res.json({ resultId: result._id });
    } catch (error) {
        res.status(500).json({ error: 'Server error during submission' });
    }
});

// 5. Get Result
app.get('/api/results/:resultId', async (req, res) => {
    try {
        const result = await Result.findById(req.params.resultId).populate('studentId', 'fullName qId');
        if (!result) return res.status(404).json({ error: 'Result not found' });
        
        const exam = await Exam.findOne({ category: result.examCategory });
        res.json({ result, exam });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// --- ADMIN APIs ---

app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Middleware for Admin Auth
const verifyAdmin = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: 'No token provided' });
    
    jwt.verify(token.split(' ')[1], process.env.JWT_SECRET, (err, decoded) => {
        if (err || decoded.role !== 'admin') return res.status(401).json({ error: 'Unauthorized' });
        next();
    });
};

app.get('/api/admin/results', verifyAdmin, async (req, res) => {
    try {
        const results = await Result.find().populate('studentId', 'fullName qId phoneNumber');
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Fallback route for SPA if needed
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});