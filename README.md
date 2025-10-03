# Mars Globe App

A 3D interactive Mars globe using CesiumJS and NASA Trek imagery.

## Features

- 3D Mars globe with NASA Trek global mosaic tiles
- Mars ellipsoid geometry (radii: 3396190, 3396190, 3376200 meters)
- Camera positioned at Gale Crater
- Disabled Earth-specific UI elements
- Black background with no atmosphere
- Zoomable and spinnable globe

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser to view the Mars globe

## Data Source

This app uses NASA Trek Mars global mosaic tiles:
- URL: `https://trek.nasa.gov/tiles/Mars/EQ/Mosaic/{z}/{y}/{x}.jpg`
- Credit: NASA Trek Mars Global Mosaic

## Camera Position

The camera is initially positioned at Gale Crater:
- Longitude: 137.4°
- Latitude: -4.5°
- Height: 4,000,000 meters

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint