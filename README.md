# ChatGPT Discord Bot 
A discord bot using gpt 3.5 as a model. Now you can ask question in your server.
### Example

![image]()

# Setup

* run ```npm install```


* **Rename the file `.env.example` to `.env`**


* Change the content of the .env

---
## Step 1: Create a Discord bot

1. Go to https://discord.com/developers/applications create an application
2. Build a Discord bot under the application
3. Get the token from bot setting

   ![image]()
4. Store the token to `.env` under the `DISCORD_TOKEN`

5. Turn MESSAGE CONTENT INTENT `ON`

   ![image]()

6. Invite your bot to your server via OAuth2 URL Generator

   ![image]()
---

## Step 2: Official API authentication

### Generate an OpenAI API key
1. Go to https://beta.openai.com/account/api-keys

2. Click Create new secret key

   ![image]()

3. Store the SECRET KEY to `.env` under the `API_KEY`

---

## Step 3: Get the channel ID

### Copy your channel ID
1. Go to your server and choose the channel for the bot

2. Right click and choose `Copy CHANNEL ID`

   ![image]()

3. Store the CHANNEL ID to `.env` under the `CATEGORY_CHANNEL`

---
