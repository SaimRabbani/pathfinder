require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');

const connectDB = require('../server/config/db');
const Career = require('../server/models/Career');
const Course = require('../server/models/Course');
const Question = require('../server/models/Question');

const MIN_COURSES_PER_CAREER = 3;

const careersData = [
  {
    title: 'Software Engineer',
    description:
      'Designs, develops, tests, and maintains software applications and systems. Solves complex logical and technical problems.',
    riasecWeights: {
      realistic: 3,
      investigative: 5,
      artistic: 2,
      social: 1,
      enterprising: 2,
      conventional: 4
    },
    requiredAptitude: { logical: 4, numerical: 3, verbal: 2 },
    avgSalary: 115000,
    growthOutlook: 'Excellent'
  },
  {
    title: 'Data Analyst',
    description:
      'Inspects, cleans, transforms, and models data to discover useful information, suggest conclusions, and support decision-making.',
    riasecWeights: {
      realistic: 1,
      investigative: 5,
      artistic: 1,
      social: 2,
      enterprising: 2,
      conventional: 5
    },
    requiredAptitude: { logical: 4, numerical: 5, verbal: 2 },
    avgSalary: 85000,
    growthOutlook: 'Very Strong'
  },
  {
    title: 'Graphic Designer',
    description:
      'Creates visual concepts, using computer software or by hand, to communicate ideas that inspire, inform, and captivate consumers.',
    riasecWeights: {
      realistic: 1,
      investigative: 2,
      artistic: 5,
      social: 3,
      enterprising: 3,
      conventional: 1
    },
    requiredAptitude: { logical: 3, numerical: 1, verbal: 3 },
    avgSalary: 55000,
    growthOutlook: 'Stable'
  },
  {
    title: 'Sales Manager',
    description:
      'Leads sales teams, sets sales goals, analyzes data, and develops training programs for organization sales representatives.',
    riasecWeights: {
      realistic: 1,
      investigative: 1,
      artistic: 2,
      social: 4,
      enterprising: 5,
      conventional: 2
    },
    requiredAptitude: { logical: 3, numerical: 3, verbal: 5 },
    avgSalary: 98000,
    growthOutlook: 'Strong'
  },
  {
    title: 'Human Resources Specialist',
    description:
      'Recruits, screens, interviews, and places workers. Handles employee relations, payroll, benefits, and training.',
    riasecWeights: {
      realistic: 1,
      investigative: 2,
      artistic: 2,
      social: 5,
      enterprising: 4,
      conventional: 3
    },
    requiredAptitude: { logical: 3, numerical: 2, verbal: 5 },
    avgSalary: 68000,
    growthOutlook: 'Stable'
  },
  {
    title: 'Financial Accountant',
    description:
      'Prepares and examines financial records, ensuring they are accurate and that taxes are paid properly and on time.',
    riasecWeights: {
      realistic: 1,
      investigative: 3,
      artistic: 1,
      social: 2,
      enterprising: 3,
      conventional: 5
    },
    requiredAptitude: { logical: 3, numerical: 5, verbal: 3 },
    avgSalary: 75000,
    growthOutlook: 'Good'
  },
  {
    title: 'Mechanical Engineer',
    description:
      'Designs, develops, builds, and tests mechanical and thermal sensors and devices, including tools, engines, and machines.',
    riasecWeights: {
      realistic: 5,
      investigative: 4,
      artistic: 2,
      social: 1,
      enterprising: 2,
      conventional: 3
    },
    requiredAptitude: { logical: 4, numerical: 4, verbal: 2 },
    avgSalary: 92000,
    growthOutlook: 'Good'
  },
  {
    title: 'Digital Content Writer',
    description:
      'Produces engaging articles, blog posts, marketing copy, and scripts for online platforms to inform and entertain audiences.',
    riasecWeights: {
      realistic: 1,
      investigative: 3,
      artistic: 5,
      social: 3,
      enterprising: 2,
      conventional: 2
    },
    requiredAptitude: { logical: 2, numerical: 1, verbal: 5 },
    avgSalary: 60000,
    growthOutlook: 'Very Strong'
  },
  {
    title: 'Cybersecurity Analyst',
    description:
      'Protects systems, networks, and data by monitoring threats, assessing vulnerabilities, and implementing security controls.',
    riasecWeights: {
      realistic: 3,
      investigative: 5,
      artistic: 1,
      social: 1,
      enterprising: 2,
      conventional: 4
    },
    requiredAptitude: { logical: 5, numerical: 3, verbal: 2 },
    avgSalary: 102000,
    growthOutlook: 'Excellent'
  },
  {
    title: 'UX Designer',
    description:
      'Researches user needs and designs intuitive digital experiences, wireframes, prototypes, and usability improvements.',
    riasecWeights: {
      realistic: 1,
      investigative: 3,
      artistic: 5,
      social: 3,
      enterprising: 2,
      conventional: 2
    },
    requiredAptitude: { logical: 3, numerical: 1, verbal: 4 },
    avgSalary: 88000,
    growthOutlook: 'Very Strong'
  },
  {
    title: 'Civil Engineer',
    description:
      'Plans, designs, and oversees construction and maintenance of infrastructure such as roads, bridges, buildings, and water systems.',
    riasecWeights: {
      realistic: 4,
      investigative: 4,
      artistic: 2,
      social: 2,
      enterprising: 2,
      conventional: 3
    },
    requiredAptitude: { logical: 4, numerical: 4, verbal: 2 },
    avgSalary: 90000,
    growthOutlook: 'Strong'
  },
  {
    title: 'Marketing Strategist',
    description:
      'Builds brand messaging, campaign plans, and audience strategies to help organizations reach and convert customers.',
    riasecWeights: {
      realistic: 1,
      investigative: 2,
      artistic: 4,
      social: 3,
      enterprising: 5,
      conventional: 2
    },
    requiredAptitude: { logical: 3, numerical: 2, verbal: 5 },
    avgSalary: 82000,
    growthOutlook: 'Very Strong'
  },
  {
    title: 'Psychologist',
    description:
      'Studies behavior and mental processes, supports clients through assessment and counseling, and applies research-based interventions.',
    riasecWeights: {
      realistic: 1,
      investigative: 4,
      artistic: 2,
      social: 5,
      enterprising: 2,
      conventional: 2
    },
    requiredAptitude: { logical: 3, numerical: 1, verbal: 5 },
    avgSalary: 81000,
    growthOutlook: 'Strong'
  },
  {
    title: 'Biotechnology Research Associate',
    description:
      'Conducts laboratory experiments, analyzes biological data, and supports research for medicine, agriculture, and life sciences.',
    riasecWeights: {
      realistic: 2,
      investigative: 5,
      artistic: 1,
      social: 2,
      enterprising: 1,
      conventional: 4
    },
    requiredAptitude: { logical: 4, numerical: 3, verbal: 3 },
    avgSalary: 78000,
    growthOutlook: 'Very Strong'
  },
  {
    title: 'Operations Manager',
    description:
      'Coordinates workflows, people, budgets, and process improvements to keep business operations efficient and scalable.',
    riasecWeights: {
      realistic: 2,
      investigative: 3,
      artistic: 1,
      social: 3,
      enterprising: 4,
      conventional: 5
    },
    requiredAptitude: { logical: 4, numerical: 3, verbal: 4 },
    avgSalary: 94000,
    growthOutlook: 'Strong'
  }
];

const coursesData = [
  {
    title: 'Introduction to Computer Science (CS50)',
    provider: 'Harvard University via edX',
    link: 'https://www.edx.org/course/introduction-computer-science-harvardx-cs50x',
    duration: '12 weeks',
    level: 'Beginner',
    careerTitleMatch: 'Software Engineer'
  },
  {
    title: 'Web Design for Everybody: Basics of Web Development & Coding',
    provider: 'University of Michigan via Coursera',
    link: 'https://www.coursera.org/specializations/web-design',
    duration: '4 weeks',
    level: 'Beginner',
    careerTitleMatch: 'Software Engineer'
  },
  {
    title: 'Java Programming and Software Engineering Fundamentals',
    provider: 'Duke University via Coursera',
    link: 'https://www.coursera.org/specializations/java-programming',
    duration: '5 months',
    level: 'Intermediate',
    careerTitleMatch: 'Software Engineer'
  },
  {
    title: 'Google Data Analytics Professional Certificate',
    provider: 'Google via Coursera',
    link: 'https://www.coursera.org/professional-certificates/google-data-analytics',
    duration: '6 months',
    level: 'Beginner',
    careerTitleMatch: 'Data Analyst'
  },
  {
    title: 'SQL for Data Science',
    provider: 'UC Davis via Coursera',
    link: 'https://www.coursera.org/learn/sql-for-data-science',
    duration: '4 weeks',
    level: 'Beginner',
    careerTitleMatch: 'Data Analyst'
  },
  {
    title: 'IBM Data Analyst Professional Certificate',
    provider: 'IBM via Coursera',
    link: 'https://www.coursera.org/professional-certificates/ibm-data-analyst',
    duration: '5 months',
    level: 'Beginner',
    careerTitleMatch: 'Data Analyst'
  },
  {
    title: 'Graphic Design Specialization',
    provider: 'CalArts via Coursera',
    link: 'https://www.coursera.org/specializations/graphic-design',
    duration: '6 months',
    level: 'Beginner',
    careerTitleMatch: 'Graphic Designer'
  },
  {
    title: 'Adobe Illustrator CC - Essentials Training',
    provider: 'Udemy',
    link: 'https://www.udemy.com/course/adobe-illustrator-course/',
    duration: '9 hours',
    level: 'Beginner',
    careerTitleMatch: 'Graphic Designer'
  },
  {
    title: 'UI/UX Design Specialization',
    provider: 'California Institute of the Arts via Coursera',
    link: 'https://www.coursera.org/specializations/ui-ux-design',
    duration: '6 months',
    level: 'Beginner',
    careerTitleMatch: 'Graphic Designer'
  },
  {
    title: 'Sales Management Professional Certificate',
    provider: 'Salesforce via Coursera',
    link: 'https://www.coursera.org/professional-certificates/salesforce-sales-operations',
    duration: '4 months',
    level: 'Intermediate',
    careerTitleMatch: 'Sales Manager'
  },
  {
    title: 'Successful Negotiation: Essential Strategies and Skills',
    provider: 'University of Michigan via Coursera',
    link: 'https://www.coursera.org/learn/negotiation-skills',
    duration: '7 weeks',
    level: 'Intermediate',
    careerTitleMatch: 'Sales Manager'
  },
  {
    title: 'The Art of Sales: Mastering the Selling Process',
    provider: 'Northwestern University via Coursera',
    link: 'https://www.coursera.org/learn/the-art-of-sales-mastering-the-selling-process',
    duration: '5 weeks',
    level: 'Beginner',
    careerTitleMatch: 'Sales Manager'
  },
  {
    title: 'Human Resources Foundations',
    provider: 'LinkedIn Learning',
    link: 'https://www.linkedin.com/learning/human-resources-foundations',
    duration: '1 hour 45 minutes',
    level: 'Beginner',
    careerTitleMatch: 'Human Resources Specialist'
  },
  {
    title: 'Recruiting, Hiring, and Onboarding Employees',
    provider: 'University of Minnesota via Coursera',
    link: 'https://www.coursera.org/learn/recruiting-hiring-onboarding-employees',
    duration: '4 weeks',
    level: 'Beginner',
    careerTitleMatch: 'Human Resources Specialist'
  },
  {
    title: 'People Analytics',
    provider: 'University of Pennsylvania via Coursera',
    link: 'https://www.coursera.org/learn/wharton-people-analytics',
    duration: '6 weeks',
    level: 'Intermediate',
    careerTitleMatch: 'Human Resources Specialist'
  },
  {
    title: 'Financial Accounting Fundamentals',
    provider: 'University of Virginia via Coursera',
    link: 'https://www.coursera.org/learn/financial-accounting-fundamentals',
    duration: '4 weeks',
    level: 'Beginner',
    careerTitleMatch: 'Financial Accountant'
  },
  {
    title: 'Excel Skills for Business: Intermediate I',
    provider: 'Macquarie University via Coursera',
    link: 'https://www.coursera.org/learn/excel-skills-business-intermediate-i',
    duration: '6 weeks',
    level: 'Intermediate',
    careerTitleMatch: 'Financial Accountant'
  },
  {
    title: 'Introduction to Finance and Accounting',
    provider: 'University of Pennsylvania via Coursera',
    link: 'https://www.coursera.org/learn/wharton-accounting',
    duration: '4 weeks',
    level: 'Beginner',
    careerTitleMatch: 'Financial Accountant'
  },
  {
    title: 'Introduction to Thermodynamics',
    provider: 'University of Michigan via Coursera',
    link: 'https://www.coursera.org/learn/thermodynamics-intro',
    duration: '8 weeks',
    level: 'Beginner',
    careerTitleMatch: 'Mechanical Engineer'
  },
  {
    title: 'Autodesk Fusion 360 Integrated CAD/CAM/CAE Specialization',
    provider: 'Autodesk via Coursera',
    link: 'https://www.coursera.org/specializations/autodesk-fusion-360-cad-cam-cae',
    duration: '4 months',
    level: 'Intermediate',
    careerTitleMatch: 'Mechanical Engineer'
  },
  {
    title: 'Engineering Mechanics: Statics and Dynamics',
    provider: 'Georgia Tech via Coursera',
    link: 'https://www.coursera.org/learn/engineering-mechanics-statics-dynamics',
    duration: '6 weeks',
    level: 'Intermediate',
    careerTitleMatch: 'Mechanical Engineer'
  },
  {
    title: 'Creative Writing Specialization',
    provider: 'Wesleyan University via Coursera',
    link: 'https://www.coursera.org/specializations/creative-writing',
    duration: '6 months',
    level: 'Beginner',
    careerTitleMatch: 'Digital Content Writer'
  },
  {
    title: 'Content Strategy for Professionals',
    provider: 'Northwestern University via Coursera',
    link: 'https://www.coursera.org/specializations/content-strategy',
    duration: '4 months',
    level: 'Intermediate',
    careerTitleMatch: 'Digital Content Writer'
  },
  {
    title: 'The Strategy of Content Marketing',
    provider: 'University of California, Davis via Coursera',
    link: 'https://www.coursera.org/learn/content-marketing',
    duration: '5 weeks',
    level: 'Beginner',
    careerTitleMatch: 'Digital Content Writer'
  },
  {
    title: 'Google Cybersecurity Professional Certificate',
    provider: 'Google via Coursera',
    link: 'https://www.coursera.org/professional-certificates/google-cybersecurity',
    duration: '6 months',
    level: 'Beginner',
    careerTitleMatch: 'Cybersecurity Analyst'
  },
  {
    title: 'Foundations of Cybersecurity',
    provider: 'Google via Coursera',
    link: 'https://www.coursera.org/learn/foundations-of-cybersecurity',
    duration: '3 weeks',
    level: 'Beginner',
    careerTitleMatch: 'Cybersecurity Analyst'
  },
  {
    title: 'IBM Cybersecurity Analyst Professional Certificate',
    provider: 'IBM via Coursera',
    link: 'https://www.coursera.org/professional-certificates/ibm-cybersecurity-analyst',
    duration: '8 months',
    level: 'Beginner',
    careerTitleMatch: 'Cybersecurity Analyst'
  },
  {
    title: 'Google UX Design Professional Certificate',
    provider: 'Google via Coursera',
    link: 'https://www.coursera.org/professional-certificates/google-ux-design',
    duration: '6 months',
    level: 'Beginner',
    careerTitleMatch: 'UX Designer'
  },
  {
    title: 'User Experience Research and Design Specialization',
    provider: 'University of Michigan via Coursera',
    link: 'https://www.coursera.org/specializations/michiganux',
    duration: '4 months',
    level: 'Intermediate',
    careerTitleMatch: 'UX Designer'
  },
  {
    title: 'Interaction Design Specialization',
    provider: 'University of California San Diego via Coursera',
    link: 'https://www.coursera.org/specializations/interaction-design',
    duration: '5 months',
    level: 'Intermediate',
    careerTitleMatch: 'UX Designer'
  },
  {
    title: 'Construction Project Management',
    provider: 'Columbia University via Coursera',
    link: 'https://www.coursera.org/learn/construction-project-management',
    duration: '5 weeks',
    level: 'Intermediate',
    careerTitleMatch: 'Civil Engineer'
  },
  {
    title: 'Construction Cost Estimating and Cost Control',
    provider: 'Columbia University via Coursera',
    link: 'https://www.coursera.org/learn/construction-cost-estimating',
    duration: '5 weeks',
    level: 'Intermediate',
    careerTitleMatch: 'Civil Engineer'
  },
  {
    title: 'Engineering Project Management: Initiating and Planning',
    provider: 'Rice University via Coursera',
    link: 'https://www.coursera.org/learn/engineering-project-management-initiating-planning',
    duration: '4 weeks',
    level: 'Intermediate',
    careerTitleMatch: 'Civil Engineer'
  },
  {
    title: 'Meta Social Media Marketing Professional Certificate',
    provider: 'Meta via Coursera',
    link: 'https://www.coursera.org/professional-certificates/facebook-social-media-marketing',
    duration: '5 months',
    level: 'Beginner',
    careerTitleMatch: 'Marketing Strategist'
  },
  {
    title: 'Marketing Strategy',
    provider: 'University of Virginia via Coursera',
    link: 'https://www.coursera.org/learn/uva-darden-market-strategy',
    duration: '5 weeks',
    level: 'Intermediate',
    careerTitleMatch: 'Marketing Strategist'
  },
  {
    title: 'Digital Marketing Specialization',
    provider: 'University of Illinois via Coursera',
    link: 'https://www.coursera.org/specializations/digital-marketing',
    duration: '8 months',
    level: 'Beginner',
    careerTitleMatch: 'Marketing Strategist'
  },
  {
    title: 'Introduction to Psychology',
    provider: 'Yale University via Coursera',
    link: 'https://www.coursera.org/learn/introduction-psychology',
    duration: '6 weeks',
    level: 'Beginner',
    careerTitleMatch: 'Psychologist'
  },
  {
    title: 'Positive Psychiatry and Mental Health',
    provider: 'University of Sydney via Coursera',
    link: 'https://www.coursera.org/learn/positive-psychiatry',
    duration: '6 weeks',
    level: 'Beginner',
    careerTitleMatch: 'Psychologist'
  },
  {
    title: 'Introduction to Abnormal Psychology',
    provider: 'Wesleyan University via Coursera',
    link: 'https://www.coursera.org/learn/abnormal-psychology',
    duration: '6 weeks',
    level: 'Intermediate',
    careerTitleMatch: 'Psychologist'
  },
  {
    title: 'Industrial Biotechnology',
    provider: 'University of Manchester via Coursera',
    link: 'https://www.coursera.org/learn/industrial-biotech',
    duration: '4 weeks',
    level: 'Intermediate',
    careerTitleMatch: 'Biotechnology Research Associate'
  },
  {
    title: 'Systems Biology and Biotechnology',
    provider: 'Icahn School of Medicine at Mount Sinai via Coursera',
    link: 'https://www.coursera.org/specializations/systems-biology',
    duration: '5 months',
    level: 'Intermediate',
    careerTitleMatch: 'Biotechnology Research Associate'
  },
  {
    title: 'Biology Meets Programming: Bioinformatics for Beginners',
    provider: 'University of California San Diego via Coursera',
    link: 'https://www.coursera.org/learn/bioinformatics',
    duration: '7 weeks',
    level: 'Intermediate',
    careerTitleMatch: 'Biotechnology Research Associate'
  },
  {
    title: 'Operations Management',
    provider: 'University of Illinois via Coursera',
    link: 'https://www.coursera.org/learn/operations-management',
    duration: '4 weeks',
    level: 'Intermediate',
    careerTitleMatch: 'Operations Manager'
  },
  {
    title: 'Supply Chain Operations',
    provider: 'Rutgers University via Coursera',
    link: 'https://www.coursera.org/learn/supply-chain-operations',
    duration: '4 weeks',
    level: 'Intermediate',
    careerTitleMatch: 'Operations Manager'
  },
  {
    title: 'Six Sigma Yellow Belt Specialization',
    provider: 'University System of Georgia via Coursera',
    link: 'https://www.coursera.org/specializations/six-sigma-fundamentals',
    duration: '2 months',
    level: 'Beginner',
    careerTitleMatch: 'Operations Manager'
  }
];

const likertOptions = [
  'Strongly Disagree',
  'Disagree',
  'Neutral',
  'Agree',
  'Strongly Agree'
];

const questionsData = [
  {
    text: 'I enjoy working with hands-on tools, machinery, or equipment.',
    category: 'interest',
    options: likertOptions,
    riasecWeights: { realistic: 5 }
  },
  {
    text: 'I like building, repairing, or assembling physical objects.',
    category: 'interest',
    options: likertOptions,
    riasecWeights: { realistic: 5 }
  },
  {
    text: 'I enjoy outdoor or field-based activities more than desk-only work.',
    category: 'interest',
    options: likertOptions,
    riasecWeights: { realistic: 4, investigative: 1 }
  },
  {
    text: 'I love solving complex math problems or analyzing scientific data.',
    category: 'interest',
    options: likertOptions,
    riasecWeights: { investigative: 5 }
  },
  {
    text: 'I enjoy researching new topics and understanding how things work.',
    category: 'interest',
    options: likertOptions,
    riasecWeights: { investigative: 5 }
  },
  {
    text: 'I like testing ideas through logic, experiments, or evidence.',
    category: 'interest',
    options: likertOptions,
    riasecWeights: { investigative: 4, conventional: 1 }
  },
  {
    text: 'I express myself through creative writing, drawing, painting, or design.',
    category: 'interest',
    options: likertOptions,
    riasecWeights: { artistic: 5 }
  },
  {
    text: 'I enjoy coming up with unique, imaginative ideas for projects.',
    category: 'interest',
    options: likertOptions,
    riasecWeights: { artistic: 5 }
  },
  {
    text: 'I prefer open-ended projects where creativity matters more than rigid rules.',
    category: 'interest',
    options: likertOptions,
    riasecWeights: { artistic: 4, enterprising: 1 }
  },
  {
    text: 'I find fulfillment in teaching others, tutoring, or sharing knowledge.',
    category: 'interest',
    options: likertOptions,
    riasecWeights: { social: 5 }
  },
  {
    text: 'I like counseling, helping, or volunteering to support people in need.',
    category: 'interest',
    options: likertOptions,
    riasecWeights: { social: 5 }
  },
  {
    text: 'I am energized by teamwork, collaboration, and supporting group goals.',
    category: 'interest',
    options: likertOptions,
    riasecWeights: { social: 4, enterprising: 1 }
  },
  {
    text: 'I enjoy leading a team, organizing a business project, or persuading others.',
    category: 'interest',
    options: likertOptions,
    riasecWeights: { enterprising: 5 }
  },
  {
    text: 'I like marketing products, negotiating deals, or managing budgets.',
    category: 'interest',
    options: likertOptions,
    riasecWeights: { enterprising: 5 }
  },
  {
    text: 'I feel confident making decisions when outcomes are uncertain.',
    category: 'interest',
    options: likertOptions,
    riasecWeights: { enterprising: 4, investigative: 1 }
  },
  {
    text: 'I prefer work that has clear, structured guidelines and routine tasks.',
    category: 'interest',
    options: likertOptions,
    riasecWeights: { conventional: 5 }
  },
  {
    text: 'I enjoy organizing data, managing spreadsheets, and maintaining records.',
    category: 'interest',
    options: likertOptions,
    riasecWeights: { conventional: 5 }
  },
  {
    text: 'I like making systems more efficient by following checklists and processes.',
    category: 'interest',
    options: likertOptions,
    riasecWeights: { conventional: 4, realistic: 1 }
  },
  {
    text: 'If all Bloops are Razzles and all Razzles are Lizzies, are all Bloops definitely Lizzies?',
    category: 'aptitude',
    options: ['Yes', 'No', 'Cannot be determined'],
    correctOption: 'Yes',
    aptitudeType: 'logical'
  },
  {
    text: 'Which number comes next in the sequence? 2, 6, 12, 20, 30, ___',
    category: 'aptitude',
    options: ['38', '40', '42', '45'],
    correctOption: '42',
    aptitudeType: 'logical'
  },
  {
    text: 'A shopkeeper sells an item for $120, making a 20% profit on the cost price. What was the cost price of the item?',
    category: 'aptitude',
    options: ['$96', '$100', '$105', '$110'],
    correctOption: '$100',
    aptitudeType: 'numerical'
  },
  {
    text: 'If 15 workers can build a wall in 8 hours, how many hours will it take 10 workers to build the same wall at the same pace?',
    category: 'aptitude',
    options: ['6 hours', '12 hours', '10 hours', '15 hours'],
    correctOption: '12 hours',
    aptitudeType: 'numerical'
  },
  {
    text: "Choose the word that is most opposite in meaning to 'EPHEMERAL'.",
    category: 'aptitude',
    options: ['Transient', 'Eternal', 'Weak', 'Artistic'],
    correctOption: 'Eternal',
    aptitudeType: 'verbal'
  },
  {
    text: 'Complete the analogy: INK is to PEN as FUEL is to ___',
    category: 'aptitude',
    options: ['Engine', 'Car', 'Coal', 'Smoke'],
    correctOption: 'Car',
    aptitudeType: 'verbal'
  },
  {
    text: 'I am comfortable presenting my ideas in front of a large group of people.',
    category: 'personality',
    options: likertOptions
  },
  {
    text: 'I prefer working independently rather than in collaborative team environments.',
    category: 'personality',
    options: likertOptions
  },
  {
    text: 'I handle unexpected changes to plans or schedules easily and remain calm.',
    category: 'personality',
    options: likertOptions
  }
];

async function seedDatabase(options = {}) {
  const { connect = true, disconnect = true, clearExisting = true } = options;

  if (connect) {
    await connectDB();
  }

  try {
    if (clearExisting) {
      await Career.deleteMany({});
      await Course.deleteMany({});
      await Question.deleteMany({});
    }

    const createdCareers = await Career.create(careersData);
    const careerMap = new Map(createdCareers.map((career) => [career.title, career._id]));
    const courseCountByCareer = new Map(createdCareers.map((career) => [career.title, 0]));

    coursesData.forEach((course) => {
      if (!careerMap.has(course.careerTitleMatch)) {
        throw new Error(`Course \"${course.title}\" references an unknown career: ${course.careerTitleMatch}`);
      }

      courseCountByCareer.set(
        course.careerTitleMatch,
        courseCountByCareer.get(course.careerTitleMatch) + 1
      );
    });

    const underlinkedCareers = [...courseCountByCareer.entries()]
      .filter(([, count]) => count < MIN_COURSES_PER_CAREER)
      .map(([title, count]) => `${title} (${count})`);

    if (underlinkedCareers.length > 0) {
      throw new Error(
        `Every career needs at least ${MIN_COURSES_PER_CAREER} courses. Missing: ${underlinkedCareers.join(', ')}`
      );
    }

    const finalCoursesData = coursesData.map((course) => ({
      title: course.title,
      provider: course.provider,
      link: course.link,
      duration: course.duration,
      level: course.level,
      relatedCareers: careerMap.get(course.careerTitleMatch)
        ? [careerMap.get(course.careerTitleMatch)]
        : []
    }));

    const createdCourses = await Course.create(finalCoursesData);
    const createdQuestions = await Question.create(questionsData);

    return {
      careers: createdCareers,
      courses: createdCourses,
      questions: createdQuestions
    };
  } finally {
    if (disconnect) {
      await mongoose.connection.close();
    }
  }
}

async function runSeedScript() {
  try {
    const seeded = await seedDatabase();
    console.log(`Successfully seeded ${seeded.careers.length} careers.`);
    console.log(`Successfully seeded ${seeded.courses.length} courses.`);
    console.log(`Successfully seeded ${seeded.questions.length} questions.`);
    console.log('Database seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Database seeding failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runSeedScript();
}

module.exports = {
  careersData,
  coursesData,
  likertOptions,
  questionsData,
  seedDatabase
};
