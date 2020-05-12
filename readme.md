## What is this?

A restaurant review app. Think "Yelp" as an example.

## What does it built on?

Built with Node.js, Express, MongoDB. Pug is used for rendering

## What can it do?

CRUD functionality with stores, reviews and users.

## How to use it
 1. Clone this repo.
 2. Run `npm install` to install dependencies.
 3. Set up MongoDB. I use cloud.mongodob.com. Get the address to connect to your DB.
 4. Set up mailing service such as Postmark. This is needed for password reset emails.
 5. Set up API key for Google Maps.
 5. Create file called `variables.env`. Required variables are listed below.
 6. Run `npm run dev` to run in development mode or `npm start` to work in production.

### Required Variables

In your `variables.env` file, you will need the following information:
    - NODE_ENV [production or development]
    - DATABASE [mongoDB server]
    - MAIL_USER [username for mail service]
    - MAIL_PASS [password for mail service]
    - MAIL_HOST [smtp address for mail service]
    - MAIL_PORT [port for mail service]
    - PORT [80 if in production, otherwise you choose. I use 5000]
    - MAP_KEY [Google Maps API Key]
    - SECRET [I used `snickers` but you can use something else]
    - KEY [i used `sweetsesh` but again this can be changed]
