# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript and enable type-aware lint rules. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# The Global Clicker

A real-time interactive globe showing button clicks from around the world.

## Environment Setup

The application uses environment variables for configuration. Create the appropriate `.env` file based on your environment:

### Development
Copy `.env.example` to `.env.development`:
```bash
cp .env.example .env.development
```

### Production
Create `.env.production` with the following variables:
```
VITE_API_URL=https://api.theglobalclicker.com
VITE_USE_DUMMY_DATA=false
```

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| VITE_API_URL | Backend API URL | http://localhost:5001 |
| VITE_USE_DUMMY_DATA | Toggle dummy location data | true/false |

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Production Build

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```
