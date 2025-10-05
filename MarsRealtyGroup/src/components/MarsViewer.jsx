import React, { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import "cesium/Build/Cesium/Widgets/widgets.css";
import { 
  fetchMarsLandingSites,
  addMarsPoint 
} from '../lib/marsApi';

// Set the Cesium Ion access token
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJjNjM5MjQ2NC0yNzJjLTRhNGItYTQ4Zi1mMTVjOTI3ZDM1MjEiLCJpZCI6MzQ3MDA3LCJpYXQiOjE3NTk1NDU0NzF9.fatpCrTWb31z9rwisXNopl4r1y9puR6CiYDgBdDjQeI';

const MarsViewer = () => {
  const cesiumContainer = useRef(null);
  const viewerRef = useRef(null);
  const dataSourcesRef = useRef({
    landingSites: null
  });
  const addModeHandlerRef = useRef(null);
  
  const [showDialog, setShowDialog] = useState(false);
  const [newPointData, setNewPointData] = useState(null);
  const [formData, setFormData] = useState({
    text: '',
    description: '',
    imageURL: '',
    source: 'User Contribution',
    sourceURL: ''
  });
  
  // State for layer visibility
  const [layers, setLayers] = useState({
    landingSites: true
  });
  
  // State for layer loading status
  const [layerStatus, setLayerStatus] = useState({
    landingSites: 'loaded'
  });

  useEffect(() => {
    if (!cesiumContainer.current) return;

    // Initialize Cesium viewer with Mars 2000 Sphere to match USGS data
    // USGS SIM3292 uses Mars 2000 Sphere IAU IAG: 3396190.0 radius (perfect sphere)
    const mars2000Sphere = new Cesium.Ellipsoid(3396190, 3396190, 3396190);
    Cesium.Ellipsoid.default = mars2000Sphere;
    
    // Verify dimensions match USGS spec
    console.log('Mars 2000 Sphere:', mars2000Sphere.radii);
    console.log('Matches USGS SIM3292:', 
      mars2000Sphere.radii.x === 3396190 && 
      mars2000Sphere.radii.y === 3396190 && 
      mars2000Sphere.radii.z === 3396190
    );
    
    const viewer = new Cesium.Viewer(cesiumContainer.current, {
      terrainProvider: false,
      baseLayer: false,
      baseLayerPicker: false,
      geocoder: false,
      shadows: false,
      globe: new Cesium.Globe(mars2000Sphere),
      skyBox: Cesium.SkyBox.createEarthSkyBox(),
      skyAtmosphere: new Cesium.SkyAtmosphere(mars2000Sphere),
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

      // Load initial layers
      try {
        await loadLayer('landingSites', viewer);
      } catch (error) {
        console.error('Error loading initial layers:', error);
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
      if (addModeHandlerRef.current) {
        addModeHandlerRef.current.destroy();
      }
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  // Function to load a specific layer
  const loadLayer = async (layerName, viewer) => {
    const v = viewer || viewerRef.current;
    if (!v || dataSourcesRef.current[layerName]) return;

    // Set loading status
    setLayerStatus(prev => ({ ...prev, [layerName]: 'loading' }));

    try {
      let geoJsonData;
      let color = Cesium.Color.YELLOW;
      
      switch(layerName) {
        case 'landingSites':
          geoJsonData = await fetchMarsLandingSites();
          color = Cesium.Color.fromBytes(243, 242, 99); // Yellow
          break;
        default:
          return;
      }

      const dataSource = await Cesium.GeoJsonDataSource.load(geoJsonData);
      v.dataSources.add(dataSource);
      dataSourcesRef.current[layerName] = dataSource;

      const entities = dataSource.entities.values;
      entities.forEach((entity) => {
        configureEntity(entity, v, color);
      });
      
      console.log(`Loaded ${layerName}: ${entities.length} features`);
      setLayerStatus(prev => ({ ...prev, [layerName]: 'loaded' }));
    } catch (error) {
      console.error(`Error loading ${layerName}:`, error);
      setLayerStatus(prev => ({ ...prev, [layerName]: 'error' }));
    }
  };

  // Function to remove a layer
  const removeLayer = (layerName) => {
    const viewer = viewerRef.current;
    const dataSource = dataSourcesRef.current[layerName];
    
    if (viewer && dataSource) {
      viewer.dataSources.remove(dataSource);
      dataSourcesRef.current[layerName] = null;
    }
  };

  // Toggle layer visibility
  const toggleLayer = async (layerName) => {
    const newLayers = { ...layers, [layerName]: !layers[layerName] };
    setLayers(newLayers);

    if (newLayers[layerName]) {
      await loadLayer(layerName);
    } else {
      removeLayer(layerName);
    }
  };

  const configureEntity = (entity, viewer, color = Cesium.Color.fromBytes(243, 242, 99)) => {
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
      color: color,
      outlineColor: color.brighten(0.1, new Cesium.Color()),
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
  };

  // Create HTML for the info box
  const createPickedFeatureDescription = (entity) => {
    const imageURL = entity.properties.imageURL?.getValue() || '';
    const description = entity.properties.description?.getValue() || '';
    const sourceURL = entity.properties.sourceURL?.getValue() || '';
    const source = entity.properties.source?.getValue() || '';
    
    return `
      ${imageURL ? `<img width="50%" style="float:left; margin: 0 1em 1em 0;" src="${imageURL}">` : ''}
      <p>${description}</p>
      ${sourceURL ? `<p>Source: <a target="_blank" href="${sourceURL}">${source}</a></p>` : ''}
    `;
  };

  // Enable add point mode
  const enableAddPointMode = () => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    // Remove existing handler if any
    if (addModeHandlerRef.current) {
      addModeHandlerRef.current.destroy();
    }

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    addModeHandlerRef.current = handler;

    handler.setInputAction((click) => {
      console.log('Click detected');
      const pickedObject = viewer.scene.pick(click.position);
      console.log('Picked object:', pickedObject);
      
      // Only proceed if clicked on the globe/tileset, not on existing entities
      if (Cesium.defined(pickedObject) && pickedObject.id) {
        console.log('Clicked on existing entity, ignoring');
        return; // Clicked on an existing entity, ignore
      }

      const ray = viewer.camera.getPickRay(click.position);
      console.log('Ray:', ray);
      
      // Since globe.show is false, we need to pick from the tileset
      const position = viewer.scene.pickPosition(click.position);
      console.log('Position from pickPosition:', position);
      
      if (!position) {
        console.log('No position found, trying globe pick');
        const globePosition = viewer.scene.globe.pick(ray, viewer.scene);
        console.log('Globe position:', globePosition);
        if (!globePosition) {
          console.log('Failed to get position');
          return;
        }
      }

      const cartographic = Cesium.Cartographic.fromCartesian(position || viewer.scene.globe.pick(ray, viewer.scene));
      const longitude = Cesium.Math.toDegrees(cartographic.longitude);
      const latitude = Cesium.Math.toDegrees(cartographic.latitude);

      console.log('Setting new point data:', { longitude, latitude });
      setNewPointData({
        longitude,
        latitude,
        position: position || viewer.scene.globe.pick(ray, viewer.scene)
      });
      setShowDialog(true);
      console.log('Dialog should be showing now');

      // Clean up handler after click
      handler.destroy();
      addModeHandlerRef.current = null;
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!newPointData || !viewerRef.current) return;
    
    // Ensure landing sites layer is loaded
    if (!dataSourcesRef.current.landingSites) {
      await loadLayer('landingSites');
    }

    const { longitude, latitude, position } = newPointData;

    // Create new entity in landing sites layer
    const entity = dataSourcesRef.current.landingSites.entities.add({
      position: position,
      properties: {
        text: formData.text,
        description: formData.description,
        imageURL: formData.imageURL,
        source: formData.source,
        sourceURL: formData.sourceURL,
        destination: [longitude, latitude, 500000],
        orientation: [0, -1.57, 0]
      }
    });

    configureEntity(entity, viewerRef.current, Cesium.Color.fromBytes(243, 242, 99));

    // Prepare data for backend
    const geoJsonFeature = {
      type: "Feature",
      properties: {
        text: formData.text,
        description: formData.description,
        imageURL: formData.imageURL,
        source: formData.source,
        sourceURL: formData.sourceURL,
        destination: [longitude, latitude, 500000],
        orientation: [0, -1.57, 0]
      },
      geometry: {
        type: "Point",
        coordinates: [longitude, latitude]
      }
    };

    // Save to Supabase
    try {
      const result = await addMarsPoint(geoJsonFeature);
      console.log('Point saved successfully to Supabase:', result);
    } catch (error) {
      console.error('Error saving to Supabase:', error);
      alert('Failed to save point. Please try again.');
      // Remove the entity if save failed
      dataSourcesRef.current.landingSites.entities.remove(entity);
    }

    // Reset form and close dialog
    handleCancel();
  };

  // Handle cancel
  const handleCancel = () => {
    setShowDialog(false);
    setNewPointData(null);
    setFormData({
      text: '',
      description: '',
      imageURL: '',
      source: 'User Contribution',
      sourceURL: ''
    });
  };

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <div 
        ref={cesiumContainer} 
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* Info Panel */}
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
          Click on markers to learn about Mars landmarks
        </p>
        <p style={{ margin: '5px 0', fontSize: '12px', fontStyle: 'italic' }}>
          Use mouse to navigate: Left click + drag to rotate, right click + drag to zoom, middle click + drag to pan
        </p>
        <button
          onClick={enableAddPointMode}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          + Add Point of Interest
        </button>
      </div>

      {/* Layer Control Panel */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '15px',
        borderRadius: '5px',
        fontFamily: 'Arial, sans-serif',
        minWidth: '200px'
      }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Data Layers</h3>
        <p style={{ fontSize: '10px', color: '#ccc', margin: '0 0 10px 0', fontStyle: 'italic' }}>
          Note: Large datasets are limited for performance
        </p>
        
        <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={layers.landingSites}
            onChange={() => toggleLayer('landingSites')}
            style={{ marginRight: '8px', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '14px', display: 'flex', alignItems: 'center' }}>
            <span style={{ 
              width: '12px', 
              height: '12px', 
              backgroundColor: 'rgb(243, 242, 99)', 
              borderRadius: '50%', 
              marginRight: '8px',
              display: 'inline-block'
            }}></span>
            Landing Sites
          </span>
        </label>
      </div>

      {/* Add Point Dialog */}
      {showDialog && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
          zIndex: 1000,
          minWidth: '400px',
          maxWidth: '500px',
          maxHeight: '80vh',
          overflow: 'auto'
        }}>
          <h3 style={{ marginTop: 0 }}>Add Point of Interest</h3>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>
            Location: {newPointData?.latitude.toFixed(4)}°, {newPointData?.longitude.toFixed(4)}°
          </p>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Name *
            </label>
            <input
              type="text"
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
                minHeight: '80px',
                resize: 'vertical'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Image URL
            </label>
            <input
              type="url"
              value={formData.imageURL}
              onChange={(e) => setFormData({ ...formData, imageURL: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Source
            </label>
            <input
              type="text"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Source URL
            </label>
            <input
              type="url"
              value={formData.sourceURL}
              onChange={(e) => setFormData({ ...formData, sourceURL: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
              placeholder="https://example.com"
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              onClick={handleCancel}
              style={{
                padding: '10px 20px',
                background: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.text || !formData.description}
              style={{
                padding: '10px 20px',
                background: formData.text && formData.description ? '#4CAF50' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: formData.text && formData.description ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Add Point
            </button>
          </div>
        </div>
      )}

      {/* Backdrop for dialog */}
      {showDialog && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999
        }} onClick={handleCancel} />
      )}
    </div>
  );
};

export default MarsViewer;