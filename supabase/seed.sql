-- Insert seed data for job roles

-- Bike Delivery Rider Role
INSERT INTO job_roles (
    slug,
    title,
    description,
    config,
    is_active
) VALUES (
    'bike-delivery-rider',
    'Bike Delivery Rider',
    'Fast-paced delivery role requiring excellent time management, physical fitness, and customer service skills. Responsible for timely and safe delivery of food and packages across urban areas.',
    '{
        "language": "en",
        "intro": "Welcome to your AI interview for the Bike Delivery Rider position! I''m your AI interviewer, and I''ll be asking you questions about your experience, skills, and suitability for this role. The interview will take approximately 15-20 minutes. Please speak clearly and provide specific examples when possible. Let''s begin!",
        "openingQuestions": [
            "Can you tell me a bit about yourself and why you''re interested in becoming a bike delivery rider?",
            "Do you have any previous experience with delivery services or customer-facing roles?",
            "How comfortable are you with riding a bike in urban traffic conditions?"
        ],
        "questionBank": [
            {
                "category": "Experience & Background",
                "questions": [
                    "Describe your previous work experience, particularly any roles involving transportation or customer service.",
                    "Have you worked in fast-paced environments before? How did you handle the pressure?",
                    "What experience do you have with mobile apps and GPS navigation?",
                    "Tell me about a time when you had to manage multiple tasks simultaneously."
                ]
            },
            {
                "category": "Physical & Safety",
                "questions": [
                    "How would you ensure your safety while riding in busy traffic?",
                    "Describe your physical fitness level and ability to ride a bike for extended periods.",
                    "What would you do if your bike broke down during a delivery?",
                    "How do you handle riding in different weather conditions?"
                ]
            },
            {
                "category": "Customer Service",
                "questions": [
                    "How would you handle a situation where a customer is unhappy with a late delivery?",
                    "Describe a time when you went above and beyond for a customer.",
                    "What would you do if you couldn''t find the customer''s address?",
                    "How would you maintain food quality during transport?"
                ]
            },
            {
                "category": "Time Management & Reliability",
                "questions": [
                    "How do you prioritize multiple deliveries to ensure efficiency?",
                    "Describe your typical daily routine and how you manage your time.",
                    "What would you do if you were running late for a delivery?",
                    "How do you handle working flexible hours, including evenings and weekends?"
                ]
            },
            {
                "category": "Problem Solving",
                "questions": [
                    "Tell me about a time when you faced an unexpected challenge and how you solved it.",
                    "What would you do if a restaurant was taking longer than expected to prepare an order?",
                    "How would you handle a situation where you received the wrong order from a restaurant?",
                    "Describe how you would optimize your delivery route for maximum efficiency."
                ]
            }
        ],
        "followupPolicy": {
            "maxFollowups": 2,
            "triggerConditions": [
                "Answer is too brief (less than 20 words)",
                "Answer lacks specific examples",
                "Answer doesn''t fully address the question",
                "Answer shows potential red flags"
            ]
        },
        "scoringRubric": [
            {
                "criteria": "Communication Skills",
                "weight": 20,
                "description": "Ability to communicate clearly, professionally, and effectively with customers and team members."
            },
            {
                "criteria": "Reliability & Punctuality",
                "weight": 25,
                "description": "Demonstrated track record of being dependable, on-time, and consistent in work performance."
            },
            {
                "criteria": "Customer Service Orientation",
                "weight": 20,
                "description": "Genuine interest in helping customers and ability to handle difficult situations professionally."
            },
            {
                "criteria": "Physical Capability & Safety Awareness",
                "weight": 15,
                "description": "Physical fitness for bike riding and understanding of safety protocols in urban environments."
            },
            {
                "criteria": "Problem-Solving Ability",
                "weight": 10,
                "description": "Ability to think quickly and find solutions to unexpected challenges during deliveries."
            },
            {
                "criteria": "Technology Comfort",
                "weight": 10,
                "description": "Comfort level with using mobile apps, GPS navigation, and other delivery-related technology."
            }
        ],
        "wrapUpPrompt": "Thank you for taking the time to speak with me today. Do you have any questions about the bike delivery rider position or our company? Is there anything else you''d like me to know about your qualifications or interest in this role?",
        "duration": 1200
    }',
    true
);

-- Food Service Assistant Role
INSERT INTO job_roles (
    slug,
    title,
    description,
    config,
    is_active
) VALUES (
    'food-service-assistant',
    'Food Service Assistant',
    'Entry-level position in food service requiring attention to hygiene, customer service skills, and ability to work in a fast-paced kitchen environment.',
    '{
        "language": "en",
        "intro": "Hello! Welcome to your AI interview for the Food Service Assistant position. I''ll be evaluating your suitability for working in our kitchen and serving customers. This interview will take about 15 minutes. Please provide detailed answers and specific examples from your experience.",
        "openingQuestions": [
            "Tell me about your interest in working in the food service industry.",
            "Do you have any previous experience in kitchens or restaurants?",
            "How do you handle working in fast-paced, high-pressure environments?"
        ],
        "questionBank": [
            {
                "category": "Food Safety & Hygiene",
                "questions": [
                    "What do you know about food safety and hygiene practices?",
                    "How would you handle a situation where you noticed a coworker not following hygiene protocols?",
                    "Describe the proper way to wash your hands in a food service environment."
                ]
            },
            {
                "category": "Teamwork & Communication",
                "questions": [
                    "Describe a time when you worked effectively as part of a team.",
                    "How do you communicate with team members during busy periods?",
                    "What would you do if you disagreed with a supervisor''s instructions?"
                ]
            },
            {
                "category": "Customer Service",
                "questions": [
                    "How would you handle a customer complaint about their food?",
                    "Describe your approach to providing excellent customer service.",
                    "What would you do if a customer had a food allergy concern?"
                ]
            }
        ],
        "followupPolicy": {
            "maxFollowups": 2,
            "triggerConditions": [
                "Answer lacks detail",
                "Safety concerns mentioned",
                "Unclear about food handling"
            ]
        },
        "scoringRubric": [
            {
                "criteria": "Food Safety Knowledge",
                "weight": 30,
                "description": "Understanding of basic food safety, hygiene practices, and health regulations."
            },
            {
                "criteria": "Customer Service Skills",
                "weight": 25,
                "description": "Ability to interact positively with customers and handle complaints professionally."
            },
            {
                "criteria": "Teamwork Ability",
                "weight": 20,
                "description": "Capacity to work collaboratively in a team environment and communicate effectively."
            },
            {
                "criteria": "Work Ethic & Reliability",
                "weight": 15,
                "description": "Demonstrated reliability, punctuality, and strong work ethic."
            },
            {
                "criteria": "Adaptability",
                "weight": 10,
                "description": "Ability to adapt to changing situations and learn new procedures quickly."
            }
        ],
        "wrapUpPrompt": "Thank you for your time today. Do you have any questions about the food service assistant role or our establishment? Is there anything else you''d like to share about your qualifications?",
        "duration": 900
    }',
    true
);

-- Create a sample admin user (this would typically be done through the Supabase dashboard)
-- Note: This is just for reference - actual user creation should be done through Supabase Auth
/*
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'admin@example.com',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
);
*/