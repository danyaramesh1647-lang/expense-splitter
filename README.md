# Expense Splitter

A mini Splitwise-style web app built as a Web Technologies college project. Lets a group of people track shared expenses and see who owes whom.

**Live demo:** https://expense-splitter-bt6b.onrender.com
*(Free hosting — first load after inactivity may take 30-50 seconds to spin up)*

## Features
- User signup/login with JWT-based authentication
- Create groups and add members by email
- Add expenses with equal, unequal, or percentage-based splits
- Automatic balance calculation with settle-up/debt simplification
- Expense history per group

## Tech Stack
- **Frontend:** HTML, CSS, JavaScript (vanilla, multi-page)
- **Backend:** Node.js, Express
- **Database:** MongoDB (Atlas)
- **Auth:** JWT + bcrypt

## Project Structure

expense-splitter/
├── server/
│ ├── controllers/ # Route logic (auth, groups, expenses)
│ ├── middleware/ # JWT auth middleware
│ ├── models/ # Mongoose schemas
│ ├── routes/ # Express routers
│ ├── public/ # Frontend (HTML/CSS/JS)
│ └── server.js
├── .env.example
└── package.json


## Setup (run locally)

1. Clone the repo and install dependencies:

npm install

2. Copy `.env.example` to `.env` and fill in:

MONGO_URI=<your MongoDB Atlas connection string>
JWT_SECRET=<any random string>

3. Start the server:

npm start

4. Open `http://localhost:3000` in your browser.

## Usage
Sign up → log in → create a group (optionally add member emails) → add expenses → view balances and suggested settlements.




