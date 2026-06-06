# Repetito Front

Frontend for a tutor marketplace prototype. The application contains a landing page and an authentication modal for student and tutor registration.

## Stack

- React 18
- Vite
- Tailwind CSS
- Radix Dialog
- React Hook Form

## Project Structure

```text
src/
  app/                 # application composition root
  features/
    auth/              # login and registration UI
    landing/           # public landing page
  main.tsx
  styles.css
```

New product areas should be added as separate folders inside `src/features`. Each feature should keep its own UI, local types, and API calls close to the code that uses them.

## Scripts

```bash
npm install
npm run dev
npm run build
```

The API base URL can be configured with `VITE_API_URL`. If it is not set, the app uses `http://localhost:8080/api/v1`.
