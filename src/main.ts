import * as Cesium from 'cesium'

// Mars ellipsoid parameters (radii in meters)
const marsRadii = new Cesium.Cartesian3(3396200.0, 3396200.0, 3376200.0)

// Create Mars ellipsoid
const marsEllipsoid = new Cesium.Ellipsoid(
  marsRadii.x,
  marsRadii.y,
  marsRadii.z
)

// Create the viewer with Mars configuration
const viewer = new Cesium.Viewer('cesiumContainer', {
  // Disable Earth-specific UI elements
  timeline: false,
  baseLayerPicker: false,
  geocoder: false,
  homeButton: false,
  sceneModePicker: false,
  navigationHelpButton: false,
  fullscreenButton: true,
  vrButton: false,
  infoBox: true,
  selectionIndicator: true,
  
  // Configure the scene
  scene: {
    // Remove atmosphere
    atmosphere: false,
    // Set background to black
    backgroundColor: Cesium.Color.BLACK,
    // Set the globe to use Mars ellipsoid
    globe: new Cesium.Globe(marsEllipsoid)
  }
})

// Configure the scene for Mars
const scene = viewer.scene

// Disable atmosphere and set sky box to black
scene.skyAtmosphere.show = false
scene.skyBox.show = false
scene.backgroundColor = Cesium.Color.BLACK

// Configure the globe
const globe = scene.globe
globe.enableLighting = false
globe.showGroundAtmosphere = false
globe.baseColor = Cesium.Color.WHITE

// Remove all default imagery layers first
viewer.imageryLayers.removeAll()

// Try to use USGS Mars imagery which should work without CORS issues
console.log('Attempting to load USGS Mars imagery...')
try {
  // Create Mars imagery provider using USGS WMS service
  const marsImageryProvider = new Cesium.WebMapServiceImageryProvider({
    url: 'https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/mars/mars_simp_cyl.map&service=WMS',
    layers: 'MDIM21_color',
    parameters: {
      transparent: false,
      format: 'image/png'
    },
    tilingScheme: new Cesium.GeographicTilingScheme({ ellipsoid: marsEllipsoid }),
    tileWidth: 512,
    tileHeight: 512,
    maximumLevel: 10
  })
  
  viewer.imageryLayers.addImageryProvider(marsImageryProvider)
  console.log('USGS Mars imagery loaded successfully')
  
} catch (error) {
  console.error('Failed to load USGS Mars imagery:', error)
  console.log('Using solid color Mars globe as fallback...')
  
  // Fallback: create a simple solid color globe with Mars-like appearance
  globe.baseColor = Cesium.Color.fromCssColorString('#CD5C5C') // Mars-like red color
  
  // Add some procedural texture to make it look more like Mars
  globe.material = new Cesium.ColorMaterialProperty(Cesium.Color.fromCssColorString('#CD5C5C'))
  
  // Enable lighting to give it some depth
  globe.enableLighting = true
}

// Force globe update
globe.tileCacheSize = 1000

// Set camera position to Gale Crater
// Gale Crater coordinates: longitude 137.4, latitude -4.5
const galeCraterPosition = Cesium.Cartesian3.fromDegrees(137.4, -4.5, 4000000)
viewer.camera.setView({
  destination: galeCraterPosition,
  orientation: {
    heading: 0.0,
    pitch: -Cesium.Math.PI_OVER_TWO,
    roll: 0.0
  }
})

// Set up camera controls for better Mars navigation
viewer.camera.moveEnd.addEventListener(() => {
  // Ensure camera stays at reasonable distance from Mars surface
  const cameraHeight = viewer.camera.positionCartographic.height
  if (cameraHeight < 1000) {
    viewer.camera.positionCartographic.height = 1000
  }
  if (cameraHeight > 10000000) {
    viewer.camera.positionCartographic.height = 10000000
  }
})

// Add some basic lighting for the Mars surface
scene.globe.enableLighting = true
scene.globe.dynamicAtmosphereLighting = false

// Set the sun direction (you can adjust this for different lighting effects)
scene.sun.show = false
scene.moon.show = false
scene.skyBox.show = false

// Add some debugging
console.log('Mars Globe initialized successfully!')
console.log('Camera positioned at Gale Crater')
console.log('Globe base color:', globe.baseColor)

// Force a render
viewer.scene.requestRender()