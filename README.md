# House_Rental_System
## Overview
This is a full stack web application built using Handlebars (HBS), Express, and MySQL. The application provides two portals: one for tenants and one for owners. Owners can post about properties, and tenants can view these posts and book properties. 

## Features

### Owner Portal
- **Post Property:** Owners can create and post new property listings.
- **Update Property:** Owners can update the details of their property listings.
- **Delete Property:** Owners can delete their property listings.
- **Cancel Booking:** Owners can cancel bookings made by tenants.

### Tenant Portal
- **View Properties:** Tenants can view all property listings posted by owners.
- **Book Property:** Tenants can book properties they are interested in.

## Technology Stack
- **Front End:** Handlebars (HBS)
- **Back End:** Express.js
- **Database:** MySQL

Clone the repository: https://github.com/ayushh-11/House_Rental_System.git

## To use the application. Follow the steps below :
-node should be installed
-Open the folder with any code editor
-run the command in the same directory:
$ npm install express body-parser cookie-parser express-session dotenv express-handlebars hbs mysql nodemon
-edit the package.json file and set scripts.start = "nodemon app.js"
-open phpmyadmin in your localhost and import the database "bca_house_rental_system" from this directory
-run the command to start the app :
$ npm start
