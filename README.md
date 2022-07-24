# Serverless Remind note Application

Serverless Remind Note application where a user can note down their thoughts, feelings and images.


## Functionality of the application

- [x] **A user needs to authenticate in order to use an application**
- [x] **The application allows users to create, update, delete Remind Note items.**
- [x] **The application allows users to upload a file.**
- [x] **The application only displays items/Diaries for a logged in user.**

The application consists of a frontend and backend.

### Frontend

The `client` folder contains a web application that can use the API developed in the project.
This frontend works with the serverless application.

### Backend
The `backend` folder contains a serverless application that uses the [serverless framework](https://github.com/serverless)

- The code is split into multiple layers separating business logic from I/O related code.
- Code is implemented using async/await and Promises without using callbacks.

#### Authentication

Authentication in this application, is done through [Auth0](https://auth0.com/), Which uses asymmetrically encrypted JWT tokens.


## Usage

### The Backend

**Dependency Installation**

The Serverless Framework will need us to configure access to AWS. This can be accomplished by running

`serverless config credentials --provider aws --key KEY --secret SECRET`

>Where KEY and SECRET are our AWS Key and secret key. We are not deploying to AWS, but the serverless plugin needs this configuration to exist in order to work correctly.

```bash
npm install -g serverless
```

**Run serverless offline**

```bash
cd backend
npm i
npm run start
```
Once the serverless application is running open [Postman](https://www.postman.com) and test the requests, see configuration below.

#### Deployment

To deploy an application run the following commands:

```bash
cd backend
serverless deploy
```

### The Frontend

#### Demo link

client website was hosted on [client demo](http://my-286796778868-bucket.s3-website-us-east-1.amazonaws.com/)


To run a client application first edit the `client/src/config.ts` file to set correct parameters. And then run the following commands:

```bash
cd client
npm install
npm run start
```

This should start a development server with the React application that will interact with the serverless application.

## Best practices applied


- All resources in the application are defined in the serverless.yml file.
- Each function has its own set of permissions.
- Application has sufficient monitoring.
- HTTP requests are validated.
