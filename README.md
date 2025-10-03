# MarsRealtyGroup 🚀

A stunning 3D interactive Mars globe built with CesiumJS, featuring NASA Mars imagery and realistic Martian geography.

![Mars Globe](https://img.shields.io/badge/Mars-Globe-red?style=for-the-badge&logo=spacex)

## 🌟 Features

- **3D Mars Globe** - Interactive 3D visualization of Mars
- **NASA Mars Imagery** - Real Mars surface data from USGS
- **Gale Crater Positioning** - Camera starts at the famous Mars landing site
- **Realistic Mars Geometry** - Accurate Mars ellipsoid (radii: 3396200, 3396200, 3376200 meters)
- **Space Environment** - Black background with no atmosphere
- **Interactive Controls** - Zoom, rotate, and pan around Mars
- **Modern Tech Stack** - Built with Vite, TypeScript, and CesiumJS

## 🚀 Quick Start

### Prerequisites

Make sure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/danielsunyuan/MarsRealtyGroup.git
   cd MarsRealtyGroup
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   - Navigate to the URL shown in the terminal (usually `http://localhost:3000/`)
   - You should see the 3D Mars globe!

## 🎮 Controls

- **Mouse Drag**: Rotate the Mars globe
- **Mouse Wheel**: Zoom in/out
- **Right Click + Drag**: Pan around Mars
- **Double Click**: Reset view to Gale Crater

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure

```
MarsRealtyGroup/
├── src/
│   └── main.ts          # Main Cesium Mars globe code
├── index.html           # HTML container
├── package.json         # Dependencies and scripts
├── vite.config.ts       # Vite configuration
└── README.md           # This file
```

## 🌍 Mars Features

- **Gale Crater**: Starting camera position (137.4°E, -4.5°N)
- **USGS Mars Imagery**: Official Mars surface data
- **Mars Ellipsoid**: Accurate Mars geometry
- **Fallback System**: Red Mars-colored globe if imagery fails to load

## 🔧 Technical Details

- **CesiumJS**: 3D globe rendering engine
- **Vite**: Fast build tool and dev server
- **TypeScript**: Type-safe JavaScript
- **Mars Ellipsoid**: Radii of 3396200, 3396200, 3376200 meters

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **NASA/USGS** for Mars imagery data
- **CesiumJS** for the 3D globe engine
- **Vite** for the development experience

## 📧 Contact

**Daniel Sun Yuan** - [@danielsunyuan](https://github.com/danielsunyuan)

---

*Built with ❤️ for the Mars exploration community*