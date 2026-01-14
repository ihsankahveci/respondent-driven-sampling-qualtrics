## Qualtrics Integration Setup

This application embeds Qualtrics surveys as part of the survey flow. To configure Qualtrics integration for deployment:

### 1. Server Configuration

Add the Qualtrics survey URL to your server environment variables:

```bash
# In server/.env or Azure App Service configuration
QUALTRICS_SURVEY_URL=https://your-qualtrics-domain.qualtrics.com/jfe/form/SV_yourSurveyId
```

### 2. Qualtrics Survey Configuration

In your Qualtrics survey, add the following JavaScript to the **End of Survey** section to enable auto-advance:

1. Go to **Survey Flow** → **End of Survey** element
2. Click **Customize** → **JavaScript**
3. Add this code:

```javascript
Qualtrics.SurveyEngine.addOnload(function() {
    // This code runs when survey completes
});

Qualtrics.SurveyEngine.addOnReady(function() {
    // Listen for survey completion
    var that = this;
    this.questionclick = function(event, element) {
        if (element.type === 'submit') {
            // Survey is complete, notify parent window
            window.parent.postMessage('endOfSurvey', '*');
        }
    };
});

Qualtrics.SurveyEngine.addOnUnload(function() {
    // Send completion signal on final page unload
    window.parent.postMessage('endOfSurvey', '*');
});
```

### 3. Embedded Data Setup

Configure an **Embedded Data** field to receive the survey code:

1. Go to **Survey Flow**
2. Add an **Embedded Data** element at the beginning
3. Create a field named: `surveyCode`
4. This will automatically receive the survey code from the application URL

### 4. How It Works

- The application embeds your Qualtrics survey in an iframe
- Survey code is passed as a URL parameter: `?surveyCode=ABC12345`
- When participants complete the Qualtrics survey, the JavaScript sends a `postMessage` signal
- The application automatically advances to the next page (gift cards)
- Survey responses are stored in Qualtrics, referral chain tracking in MongoDB

---

## Overview

Adding Qualtrics. The RDS App is a secure, accessible, and open-source web application that streamlines data collection for homelessness research using **Respondent-Driven Sampling (RDS)**. Developed in collaboration with the University of Washington iSchool and the King County Regional Homelessness Authority (KCRHA), this app enables volunteers and administrators to collect accurate survey data, track referrals, and generate population estimates more effectively than traditional Point-In-Time (PIT) counts.

<!-- > **Live Deployment:** [Link to App](https://rds-main-g6e3dpefdabmcmca.westus-01.azurewebsites.net/login) -->

> **Research-Driven:** Based on field-tested RDS methodologies

> **Secure & Compliant:** Built with HIPAA and HUD compliance in mind

## Tech Stack

| Layer       | Technology                       |
| ----------- | -------------------------------- |
| Frontend    | React, HTML/CSS, JavaScript      |
| Backend     | Node.js, Express.js              |
| Database    | MongoDB                          |
| Auth        | Twilio                           |
| Hosting     | Azure Web Service                |
| QR Scanning | Html5QrcodeScanner, QRCodeCanvas |

## Directory (old)

```plaintext
client/                   # Client-facing React application
├── build/                # Production build of the React app
├── static/               # Static assets (JS, CSS, media)
│   ├── js/               # Compiled JS chunks
│   │   ├── 488.db91e947.chunk.js         # Bundled JS code for part of the React app
│   │   └── 488.db91e947.chunk.js.map     # Source map for debugging that chunk
│   ├── asset-manifest.json               # Maps file names to generated names (used by backend)
│   ├── favicon.ico                       # Icon shown in browser tab
│   ├── index.html                        # Root HTML file for the React app
│   ├── manifest.json                     # Metadata for PWA features (name, icons, theme color)
│   └── robots.txt                        # Tells search engines what to crawl or not
├── public/               # Files accessible to anyone on the internet
│   ├── favicon.ico                       # Icon file for the application
│   ├── index.html                        # The main HTML file that serves as the entry point
│   ├── manifest.json                     # Metadata about the web application
│   └── robots.txt                        # Instructs crawlers on access rules
├── src/                  # Source code for the app
│   ├── components/
│   │   └── survey/
│   │       └── SurveyComponent.tsx        # Survey component logic
│   ├── pages/
│   │   ├── AdminDashboard/               # Admin dashboard code. Shows staff
│   │   │   ├── NewUser.tsx               # Admin new user creation
│   │   │   └── StaffDashboard.tsx        # Admin dashboard UI
│   │   ├── CompletedSurvey/
│   │   │   ├── CompletedSurvey.tsx       # End of survey functionality code
│   │   │   └── QrPage.tsx                # Displays generated QR code
│   │   ├── Header/
│   │   │   └── Header.tsx                # Header functionality code
│   │   ├── LandingPage/
│   │   │   └── LandingPage.tsx           # App landing page functionality code
│   │   ├── Login/
│   │   │   └── Login.tsx                 # Login functionality code
│   │   ├── PastEntries/
│   │   │   ├── PastEntries.tsx           # Past survey entries dashboard functionality
│   │   │   ├── SurveyDetails.tsx         # Displays individual survey details
│   │   ├── Profile/
│   │   │   ├── AdminEditProfile.tsx      # Edit profile functionalities
│   │   │   └── ViewProfile.tsx
│   │   ├── QRCodeScanAndReferral/
│   │   │   └── ApplyReferral.tsx         # Functionality to apply a referral code
│   │   ├── Signup/
│   │   │   └── Signup.tsx                # Sign up functionality
│   │   └── SurveyEntryDashboard/
│   │       └── SurveyEntryDashboard.tsx  # Displays all surveys as a dashboard
│   ├── App.tsx                           # Main component of the application
│   ├── App.test.js                       # Contains tests for the App component
│   ├── index.tsx                         # JS entry point; renders root React component
│   ├── index.css                         # Global styles for the application
│   ├── logo.svg                          # The React logo
│   ├── setupTests.js                     # Sets up the testing environment
│   ├── assets/                           # Image assets for UI
│   │   ├── filter.png
│   │   ├── magnifyingGlass.png
│   │   ├── pencil.png
│   │   ├── trash.png
│   │   └── up-down.png
│   ├── styles/                           # Styling files by page/component
│   │   ├── ApplyReferral.css
│   │   ├── LandingPage.css
│   │   ├── PastEntriesCss.css
│   │   ├── StaffDashboard.css
│   │   ├── SurveyDashboard.css
│   │   ├── SurveyDetailsCss.css
│   │   ├── complete.css
│   │   ├── header.css
│   │   ├── login.css
│   │   ├── profile.css
│   │   └── signup.css
│   ├── types/                            # TypeScript type definitions
│   │   ├── AuthProps.ts
│   │   ├── ReferralCode.ts
│   │   ├── Survey.ts
│   │   └── User.ts
│   └── vite-env.d.ts                     # Vite's auto-imported type definitions
├── .gitignore                            # Specifies files to ignore in Git
├── README.md                             # Description of the project, usage, etc.
├── README.old.md                         # Old version of the project description
├── package.json                          # Frontend dependencies and scripts
├── package-lock.json                     # Lockfile for frontend dependencies
├── prettier.config.js                    # Code formatting configuration
├── tsconfig.json                         # TypeScript config file
└── vite.config.ts                        # Vite bundler configuration
server/                   # Backend code
├── __tests__/                     # Backend tests
│   ├── database.test.js
│   └── server.test.js
├── database/              # Database layer
│   ├── __tests__/                 # Database tests
│   │   └── index.test.ts
│   ├── survey/                    # Survey domain module
│   │   ├── mongoose/              # Mongoose models and hooks
│   │   │   ├── __tests__/
│   │   │   ├── survey.hooks.ts
│   │   │   └── survey.model.ts
│   │   ├── zod/                   # Zod validation schemas
│   │   │   ├── __tests__/
│   │   │   ├── survey.base.ts
│   │   │   └── survey.validator.ts
│   │   ├── survey.controller.ts   # Route operations
│   │   └── survey.utils.ts        # Utility functions
│   ├── user/                      # User domain module (same structure as survey)
│   │   └── ...
│   ├── seed/                      # Seed domain module (same structure as survey)
│   │   └── ...
│   ├── utils/                     # Database utilities
│   │   ├── constants.ts
│   │   └── errors.ts
│   └── index.ts                   # Database module exports
├── models/               # Mongoose schemas
│   └── __tests__/                 # Models tests
│       ├── Survey.test.js
│       └── Users.test.js
│   ├── Survey.js                         # Survey entries with responses and geolocation
│   └── Users.js                          # User accounts, roles, and hashed passwords
├── routes/               # API routes
│   ├── __tests__/                 # Routes tests
│   │   ├── auth.test.js
│   │   ├── pages.test.js
│   │   └── surveys.test.js
│   ├── auth.js                           # Handles login, registration, and approvals
│   ├── pages.js                          # Future page-level routing logic
│   └── surveys.js                        # Routes to submit, validate, and fetch surveys
├── utils/
│   ├── __tests__/                 # Utils tests
│   │   └── generateReferralCode.test.js
│   └── generateReferralCode.js           # Utility to generate unique referral codes
├── index.ts                              # Main entry point for Express backend
├── .gitignore                            # Specifies files to ignore in Git
├── package.json                          # Backend dependencies and scripts
└── package-lock.json                     # Lockfile for backend dependencies
```

## Setup Instructions

### 🔧 Local Development

1. **Clone Repo**

```bash
git clone <repository>
cd <repository>
```

2. **Set Environment Variables**
   Copy paste `.env.example` as `.env` in the `server` directory, and paste the neccessary environment values.

3. **Install Packages**

```bash
npm install
```

4. **Start Backend Server**

```bash
npm start
```

5. **Start Frontend Dev Server** (In seperate terminal)

```bash
cd client
npm run dev
```

6. **Visit App** at http://localhost:3000.

## Development & Deployment Workflow

This project uses a **three-tier branching strategy** for safe, collaborative development and deployment:

### Branch Structure

-   **`feature/*`**: Feature branches for new development
-   **`test`**: Staging branch that auto-deploys to staging environment (`rds-main-la-test.azurewebsites.net`)
-   **`main`**: Production branch that deploys to production environment

### Contributing Workflow

```bash
# 1. Create feature branch from main
git checkout main
git pull origin main
git checkout -b feature/your-feature-name

# 2. Develop and test locally
cd server && npm run dev    # Terminal 1 (port 1234)
cd client && npm run dev    # Terminal 2 (port 3000)

# 3. Merge to test branch for staging deployment
git checkout test
git pull origin test
git merge feature/your-feature-name --no-ff
git push origin test
# → Auto-deploys to staging via GitHub Actions

# 4. Test on staging environment
# Visit: https://rds-main-la-test.azurewebsites.net
# Verify your changes work as expected

# 5. Merge to main for production deployment
git checkout main
git pull origin main
git merge test --no-ff
git push origin main
# → Deploys to production
```

### Deployment Environments

| Environment | Branch | URL                                      | Purpose                    |
| ----------- | ------ | ---------------------------------------- | -------------------------- |
| Local       | Any    | `http://localhost:3000`                  | Local development          |
| Staging     | `test` | `https://rds-main-la-test.azurewebsites.net` | Pre-production testing     |
| Production  | `main` | `https://rds-main-la.azurewebsites.net`      | Live application           |

**Note**: Staging and production use the same MongoDB database but can be configured separately in Azure App Service settings.

## Future Directions

The items listed below are features our team has identified out of scope for the duration of our project. These items are still considered high importance for the project as a whole, and are highly recommended as a jumping off point for teams taking over the project in the future.

**App Features**

-   Auto-populate location using GPS location coordinates
-   Widget for staff to comment on survey responses
-   Integration with Homeless Management Information System (HMIS) database system
-   Volunteer scheduling dashboard for administrators
-   Automated SMS gift card distribution
-   Resume unfinished survey feature
-   Admin ability to edit survey questions
-   Volunteer ability to edit survey responses
-   Survey analytics dashboard

**Testing**

-   Dynamic Application Security Testing (DAST)

**User Experience**
-Step-by-step user training guide

-   Setup wizard

## Contributors

Thanks to the following people for their work on this project: Ihsan Kahveci, June Yang, Emily Porter, Zack Almquist, Elizabeth Deng, KelliAnn Ramirez, Jasmine Vuong, Hannah Lam, Ella Weinberg, Arushi Agarwal, Devanshi Desai, Aryan Palave, Kaden Kapadia, Hrudhai Umashankar, Liya Finley Hutchison, Hana Amos, Zack Crouse, Kristen L Gustafson.
