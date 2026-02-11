const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const nodemailer = require('nodemailer');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend assets
const frontendDir = path.join(__dirname, '..', 'frontend');
const frontendCssDir = path.join(__dirname, '..', 'frontend css');
const frontendJsDir = path.join(__dirname, '..', 'frontend js');
app.use('/frontend', express.static(frontendDir));
app.use('/frontend css', express.static(frontendCssDir));
app.use('/frontend-css', express.static(frontendCssDir));
app.use('/frontend js', express.static(frontendJsDir));
app.use('/frontend-js', express.static(frontendJsDir));

// ===========================
// DATABASE CONNECTION
// ===========================
const db = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'aptitude_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test database connection
db.getConnection((err, connection) => {
    if (err) {
        console.error('âŒ Database connection failed:', err.message);
    } else {
        console.log('âœ… Database connected successfully');
        connection.release();
        ensureQuestionBank();
    }
});

// ===========================
// QUESTION BANK SEEDING
// ===========================
function buildPlaceholderQuestion(topic, index) {
    const questionText = `[${topic}] Question ${index}: What is the correct answer?`;
    return {
        topic,
        question: questionText,
        option_a: 'Option A',
        option_b: 'Option B',
        option_c: 'Option C',
        option_d: 'Option D'
    };
}

function seedQuestionsForTopic(topic, count, callback) {
    const placeholders = [];
    for (let i = 1; i <= count; i++) {
        placeholders.push(buildPlaceholderQuestion(topic, i));
    }

    const insertQuery = `
        INSERT INTO questions (topic, question, option_a, option_b, option_c, option_d, correct_option)
        VALUES ?
    `;
    const values = placeholders.map(q => [
        q.topic,
        q.question,
        q.option_a,
        q.option_b,
        q.option_c,
        q.option_d,
        'A'
    ]);
    db.query(insertQuery, [values], callback);
}

function seedQuestionSet(topic, questions, callback) {
    const insertQuery = `
        INSERT INTO questions (topic, question, option_a, option_b, option_c, option_d, correct_option)
        VALUES ?
    `;
    const values = questions.map(q => [
        topic,
        q.question,
        q.options[0],
        q.options[1],
        q.options[2],
        q.options[3],
        q.correct
    ]);
    db.query(insertQuery, [values], callback);
}

function ensureQuestionBank() {
    const countQuery = `SELECT topic, COUNT(*) as count FROM questions GROUP BY topic`;
    db.query(countQuery, (err, results) => {
        if (err) {
            console.error('Question bank check failed:', err.message);
            return;
        }

        const existingCounts = {};
        results.forEach(row => {
            existingCounts[row.topic] = row.count;
        });

        const topicQuestionSets = {
            Maths: MATH_QUESTIONS,
            Logic: LOGIC_QUESTIONS,
            Cloud: CLOUD_QUESTIONS,
            Networking: NETWORKING_QUESTIONS
        };

        QUESTION_TOPICS.forEach(topic => {
            if (topicQuestionSets[topic]) {
                const set = topicQuestionSets[topic];
                const existing = existingCounts[topic] || 0;
                if (existing !== set.length) {
                    db.query('DELETE FROM questions WHERE topic = ?', [topic], (delErr) => {
                        if (delErr) {
                            console.error(`Failed to reset ${topic} questions:`, delErr.message);
                            return;
                        }
                        seedQuestionSet(topic, set, (seedErr) => {
                            if (seedErr) {
                                console.error(`Failed to seed ${topic} questions:`, seedErr.message);
                            } else {
                                console.log(`Seeded ${topic} questions:`, set.length);
                            }
                        });
                    });
                }
                return;
            }

            const existing = existingCounts[topic] || 0;
            const missing = QUESTIONS_PER_TOPIC - existing;
            if (missing > 0) {
                console.log(`Seeding ${missing} questions for topic: ${topic}`);
                seedQuestionsForTopic(topic, missing, (seedErr) => {
                    if (seedErr) {
                        console.error(`Failed to seed questions for ${topic}:`, seedErr.message);
                    } else {
                        console.log(`Seeded ${missing} questions for ${topic}`);
                    }
                });
            }
        });
    });
}

// ===========================
// GEMINI API SETUP
// ===========================
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

// ===========================
// QUESTION BANK CONFIG
// ===========================
const QUESTION_TOPICS = ['Maths', 'Language', 'Networking', 'Logic', 'Cloud', 'Security'];
const QUESTIONS_PER_TOPIC = 40;

const MATH_QUESTIONS = [
    {
        question: "What is the value of 25^2 - 15^2?",
        options: ["400", "500", "600", "800"],
        correct: "A"
    },
    {
        question: "If the ratio of two numbers is 3:5 and their sum is 64, find the larger number.",
        options: ["24", "32", "40", "48"],
        correct: "C"
    },
    {
        question: "Find the HCF of 24 and 36.",
        options: ["6", "12", "18", "24"],
        correct: "B"
    },
    {
        question: "A train travels 60 km in 1.5 hours. What is its speed?",
        options: ["30 km/h", "40 km/h", "45 km/h", "50 km/h"],
        correct: "B"
    },
    {
        question: "What is 20% of 250?",
        options: ["40", "45", "50", "60"],
        correct: "C"
    },
    {
        question: "Simplify: 3/4 + 5/8",
        options: ["1", "1 1/8", "1 3/8", "1 1/2"],
        correct: "C"
    },
    {
        question: "If x = 5, find the value of 2x^2 + 3x.",
        options: ["55", "60", "65", "70"],
        correct: "C"
    },
    {
        question: "The average of 10 numbers is 15. What is their sum?",
        options: ["150", "140", "160", "145"],
        correct: "A"
    },
    {
        question: "Find the simple interest on Rs 2000 at 5% for 2 years.",
        options: ["Rs 150", "Rs 200", "Rs 250", "Rs 300"],
        correct: "B"
    },
    {
        question: "What is the square root of 144?",
        options: ["10", "11", "12", "13"],
        correct: "C"
    },
    {
        question: "If 12 men can complete a work in 10 days, how many days will 6 men take?",
        options: ["15", "18", "20", "25"],
        correct: "C"
    },
    {
        question: "What is the LCM of 8 and 12?",
        options: ["12", "16", "24", "48"],
        correct: "C"
    },
    {
        question: "Convert 0.75 into a fraction.",
        options: ["1/2", "2/3", "3/4", "4/5"],
        correct: "C"
    },
    {
        question: "If a number is increased by 20%, what is the multiplying factor?",
        options: ["1.2", "1.5", "0.8", "2.0"],
        correct: "A"
    },
    {
        question: "Find the perimeter of a square of side 7 cm.",
        options: ["21 cm", "24 cm", "28 cm", "49 cm"],
        correct: "C"
    },
    {
        question: "The sum of angles of a triangle is:",
        options: ["90 degrees", "180 degrees", "270 degrees", "360 degrees"],
        correct: "B"
    },
    {
        question: "What is the value of 9^3?",
        options: ["81", "243", "729", "656"],
        correct: "C"
    },
    {
        question: "If CP = Rs 500 and SP = Rs 600, find profit percentage.",
        options: ["15%", "20%", "25%", "30%"],
        correct: "B"
    },
    {
        question: "How many minutes are there in 2.5 hours?",
        options: ["120", "140", "150", "180"],
        correct: "C"
    },
    {
        question: "Find the next number: 2, 6, 12, 20, ___",
        options: ["28", "30", "32", "36"],
        correct: "B"
    },
    {
        question: "What is 3/5 of 100?",
        options: ["50", "60", "70", "80"],
        correct: "B"
    },
    {
        question: "The area of a rectangle is 50 sq units and length is 10. Find breadth.",
        options: ["2", "4", "5", "10"],
        correct: "C"
    },
    {
        question: "Convert 45% to fraction.",
        options: ["4/5", "9/20", "45/100", "1/2"],
        correct: "B"
    },
    {
        question: "What is the cube root of 64?",
        options: ["2", "3", "4", "6"],
        correct: "C"
    },
    {
        question: "Find the value of: (7 x 8) - (6 x 5)",
        options: ["16", "20", "26", "56"],
        correct: "C"
    },
    {
        question: "If the cost price is Rs 400 and loss is 10%, find SP.",
        options: ["Rs 360", "Rs 370", "Rs 380", "Rs 390"],
        correct: "A"
    },
    {
        question: "What is the value of pi (approx)?",
        options: ["3.12", "3.14", "3.15", "3.18"],
        correct: "B"
    },
    {
        question: "Find the missing number: 5, 10, 20, 40, ___",
        options: ["50", "60", "80", "100"],
        correct: "C"
    },
    {
        question: "The ratio 2:3 is equivalent to:",
        options: ["4:5", "6:9", "8:10", "10:12"],
        correct: "B"
    },
    {
        question: "How many sides does a hexagon have?",
        options: ["5", "6", "7", "8"],
        correct: "B"
    },
    {
        question: "If x + 5 = 12, find x.",
        options: ["5", "6", "7", "8"],
        correct: "C"
    },
    {
        question: "What is 15% of 200?",
        options: ["20", "25", "30", "35"],
        correct: "C"
    },
    {
        question: "Find the average of 5, 10, 15.",
        options: ["10", "12", "15", "20"],
        correct: "A"
    },
    {
        question: "What is the value of 2^5?",
        options: ["16", "24", "32", "64"],
        correct: "C"
    },
    {
        question: "Which number is a prime?",
        options: ["21", "29", "39", "49"],
        correct: "B"
    },
    {
        question: "The area of a square is 36 sq units. Find its side.",
        options: ["4", "5", "6", "9"],
        correct: "C"
    },
    {
        question: "1 km = ?",
        options: ["100 m", "500 m", "1000 m", "1500 m"],
        correct: "C"
    },
    {
        question: "What is the value of 7 x 9?",
        options: ["54", "56", "63", "72"],
        correct: "C"
    },
    {
        question: "Find the odd one out: 2, 4, 8, 16, 18",
        options: ["2", "8", "16", "18"],
        correct: "D"
    },
    {
        question: "If today is Monday, what day will it be after 10 days?",
        options: ["Wednesday", "Thursday", "Friday", "Saturday"],
        correct: "B"
    }
];

const LOGIC_QUESTIONS = [
    {
        question: "Find the next number in the series: 2, 6, 12, 20, ?",
        options: ["28", "30", "32", "36"],
        correct: "A"
    },
    {
        question: "Which number is the odd one out? 3, 7, 11, 13, 17",
        options: ["3", "7", "11", "13"],
        correct: "B"
    },
    {
        question: "If CAT = 24, then DOG = ?",
        options: ["26", "27", "28", "30"],
        correct: "C"
    },
    {
        question: "Find the missing number: 4, 9, 16, 25, ?",
        options: ["30", "35", "36", "49"],
        correct: "C"
    },
    {
        question: "If A = 1, B = 2, ..., Z = 26, what is the value of LOGIC?",
        options: ["52", "53", "54", "55"],
        correct: "B"
    },
    {
        question: "Find the next term: 1, 4, 9, 16, ?",
        options: ["20", "24", "25", "36"],
        correct: "C"
    },
    {
        question: "Which word does NOT belong to the group?",
        options: ["Apple", "Banana", "Carrot", "Mango"],
        correct: "C"
    },
    {
        question: "Find the missing number: 5, 10, 20, 40, ?",
        options: ["60", "70", "80", "100"],
        correct: "C"
    },
    {
        question: "If 5 + 3 = 28 and 4 + 2 = 18, then 6 + 4 = ?",
        options: ["40", "44", "48", "52"],
        correct: "C"
    },
    {
        question: "Find the odd one out: Square, Rectangle, Triangle, Cube",
        options: ["Square", "Rectangle", "Triangle", "Cube"],
        correct: "D"
    },
    {
        question: "If CLOCK is written as KCOLC, how is WATCH written?",
        options: ["HCTAW", "HCTWA", "HCAWT", "HCTAW"],
        correct: "A"
    },
    {
        question: "Find the missing number: 7, 14, 28, ?, 112",
        options: ["42", "49", "56", "64"],
        correct: "C"
    },
    {
        question: "Which number is a prime?",
        options: ["21", "29", "35", "49"],
        correct: "B"
    },
    {
        question: "Find the next term: 2, 3, 5, 7, 11, ?",
        options: ["12", "13", "14", "15"],
        correct: "B"
    },
    {
        question: "If PEN = 35, then BOOK = ?",
        options: ["40", "41", "42", "43"],
        correct: "C"
    },
    {
        question: "Find the odd one out: Iron, Gold, Silver, Plastic",
        options: ["Iron", "Gold", "Silver", "Plastic"],
        correct: "D"
    },
    {
        question: "Find the missing number: 1, 8, 27, ?, 125",
        options: ["36", "54", "64", "81"],
        correct: "C"
    },
    {
        question: "Which comes next? AZ, BY, CX, ?",
        options: ["DW", "DX", "CY", "EV"],
        correct: "A"
    },
    {
        question: "If 3 Ã— 4 = 25 and 4 Ã— 5 = 41, then 5 Ã— 6 = ?",
        options: ["61", "65", "71", "75"],
        correct: "A"
    },
    {
        question: "Find the odd one out: Dog, Cat, Lion, Snake",
        options: ["Dog", "Cat", "Lion", "Snake"],
        correct: "D"
    },
    {
        question: "Find the next number: 100, 90, 80, ?, 60",
        options: ["75", "70", "65", "55"],
        correct: "B"
    },
    {
        question: "If MONDAY is coded as NPOEBZ, how is SUNDAY coded?",
        options: ["TVOEBZ", "TVOECA", "TVOEBZ", "TVOECA"],
        correct: "C"
    },
    {
        question: "Find the missing number: 2, 6, 18, 54, ?",
        options: ["108", "126", "162", "216"],
        correct: "C"
    },
    {
        question: "Which word does not belong?",
        options: ["Chair", "Table", "Bed", "Window"],
        correct: "D"
    },
    {
        question: "Find the next term: 1, 1, 2, 3, 5, ?",
        options: ["6", "7", "8", "9"],
        correct: "C"
    },
    {
        question: "If 8 â†’ 64 and 9 â†’ 81, then 7 â†’ ?",
        options: ["42", "48", "49", "56"],
        correct: "C"
    },
    {
        question: "Find the odd one out: January, March, May, July",
        options: ["January", "March", "May", "July"],
        correct: "A"
    },
    {
        question: "Find the missing number: 3, 9, 27, ?, 243",
        options: ["54", "72", "81", "108"],
        correct: "C"
    },
    {
        question: "If EAST = 1234, then WEST = ?",
        options: ["4321", "4312", "3421", "3412"],
        correct: "B"
    },
    {
        question: "Which number is NOT divisible by 3?",
        options: ["18", "21", "25", "27"],
        correct: "C"
    },
    {
        question: "Find the next number: 1, 4, 13, 40, ?",
        options: ["81", "121", "121", "121"],
        correct: "B"
    },
    {
        question: "Find the odd one out: Circle, Sphere, Cylinder, Square",
        options: ["Circle", "Sphere", "Cylinder", "Square"],
        correct: "D"
    },
    {
        question: "If 2 = 6, 3 = 12, then 4 = ?",
        options: ["16", "18", "20", "24"],
        correct: "D"
    },
    {
        question: "Find the missing number: 11, 22, 44, ?, 176",
        options: ["66", "77", "88", "99"],
        correct: "C"
    },
    {
        question: "Which is the odd one?",
        options: ["Pen", "Pencil", "Eraser", "Book"],
        correct: "D"
    },
    {
        question: "Find the next letter: A, C, E, G, ?",
        options: ["H", "I", "J", "K"],
        correct: "B"
    },
    {
        question: "If 10 â†’ 100, 5 â†’ 25, then 8 â†’ ?",
        options: ["56", "60", "64", "72"],
        correct: "C"
    },
    {
        question: "Find the missing number: 6, 13, 20, ?, 34",
        options: ["25", "26", "27", "28"],
        correct: "A"
    },
    {
        question: "Which word is different?",
        options: ["Red", "Blue", "Green", "Apple"],
        correct: "D"
    },
    {
        question: "Find the next number: 9, 18, 36, 72, ?",
        options: ["108", "144", "180", "216"],
        correct: "B"
    }
];

const CLOUD_QUESTIONS = [
    {
        question: "What is Cloud Computing?",
        options: ["Storing data on local servers", "Using remote servers over the internet", "Using only private networks", "Using hardware without software"],
        correct: "B"
    },
    {
        question: "Which of the following is a cloud service model?",
        options: ["LAN", "WAN", "IaaS", "VPN"],
        correct: "C"
    },
    {
        question: "What does IaaS stand for?",
        options: ["Internet as a Service", "Infrastructure as a Service", "Information as a Service", "Instance as a Service"],
        correct: "B"
    },
    {
        question: "Which cloud model provides virtual machines?",
        options: ["SaaS", "PaaS", "IaaS", "FaaS"],
        correct: "C"
    },
    {
        question: "What does PaaS provide?",
        options: ["Only applications", "Hardware only", "Platform to develop applications", "Network cables"],
        correct: "C"
    },
    {
        question: "Which service model provides ready-to-use applications?",
        options: ["IaaS", "PaaS", "SaaS", "DaaS"],
        correct: "C"
    },
    {
        question: "Which is an example of SaaS?",
        options: ["AWS EC2", "Google Docs", "Docker", "Kubernetes"],
        correct: "B"
    },
    {
        question: "Which cloud deployment model is shared by multiple organizations?",
        options: ["Private cloud", "Public cloud", "Hybrid cloud", "Community cloud"],
        correct: "D"
    },
    {
        question: "What is a Public Cloud?",
        options: ["Used by one organization only", "Accessible over the internet", "Installed on personal computers", "Works without internet"],
        correct: "B"
    },
    {
        question: "Which cloud is a combination of public and private clouds?",
        options: ["Community cloud", "Public cloud", "Private cloud", "Hybrid cloud"],
        correct: "D"
    },
    {
        question: "Which company provides AWS?",
        options: ["Microsoft", "Google", "Amazon", "IBM"],
        correct: "C"
    },
    {
        question: "What does AWS EC2 provide?",
        options: ["Storage", "Virtual servers", "Databases", "Email service"],
        correct: "B"
    },
    {
        question: "Which service is used for cloud storage?",
        options: ["EC2", "S3", "Lambda", "VPC"],
        correct: "B"
    },
    {
        question: "What does S3 stand for?",
        options: ["Simple Storage Service", "Secure Storage System", "Server Storage Setup", "Shared System Storage"],
        correct: "A"
    },
    {
        question: "Which cloud feature allows automatic resource scaling?",
        options: ["Virtualization", "Elasticity", "Redundancy", "Encryption"],
        correct: "B"
    },
    {
        question: "What is virtualization?",
        options: ["Running one OS on one machine", "Running multiple OS on one machine", "Removing hardware", "Increasing network speed"],
        correct: "B"
    },
    {
        question: "Which component enables virtualization?",
        options: ["Router", "Switch", "Hypervisor", "Firewall"],
        correct: "C"
    },
    {
        question: "Which hypervisor runs directly on hardware?",
        options: ["Type 1", "Type 2", "Type 3", "Virtual OS"],
        correct: "A"
    },
    {
        question: "What is pay-as-you-go pricing?",
        options: ["Fixed monthly payment", "Free services", "Pay only for used resources", "Lifetime license"],
        correct: "C"
    },
    {
        question: "Which cloud benefit reduces hardware costs?",
        options: ["Scalability", "High latency", "On-premise servers", "Manual maintenance"],
        correct: "A"
    },
    {
        question: "What is cloud availability?",
        options: ["Speed of the server", "Percentage of uptime", "Number of users", "Amount of storage"],
        correct: "B"
    },
    {
        question: "Which region concept improves fault tolerance?",
        options: ["Availability zones", "Databases", "Containers", "Billing"],
        correct: "A"
    },
    {
        question: "What is multi-tenancy?",
        options: ["One user per server", "Multiple users sharing resources", "Private ownership", "Local hosting"],
        correct: "B"
    },
    {
        question: "Which service is serverless?",
        options: ["EC2", "RDS", "Lambda", "VPC"],
        correct: "C"
    },
    {
        question: "Serverless means:",
        options: ["No servers exist", "User manages servers", "Cloud provider manages servers", "Application runs offline"],
        correct: "C"
    },
    {
        question: "Which cloud service is used for managed databases?",
        options: ["EC2", "RDS", "S3", "CloudFront"],
        correct: "B"
    },
    {
        question: "What does RDS stand for?",
        options: ["Relational Data Storage", "Remote Database Service", "Relational Database Service", "Redundant Data Service"],
        correct: "C"
    },
    {
        question: "Which cloud feature ensures data backup?",
        options: ["Scalability", "Redundancy", "Latency", "Load balancing"],
        correct: "B"
    },
    {
        question: "Which tool distributes traffic across servers?",
        options: ["Firewall", "Load balancer", "Router", "Gateway"],
        correct: "B"
    },
    {
        question: "What is cloud elasticity?",
        options: ["Fixed resources", "Manual scaling", "Automatic scaling", "Data compression"],
        correct: "C"
    },
    {
        question: "Which cloud provider is owned by Microsoft?",
        options: ["AWS", "Azure", "GCP", "Oracle Cloud"],
        correct: "B"
    },
    {
        question: "Which Google cloud service provides virtual machines?",
        options: ["App Engine", "Compute Engine", "Cloud Storage", "BigQuery"],
        correct: "B"
    },
    {
        question: "Which cloud model is most secure?",
        options: ["Public", "Private", "Community", "Hybrid"],
        correct: "B"
    },
    {
        question: "What is a VPC?",
        options: ["Virtual Private Cloud", "Virtual Public Connection", "Verified Private Channel", "Virtual Processing Core"],
        correct: "A"
    },
    {
        question: "Which cloud risk involves data exposure?",
        options: ["Scalability", "Data breach", "Redundancy", "Elasticity"],
        correct: "B"
    },
    {
        question: "What does cloud migration mean?",
        options: ["Creating cloud", "Moving applications to cloud", "Removing servers", "Buying hardware"],
        correct: "B"
    },
    {
        question: "Which factor improves performance?",
        options: ["Latency", "High traffic", "Load balancing", "Downtime"],
        correct: "C"
    },
    {
        question: "What is latency?",
        options: ["Storage size", "Network delay", "Server uptime", "Cost of service"],
        correct: "B"
    },
    {
        question: "Which service is used for content delivery?",
        options: ["S3", "EC2", "CDN", "RDS"],
        correct: "C"
    },
    {
        question: "Which cloud feature provides high availability?",
        options: ["Single server", "Multiple zones", "Manual backups", "Local storage"],
        correct: "B"
    },
    {
        question: "What is on-demand self-service?",
        options: ["Manual resource request", "Automatic provisioning", "Hardware installation", "Offline access"],
        correct: "B"
    },
    {
        question: "Which model allows full control over infrastructure?",
        options: ["SaaS", "PaaS", "IaaS", "FaaS"],
        correct: "C"
    },
    {
        question: "What does CAPEX reduction mean?",
        options: ["Higher investment", "Reduced upfront cost", "Increased maintenance", "Hardware purchase"],
        correct: "B"
    },
    {
        question: "Which cloud benefit improves business agility?",
        options: ["Fixed capacity", "Scalability", "Downtime", "Hardware lock-in"],
        correct: "B"
    },
    {
        question: "Which service stores unstructured data?",
        options: ["RDS", "EC2", "S3", "Lambda"],
        correct: "C"
    },
    {
        question: "Which cloud feature allows global access?",
        options: ["Local servers", "Internet-based access", "Manual deployment", "Offline hosting"],
        correct: "B"
    },
    {
        question: "Which cloud computing characteristic allows resource pooling?",
        options: ["Multi-tenancy", "Latency", "Downtime", "Bandwidth"],
        correct: "A"
    },
    {
        question: "What is cloud compliance?",
        options: ["Speed testing", "Following regulations", "Resource scaling", "Cost optimization"],
        correct: "B"
    },
    {
        question: "Which cloud service reduces operational overhead?",
        options: ["On-premise servers", "Manual maintenance", "Managed services", "Local databases"],
        correct: "C"
    },
    {
        question: "What is the main advantage of cloud computing?",
        options: ["Limited scalability", "High upfront cost", "Flexibility and scalability", "Hardware dependency"],
        correct: "C"
    }
];

const NETWORKING_QUESTIONS = [
    {
        question: "Which device operates at the Physical Layer of the OSI model?",
        options: ["Router", "Switch", "Hub", "Bridge"],
        correct: "C"
    },
    {
        question: "How many layers are there in the OSI model?",
        options: ["5", "6", "7", "8"],
        correct: "C"
    },
    {
        question: "Which protocol is used to transfer web pages?",
        options: ["FTP", "HTTP", "SMTP", "SNMP"],
        correct: "B"
    },
    {
        question: "Which device is used to connect two different networks?",
        options: ["Switch", "Hub", "Router", "Repeater"],
        correct: "C"
    },
    {
        question: "What is the default port number of HTTP?",
        options: ["21", "23", "80", "443"],
        correct: "C"
    },
    {
        question: "Which protocol is used to send emails?",
        options: ["POP3", "IMAP", "SMTP", "FTP"],
        correct: "C"
    },
    {
        question: "Which layer of the OSI model is responsible for encryption and compression?",
        options: ["Application", "Session", "Presentation", "Transport"],
        correct: "C"
    },
    {
        question: "What does IP stand for?",
        options: ["Internet Program", "Internet Protocol", "Internal Process", "Interface Protocol"],
        correct: "B"
    },
    {
        question: "Which device works at the Data Link Layer?",
        options: ["Router", "Switch", "Hub", "Modem"],
        correct: "B"
    },
    {
        question: "Which address is used to uniquely identify a device in a network?",
        options: ["Port address", "IP address", "MAC address", "URL"],
        correct: "C"
    },
    {
        question: "Which protocol converts domain names to IP addresses?",
        options: ["DHCP", "FTP", "DNS", "SNMP"],
        correct: "C"
    },
    {
        question: "Which topology has a central device?",
        options: ["Ring", "Bus", "Star", "Mesh"],
        correct: "C"
    },
    {
        question: "What is the full form of LAN?",
        options: ["Local Area Network", "Large Area Network", "Logical Area Network", "Light Access Network"],
        correct: "A"
    },
    {
        question: "Which protocol assigns IP addresses automatically?",
        options: ["DNS", "DHCP", "FTP", "SNMP"],
        correct: "B"
    },
    {
        question: "Which cable type is used in Ethernet networks?",
        options: ["Coaxial", "Fiber optic", "Twisted pair", "Serial"],
        correct: "C"
    },
    {
        question: "What is the maximum length of a UTP cable segment?",
        options: ["50 meters", "100 meters", "150 meters", "200 meters"],
        correct: "B"
    },
    {
        question: "Which layer ensures error-free delivery of data?",
        options: ["Network", "Transport", "Session", "Application"],
        correct: "B"
    },
    {
        question: "Which protocol is connection-oriented?",
        options: ["UDP", "IP", "TCP", "ICMP"],
        correct: "C"
    },
    {
        question: "Which device regenerates signals?",
        options: ["Router", "Switch", "Repeater", "Gateway"],
        correct: "C"
    },
    {
        question: "What is the full form of WAN?",
        options: ["Wide Area Network", "Wireless Area Network", "Web Access Network", "World Area Network"],
        correct: "A"
    },
    {
        question: "Which protocol is used for file transfer?",
        options: ["SMTP", "HTTP", "FTP", "SNMP"],
        correct: "C"
    },
    {
        question: "Which address is burned into the NIC?",
        options: ["IP", "MAC", "Port", "URL"],
        correct: "B"
    },
    {
        question: "What does NAT stand for?",
        options: ["Network Access Tool", "Network Address Translation", "Network Application Transfer", "Node Address Table"],
        correct: "B"
    },
    {
        question: "Which layer routes packets?",
        options: ["Data Link", "Transport", "Network", "Application"],
        correct: "C"
    },
    {
        question: "Which topology provides high fault tolerance?",
        options: ["Bus", "Ring", "Star", "Mesh"],
        correct: "D"
    },
    {
        question: "Which protocol is used for remote login?",
        options: ["HTTP", "FTP", "Telnet", "SNMP"],
        correct: "C"
    },
    {
        question: "What is the full form of MAC?",
        options: ["Media Access Control", "Machine Access Code", "Memory Access Control", "Message Access Channel"],
        correct: "A"
    },
    {
        question: "Which OSI layer establishes, manages, and terminates sessions?",
        options: ["Application", "Transport", "Session", "Presentation"],
        correct: "C"
    },
    {
        question: "Which protocol is used to receive emails?",
        options: ["SMTP", "FTP", "POP3", "SNMP"],
        correct: "C"
    },
    {
        question: "What is the default port number of HTTPS?",
        options: ["21", "25", "80", "443"],
        correct: "D"
    },
    {
        question: "Which device converts digital signals to analog?",
        options: ["Switch", "Router", "Modem", "Bridge"],
        correct: "C"
    },
    {
        question: "Which network covers a small geographical area?",
        options: ["WAN", "MAN", "LAN", "PAN"],
        correct: "C"
    },
    {
        question: "What does ICMP stand for?",
        options: ["Internet Control Message Protocol", "Internal Control Message Program", "Internet Communication Management Protocol", "Internal Communication Message Process"],
        correct: "A"
    },
    {
        question: "Which topology uses a single backbone cable?",
        options: ["Ring", "Star", "Bus", "Mesh"],
        correct: "C"
    },
    {
        question: "Which protocol is used to monitor network devices?",
        options: ["SMTP", "SNMP", "FTP", "HTTP"],
        correct: "B"
    },
    {
        question: "Which OSI layer is closest to the end user?",
        options: ["Transport", "Network", "Presentation", "Application"],
        correct: "D"
    },
    {
        question: "Which address is used at the Network Layer?",
        options: ["MAC", "IP", "Port", "URL"],
        correct: "B"
    },
    {
        question: "Which device connects networks using different protocols?",
        options: ["Router", "Switch", "Bridge", "Gateway"],
        correct: "D"
    },
    {
        question: "What is the default port number of FTP?",
        options: ["20", "21", "22", "25"],
        correct: "B"
    },
    {
        question: "Which layer provides end-to-end communication?",
        options: ["Network", "Transport", "Session", "Application"],
        correct: "B"
    },
    {
        question: "Which protocol is used for secure communication on the web?",
        options: ["HTTP", "FTP", "HTTPS", "Telnet"],
        correct: "C"
    },
    {
        question: "Which device divides a network into smaller collision domains?",
        options: ["Hub", "Switch", "Repeater", "Modem"],
        correct: "B"
    },
    {
        question: "What does ARP stand for?",
        options: ["Address Resolution Protocol", "Access Routing Protocol", "Automatic Routing Process", "Address Routing Program"],
        correct: "A"
    },
    {
        question: "Which OSI layer handles logical addressing?",
        options: ["Transport", "Data Link", "Network", "Session"],
        correct: "C"
    },
    {
        question: "Which cable offers highest bandwidth?",
        options: ["Twisted pair", "Coaxial", "Fiber optic", "Serial"],
        correct: "C"
    },
    {
        question: "Which protocol uses port number 25?",
        options: ["FTP", "SMTP", "POP3", "HTTP"],
        correct: "B"
    },
    {
        question: "Which type of IP address is not routable on the internet?",
        options: ["Public IP", "Static IP", "Private IP", "Dynamic IP"],
        correct: "C"
    },
    {
        question: "What is the purpose of a firewall?",
        options: ["Speed up network", "Monitor hardware", "Block unauthorized access", "Assign IP addresses"],
        correct: "C"
    },
    {
        question: "Which protocol is connectionless?",
        options: ["TCP", "FTP", "UDP", "HTTP"],
        correct: "C"
    },
    {
        question: "Which network topology connects every node to every other node?",
        options: ["Star", "Bus", "Ring", "Mesh"],
        correct: "D"
    }
];

// ===========================
// ROUTES
// ===========================

// Route 1: User Registration
app.post('/api/register', (req, res) => {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const checkQuery = "SELECT * FROM users WHERE email = ?";
    db.query(checkQuery, [email], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }
        
        if (results.length > 0) {
            return res.status(400).json({ error: "User already exists" });
        }
        
        // Insert new user
        const insertQuery = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
        db.query(insertQuery, [name, email, password], (err, result) => {
            if (err) {
                return res.status(500).json({ error: "Failed to create user" });
            }
            
            res.json({ 
                success: true, 
                message: "Registration successful",
                userId: result.insertId
            });
        });
    });
});

// Route 2: User Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    const query = "SELECT * FROM users WHERE email = ? AND password = ?";
    db.query(query, [email, password], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }
        
        if (results.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        
        const user = results[0];
        res.json({ 
            success: true, 
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    });
});

// Route 3: Generate Test Questions (DB-backed, non-repeating)
app.get('/api/questions', (req, res) => {
    const topic = req.query.topic || 'Maths';
    const count = parseInt(req.query.count) || 10;
    const userEmail = req.query.user_email || 'anonymous';

    const selectUnused = `
        SELECT id, question, option_a, option_b, option_c, option_d, correct_option
        FROM questions
        WHERE topic = ?
        AND id NOT IN (
            SELECT question_id FROM question_usage WHERE user_email = ? AND topic = ?
        )
        ORDER BY RAND()
        LIMIT ?
    `;

    function formatQuestions(rows) {
        return rows.map((row) => ({
            id: row.id,
            question: row.question,
            options: [row.option_a, row.option_b, row.option_c, row.option_d],
            correct_option: row.correct_option
        }));
    }

    function markUsed(rows, callback) {
        if (rows.length === 0) {
            callback();
            return;
        }
        const values = rows.map(row => [userEmail, topic, row.id]);
        const insertUsage = `INSERT IGNORE INTO question_usage (user_email, topic, question_id) VALUES ?`;
        db.query(insertUsage, [values], callback);
    }

    function sendQuestions(rows) {
        markUsed(rows, (markErr) => {
            if (markErr) {
                return res.status(500).json({ error: 'Failed to record question usage' });
            }
            res.json({ questions: formatQuestions(rows) });
        });
    }

    db.query(selectUnused, [topic, userEmail, topic, count], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (rows.length < count) {
            const resetQuery = 'DELETE FROM question_usage WHERE user_email = ? AND topic = ?';
            db.query(resetQuery, [userEmail, topic], (resetErr) => {
                if (resetErr) {
                    return res.status(500).json({ error: 'Failed to reset question history' });
                }
                db.query(selectUnused, [topic, userEmail, topic, count], (err2, rows2) => {
                    if (err2) {
                        return res.status(500).json({ error: 'Database error' });
                    }
                    sendQuestions(rows2);
                });
            });
            return;
        }

        sendQuestions(rows);
    });
});


// Route 4: Submit Test Results
app.post('/api/submit-test', (req, res) => {
    const { user_email, user_name, score, total_questions, topic, time_spent, answers } = req.body;
    
    const query = `INSERT INTO test_results 
                   (user_email, user_name, score, total_questions, topic, time_spent, percentage) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    const percentage = Math.round((score / total_questions) * 100);
    
    db.query(query, [user_email, user_name, score, total_questions, topic, time_spent, percentage], 
        (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: "Failed to save results" });
            }
            
            console.log(`âœ… Test result saved: ${user_email} scored ${score}/${total_questions}`);
            
            res.json({ 
                success: true, 
                message: "Results saved successfully",
                resultId: result.insertId,
                score,
                total: total_questions,
                percentage
            });
        });
});

// Route 5: Get User's Previous Test Results
app.get('/api/user-results/:email', (req, res) => {
    const email = req.params.email;
    
    const query = `SELECT * FROM test_results 
                   WHERE user_email = ? 
                   ORDER BY created_at DESC 
                   LIMIT 10`;
    
    db.query(query, [email], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }
        
        res.json({ results });
    });
});

// Route 6: Get All Test Results (Admin)
app.get('/api/admin/results', (req, res) => {
    const query = `SELECT * FROM test_results 
                   ORDER BY created_at DESC`;
    
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }
        
        res.json({ results });
    });
});
// Route 4: Submit Test Results
app.post('/api/submit-test', (req, res) => {
    const { user_email, user_name, score, total_questions, topic, time_spent, answers } = req.body;
    
    const query = `INSERT INTO test_results 
                   (user_email, user_name, score, total_questions, topic, time_spent, percentage) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    const percentage = Math.round((score / total_questions) * 100);
    
    db.query(query, [user_email, user_name, score, total_questions, topic, time_spent, percentage], 
        async (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: "Failed to save results" });
            }
            
            console.log(`âœ… Test result saved: ${user_email} scored ${score}/${total_questions}`);
            
            // Send email with test results
            try {
                const emailResult = await sendTestResultEmail({
                    name: user_name,
                    email: user_email,
                    score: score,
                    totalQuestions: total_questions,
                    percentage: percentage,
                    topic: topic,
                    timeTaken: time_spent,
                    submittedAt: new Date().toISOString()
                });
                
                if (emailResult.success) {
                    console.log(`ðŸ“§ Result email sent to: ${user_email}`);
                } else {
                    console.log(`âš ï¸  Email sending failed: ${emailResult.error}`);
                }
            } catch (emailError) {
                console.error('Email error (non-blocking):', emailError.message);
                // Don't fail the request if email fails
            }
            
            res.json({ 
                success: true, 
                message: "Results saved successfully and email sent!",
                resultId: result.insertId,
                score,
                total: total_questions,
                percentage,
                emailSent: true
            });
        });
});



// Route 7: Send latest test report to email
app.post('/api/send-report', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || smtpUser;

    if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
        return res.status(500).json({
            error: 'Email service not configured',
            detail: 'Missing SMTP configuration in .env (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM).'
        });
    }

    try {
        const [rows] = await db.promise().query(
            `SELECT score, total_questions, percentage, topic, time_spent, created_at
             FROM test_results
             WHERE user_email = ?
             ORDER BY created_at DESC
             LIMIT 1`,
            [email]
        );

        if (!rows || rows.length === 0) {
            return res.status(404).json({
                error: 'No test results found for this email',
                detail: 'Complete a test first, then try sending the report again.'
            });
        }

        const latest = rows[0];
        const percentage = typeof latest.percentage === 'number'
            ? Math.round(latest.percentage)
            : Math.round((latest.score / latest.total_questions) * 100);
        const subject = `AptiLab Test Report - ${latest.topic || 'General'}`;

        const html = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
                <h2 style="margin: 0 0 12px;">AptiLab Test Report</h2>
                <p style="margin: 0 0 12px;">Here are your latest test results:</p>
                <table style="border-collapse: collapse; width: 100%; max-width: 520px;">
                    <tr>
                        <td style="padding: 8px; border: 1px solid #e2e8f0;">Topic</td>
                        <td style="padding: 8px; border: 1px solid #e2e8f0;">${latest.topic || 'General'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #e2e8f0;">Score</td>
                        <td style="padding: 8px; border: 1px solid #e2e8f0;">${latest.score}/${latest.total_questions}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #e2e8f0;">Percentage</td>
                        <td style="padding: 8px; border: 1px solid #e2e8f0;">${percentage}%</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #e2e8f0;">Time Spent</td>
                        <td style="padding: 8px; border: 1px solid #e2e8f0;">${latest.time_spent || 0} seconds</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #e2e8f0;">Date</td>
                        <td style="padding: 8px; border: 1px solid #e2e8f0;">${new Date(latest.created_at).toLocaleString()}</td>
                    </tr>
                </table>
                <p style="margin-top: 16px;">Keep practicing to improve your score!</p>
            </div>
        `;

        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
                user: smtpUser,
                pass: smtpPass
            }
        });

        await transporter.sendMail({
            from: smtpFrom,
            to: email,
            subject,
            html
        });

        res.json({ success: true, message: 'Report email sent.' });
    } catch (error) {
        console.error('Failed to send report email:', error);
        res.status(500).json({
            error: 'Failed to send report email',
            detail: error && error.message ? error.message : 'Unknown error'
        });
    }
});

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'running',
        database: 'connected',
        gemini: process.env.GEMINI_API_KEY ? 'configured' : 'missing'
    });
});

// Gemini API health check route (validates real API call)
app.get('/api/ai-health', async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({
            status: 'running',
            gemini: 'missing',
            error: 'GEMINI_API_KEY is not configured'
        });
    }

    const candidateModels = [
        process.env.GEMINI_MODEL,
        DEFAULT_GEMINI_MODEL,
        'gemini-2.0-flash',
        'gemini-1.5-flash'
    ].filter(Boolean);

    const tried = [];

    for (const modelName of candidateModels) {
        try {
            const timeoutMs = 7000;
            const activeModel = genAI.getGenerativeModel({ model: modelName });
            const aiCall = activeModel.generateContent('Reply only with: OK');
            const result = await Promise.race([
                aiCall,
                new Promise((_, reject) => setTimeout(() => reject(new Error('AI health check timed out')), timeoutMs))
            ]);

            const reply = result && result.response && typeof result.response.text === 'function'
                ? result.response.text().trim()
                : '';

            return res.json({
                status: 'running',
                gemini: 'ok',
                model: modelName,
                reply: reply || 'OK'
            });
        } catch (error) {
            tried.push({
                model: modelName,
                error: error && error.message ? error.message : 'Unknown Gemini API error'
            });
        }
    }

    return res.status(502).json({
        status: 'running',
        gemini: 'error',
        error: 'All candidate Gemini models failed',
        tried
    });
});

// Serve login page at root
app.get('/', (req, res) => {
    res.sendFile(path.join(frontendDir, 'login.html'));
});

// Serve primary frontend pages at root-level paths (e.g., /dashboard.html)
app.get('/:page(login|dashboard|test|result).html', (req, res) => {
    res.sendFile(path.join(frontendDir, `${req.params.page}.html`));
});

// ===========================
// START SERVER
// ===========================
const PORT = process.env.PORT || 3307;

app.listen(PORT, () => {
    console.log(`
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘  â•‘ðŸš€ AptiLab Server Running!          â•‘
â•‘                                        â•‘
â•‘   â•‘ðŸ“ Port: ${PORT}                    â•‘
â•‘   â•‘ðŸŒ URL: http://localhost:${PORT}    â•‘
â•‘   â•‘ðŸ“Š Database: MySQL                  â•‘
â•‘                                        â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    `);
});














