Local Service Marketplace
A comprehensive full-stack web application built to bridge the gap between local service professionals and customers. This platform provides a seamless experience for finding, requesting, and managing essential home services.

-Key Feature
Secure Authentication: robust user registration and login powered by bcrypt password hashing.

Role-Based Workflows: dedicated interfaces and permissions for both Customers and Service Providers.

Data Persistence: a fully integrated relational database to ensure user data and service history are securely stored.

RESTful Architecture: clean API design for efficient communication between the client-side UI and the server.

Mobile-First Design: a fully responsive frontend built to work across desktops, tablets, and smartphones.

-Tech Stack
Frontend
HTML5 / CSS3: structured with semantic HTML and styled using Tailwind CSS.

JavaScript (ES6+): vanilla JS for dynamic DOM manipulation and asynchronous API calls.

Backend
Runtime: Node.js

Framework: Express.js

Database: SQLite3

Security: Bcrypt for encryption and CORS for cross-origin resource management.

-Database Architecture
The system utilizes a relational SQLite database (services.db) structured with five core entities:

Users: manages credentials and profile information.

Services: contains defined service categories (e.g., Plumbing, Electrical, HVAC).

Service Providers: links users to professional listings, rates, and availability.

Service Requests: tracks customer bookings and project details.

Assignments: manages the active connection between a provider and a specific job.
