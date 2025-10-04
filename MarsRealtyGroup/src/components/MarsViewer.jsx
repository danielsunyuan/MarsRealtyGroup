import React, { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import "cesium/Build/Cesium/Widgets/widgets.css";

// Set the Cesium Ion access token (you'll need to provide your own)
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJjNjM5MjQ2NC0yNzJjLTRhNGItYTQ4Zi1mMTVjOTI3ZDM1MjEiLCJpZCI6MzQ3MDA3LCJpYXQiOjE3NTk1NDU0NzF9.fatpCrTWb31z9rwisXNopl4r1y9puR6CiYDgBdDjQeI';

const MarsViewer = () => {
  const cesiumContainer = useRef(null);
  const viewerRef = useRef(null);

  useEffect(() => {
    if (!cesiumContainer.current) return;

    // Initialize Cesium viewer with Mars configuration
    Cesium.Ellipsoid.default = Cesium.Ellipsoid.MARS;
    
    const viewer = new Cesium.Viewer(cesiumContainer.current, {
      terrainProvider: false,
      baseLayer: false,
      baseLayerPicker: false,
      geocoder: false,
      shadows: false,
      globe: new Cesium.Globe(Cesium.Ellipsoid.MARS),
      skyBox: Cesium.SkyBox.createEarthSkyBox(),
      skyAtmosphere: new Cesium.SkyAtmosphere(Cesium.Ellipsoid.MARS),
    });
    
    viewerRef.current = viewer;
    viewer.scene.globe.show = false;
    const scene = viewer.scene;

    // Configure Mars-like atmosphere
    scene.skyAtmosphere.atmosphereMieCoefficient = new Cesium.Cartesian3(
      9.0e-5,
      2.0e-5,
      1.0e-5,
    );
    scene.skyAtmosphere.atmosphereRayleighCoefficient = new Cesium.Cartesian3(
      9.0e-6,
      2.0e-6,
      1.0e-6,
    );
    scene.skyAtmosphere.atmosphereRayleighScaleHeight = 9000;
    scene.skyAtmosphere.atmosphereMieScaleHeight = 2700.0;
    scene.skyAtmosphere.saturationShift = -0.1;
    scene.skyAtmosphere.perFragmentAtmosphere = true;

    // Configure post-processing for visual enhancement
    const bloom = viewer.scene.postProcessStages.bloom;
    bloom.enabled = true;
    bloom.uniforms.brightness = -0.5;
    bloom.uniforms.stepSize = 1.0;
    bloom.uniforms.sigma = 3.0;
    bloom.uniforms.delta = 1.5;
    scene.highDynamicRange = true;
    viewer.scene.postProcessStages.exposure = 1.5;

    // Load Mars 3D tileset
    const loadMarsData = async () => {
      try {
        const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(3644333, {
            enableCollision: true,
          });
          viewer.scene.primitives.add(tileset);
      } catch (error) {
        console.error('Error loading Mars tileset:', error);
      }

      // Load points of interest
      try {
        await loadPointsOfInterest(viewer);
      } catch (error) {
        console.error('Error loading points of interest:', error);
      }
    };

    // Setup initial camera rotation
    const rotationSpeed = Cesium.Math.toRadians(0.1);
    const removeRotation = viewer.scene.postRender.addEventListener(
      function (scene, time) {
        viewer.scene.camera.rotateRight(rotationSpeed);
      },
    );

    // Stop rotation on any user interaction
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    const stopRotation = () => removeRotation();
    
    handler.setInputAction(stopRotation, Cesium.ScreenSpaceEventType.LEFT_DOWN);
    handler.setInputAction(stopRotation, Cesium.ScreenSpaceEventType.RIGHT_DOWN);
    handler.setInputAction(stopRotation, Cesium.ScreenSpaceEventType.MIDDLE_DOWN);
    handler.setInputAction(stopRotation, Cesium.ScreenSpaceEventType.WHEEL);

    loadMarsData();

    // Cleanup
    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  // Function to load points of interest
  const loadPointsOfInterest = async (viewer) => {
    // Sample GeoJSON data for Mars points of interest
    // In production, you would load this from an external file or API
    const marsPointsOfInterest = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            text: "Olympus Mons",
            description: "The tallest volcano in the solar system, rising 21 km above the surrounding plains.",
            imageURL: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Olympus_Mons_alt.jpg/300px-Olympus_Mons_alt.jpg",
            source: "NASA/JPL",
            sourceURL: "https://mars.nasa.gov/",
            destination: [-133.0, 18.65, 5000000],
            orientation: [0, -1.57, 0]
          },
          geometry: {
            type: "Point",
            coordinates: [-133.0, 18.65]
          }
        },
        {
          type: "Feature",
          properties: {
            text: "Valles Marineris",
            description: "A vast canyon system that runs along the Martian equator, stretching over 4,000 km.",
            imageURL: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/VallesMarinerisHuge.jpg/300px-VallesMarinerisHuge.jpg",
            source: "NASA/JPL",
            sourceURL: "https://mars.nasa.gov/",
            destination: [-70.0, -13.0, 5000000],
            orientation: [0, -1.57, 0]
          },
          geometry: {
            type: "Point",
            coordinates: [-70.0, -13.0]
          }
        },
        {
          type: "Feature",
          properties: {
            text: "Gale Crater",
            description: "A 154 km wide impact crater and landing site of NASA's Curiosity rover.",
            imageURL: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Gale_Crater_-_Curiosity%27s_landing_site.jpg/300px-Gale_Crater_-_Curiosity%27s_landing_site.jpg",
            source: "NASA/JPL",
            sourceURL: "https://mars.nasa.gov/",
            destination: [137.4, -5.4, 500000],
            orientation: [0, -1.57, 0]
          },
          geometry: {
            type: "Point",
            coordinates: [137.4, -5.4]
          }
        },
        {
          type: "Feature",
          properties: {
            text: "Jezero Crater",
            description: "A 49 km wide crater that was once home to an ancient lake, and landing site of NASA's Perseverance rover.",
            imageURL: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Jezero_crater_on_Mars_-_PIA23239.jpg/300px-Jezero_crater_on_Mars_-_PIA23239.jpg",
            source: "NASA/JPL",
            sourceURL: "https://mars.nasa.gov/",
            destination: [77.5, 18.4, 500000],
            orientation: [0, -1.57, 0]
          },
          geometry: {
            type: "Point",
            coordinates: [77.5, 18.4]
          }
        },
        {
          type: "Feature",
          properties: {
            text: "Polar Ice Caps",
            description: "Mars has permanent polar ice caps composed of water ice and frozen carbon dioxide.",
            imageURL: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Mars_NPArea-PIA00161.jpg/300px-Mars_NPArea-PIA00161.jpg",
            source: "NASA/JPL",
            sourceURL: "https://mars.nasa.gov/",
            destination: [0, 87, 3000000],
            orientation: [0, -1.57, 0]
          },
          geometry: {
            type: "Point",
            coordinates: [0, 87]
          }
        }
      ]
    };

    const dataSource = await Cesium.GeoJsonDataSource.load(marsPointsOfInterest);
    viewer.dataSources.add(dataSource);

    const entities = dataSource.entities.values;
    entities.forEach((entity) => {
      // Configure labels
      entity.label = new Cesium.LabelGraphics({
        text: entity.properties.text,
        font: '18pt Verdana',
        outlineColor: Cesium.Color.DARKSLATEGREY,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -22),
        scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 1.5e7, 0.5),
        translucencyByDistance: new Cesium.NearFarScalar(2.5e7, 1.0, 4.0e7, 0.0),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: new Cesium.CallbackProperty(() => {
          return Cesium.Cartesian3.magnitude(viewer.scene.camera.positionWC);
        }, false),
      });

      // Configure point graphics
      entity.point = new Cesium.PointGraphics({
        pixelSize: 10,
        color: Cesium.Color.fromBytes(243, 242, 99),
        outlineColor: Cesium.Color.fromBytes(219, 218, 111),
        outlineWidth: 2,
        scaleByDistance: new Cesium.NearFarScalar(1.5e3, 1.0, 4.0e7, 0.1),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: new Cesium.CallbackProperty(() => {
          return Cesium.Cartesian3.magnitude(viewer.scene.camera.positionWC);
        }, false),
      });

      // Set entity properties for info box
      entity.name = entity.properties.text.getValue();
      entity.description = createPickedFeatureDescription(entity);
    });
  };

  // Create HTML for the info box
  const createPickedFeatureDescription = (entity) => {
    return `
      <img
        width="50%"
        style="float:left; margin: 0 1em 1em 0;"
        src="${entity.properties.imageURL.getValue()}">
      <p>${entity.properties.description.getValue()}</p>
      <p>
        Source: 
        <a target="_blank" href="${entity.properties.sourceURL.getValue()}">
          ${entity.properties.source.getValue()}
        </a>
      </p>
    `;
  };

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <div 
        ref={cesiumContainer} 
        style={{ width: '100%', height: '100%' }}
      />
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontFamily: 'Arial, sans-serif',
        maxWidth: '300px'
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Mars Explorer</h3>
        <p style={{ margin: '5px 0', fontSize: '14px' }}>
          Click on yellow markers to learn about Mars landmarks
        </p>
        <p style={{ margin: '5px 0', fontSize: '12px', fontStyle: 'italic' }}>
          Use mouse to navigate: Left click + drag to rotate, right click + drag to zoom, middle click + drag to pan
        </p>
      </div>
    </div>
  );
};

export default MarsViewer;