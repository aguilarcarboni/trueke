# trueke

## Project Structure

The project follows a modular structure within the `trueke/src` directory:

- **`app/`**: Contains the application routes (what will be displayed to the user) and API routes.
  - This folder serves as the entry point for each route.
  - Page components and layouts define the structure of the routes.
- **`components/`**: Where the actual modular building blocks of the UI are built.
  - Components are assembled within the routes in the `app/` folder.
  - Each modular part that is part of a route is built here to maintain a clean separation between routing and UI logic.
- **`lib/`**: Used for storing type definitions.
- **`utils/`**: Used for utility functions, including CRUD operations and other business logic for entities.
