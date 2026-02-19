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

## Environment Variables

An **`.env`** file is used to store configuration settings and sensitive information (like API keys or database credentials) that vary across different environments.

- **`.env`**: This file stores the actual environment variables used for your local development environment. It should **never** be committed to version control to keep secrets safe.
- **`.template.env`**: This file is a blueprint that defines the keys for all necessary environment variables. It serves as a guide for anyone setting up the project.
  - When setting up the project, you should copy `.template.env` to a new file named `.env` and fill in the actual values.

## Naming Conventions

To maintain consistency throughout the codebase, please follow these naming conventions:

- **Files**: Use `kebab-case` (e.g., `user-profile.tsx`, `api-handler.ts`).
- **Functions and Classes**: Use `PascalCase` (e.g., `UserProfile`, `GetData`).
- **Hooks and Variables**: Use `camelCase` (e.g., `useAuth`, `userData`).

## Available Scripts

In the `trueke/` directory, you can run the following scripts:

- **`npm run dev`**: Starts the development server with hot-reloading.
- **`npm run build`**: Compiles the application for production.
- **`npm run lint`**: Runs ESLint to check for code quality and style issues.
- **`npm run ci`**: A combined script that runs both linting and the build process. This is typically used in Continuous Integration environments to ensure the codebase is healthy.
