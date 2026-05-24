# TravelMind Setup Guide

Follow these step-by-step instructions to run the TravelMind project on your local machine after downloading it from GitHub.

## Step 1: Prerequisites

Before you begin, ensure you have the following installed on your system:
- **Node.js**: We recommend using the LTS version (v18 or newer). You can download it from [nodejs.org](https://nodejs.org/).
- **Git** (Optional): If you want to clone the repository instead of downloading the ZIP.

To verify your Node.js installation, open your terminal/command prompt and run:
```bash
node -v
npm -v
```

## Step 2: Download the Project

If you haven't already, download the project:

**Option A: Using Git**
```bash
git clone <your-github-repo-url>
```

**Option B: Downloading ZIP**
1. Click the green **Code** button on the GitHub repository.
2. Select **Download ZIP**.
3. Extract the downloaded ZIP file to a folder on your computer.

## Step 3: Open Terminal and Navigate to the Frontend Directory

Open your terminal (or Command Prompt / PowerShell on Windows) and navigate to the project's `frontend` directory where the application code resides.

```bash
# First, navigate into the main project folder
cd TravelMind-main

# Then, navigate into the frontend folder
cd frontend
```
*(Note: If your downloaded folder has a different name, adjust the first command accordingly).*

## Step 4: Install Dependencies

With your terminal inside the `frontend` folder, run the following command to download and install all the required libraries and packages:

```bash
npm install
```
Wait for the installation process to complete. You might see a few warnings, which are generally safe to ignore.

## Step 5: Set Up the Environment Variables (API Key)

TravelMind uses Google's Gemini AI to generate smart travel itineraries, stays, and food recommendations. You will need an API key for the app to function properly.

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey) and create a free API key.
2. In the `frontend` directory of your project, create a new file named `.env`
3. Open the `.env` file in any text editor and add your API key like this:

```env
VITE_API_KEY=your_actual_api_key_here
```
*(Make sure there are no spaces around the `=` sign).*

## Step 6: Start the Development Server

Once everything is installed and your API key is configured, you can start the local development server by running:

```bash
npm run dev
```

## Step 7: Access the App

After running the start command, you should see output in your terminal indicating that the server is running. 

Open your web browser and go to:
[http://localhost:3000](http://localhost:3000)

Congratulations! You should now see the TravelMind app running on your machine.
