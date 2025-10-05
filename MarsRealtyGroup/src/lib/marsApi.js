import { supabase } from './supabaseClient';
import sourcesData from '../components/sources.json';

/**
 * Fetch Mars features from sources.json
 * @returns {Promise<Object>} GeoJSON FeatureCollection
 */
export async function fetchMarsFeatures() {
  try {
    return sourcesData;
  } catch (error) {
    console.error('Error fetching Mars features from sources.json:', error);
    throw error;
  }
}

/**
 * Fetch Mars landing sites from Supabase and convert to GeoJSON
 * @returns {Promise<Object>} GeoJSON FeatureCollection
 */
export async function fetchMarsLandingSites() {
  try {
    // Fetch from Supabase
    const { data, error } = await supabase
      .from('mars_landing_sites')
      .select('*');

    if (error) throw error;

    const supabaseFeatures = data.map(site => ({
      type: "Feature",
      properties: {
        text: site.name,
        description: site.full_name || site.name,
        source: site.country,
        sourceURL: site.web_link,
        imageURL: '',
        destination: [site.x_coord, site.y_coord, 500000],
        orientation: [0, -1.57, 0]
      },
      geometry: {
        type: "Point",
        coordinates: [site.x_coord, site.y_coord]
      }
    }));

    // Also fetch from sources.json
    const sourcesFeatures = sourcesData.features || [];

    // Merge both sources
    return {
      type: "FeatureCollection",
      features: [...supabaseFeatures, ...sourcesFeatures]
    };
  } catch (error) {
    console.error('Error fetching Mars landing sites:', error);
    // Fallback to sources.json if Supabase fails
    return sourcesData;
  }
}

/**
 * Fetch Mars geology units from Supabase and convert to GeoJSON
 * Uses smart sampling to avoid performance issues with massive datasets
 * @returns {Promise<Object>} GeoJSON FeatureCollection
 */
export async function fetchMarsGeology() {
  try {
    // Get a diverse sample of geology units without complex geometry
    const { data, error } = await supabase
      .from('mars_geology')
      .select('id, unit_name, unit_age, unit_type')
      .limit(30) // Small sample for performance
      .order('unit_age'); // Sort by age for variety

    if (error) throw error;

    // Create point markers spread across Mars instead of complex polygons
    return {
      type: "FeatureCollection",
      features: data.map((geo, index) => {
        // Create a grid-like distribution across Mars surface
        const longitude = -180 + (index * 12); // Spread across longitude
        const latitude = -90 + (Math.random() * 180); // Random latitude for variety
        
        return {
          type: "Feature",
          properties: {
            text: geo.unit_name || 'Geology Unit',
            description: `Age: ${geo.unit_age || 'Unknown'}, Type: ${geo.unit_type || 'Unknown'}`,
            source: 'USGS Geological Survey',
            sourceURL: '',
            imageURL: '',
            unit_age: geo.unit_age,
            unit_type: geo.unit_type
          },
          geometry: {
            type: "Point",
            coordinates: [longitude, latitude]
          }
        };
      })
    };
  } catch (error) {
    console.error('Error fetching Mars geology:', error);
    return {
      type: "FeatureCollection",
      features: []
    };
  }
}

/**
 * Fetch Mars published maps from Supabase and convert to GeoJSON
 * @returns {Promise<Object>} GeoJSON FeatureCollection
 */
export async function fetchMarsPublishedMaps() {
  try {
    const { data, error } = await supabase
      .from('mars_published_maps')
      .select('*');

    if (error) throw error;

    return {
      type: "FeatureCollection",
      features: data.map(map => ({
        type: "Feature",
        properties: {
          text: map.map_name || 'Published Map',
          description: `Scale: ${map.scale || 'Unknown'}`,
          source: 'USGS',
          sourceURL: map.url || ''
        },
        geometry: map.geometry || { type: "Point", coordinates: [0, 0] }
      }))
    };
  } catch (error) {
    console.error('Error fetching Mars published maps:', error);
    throw error;
  }
}

// Legacy function for backwards compatibility
export async function fetchMarsPoints() {
  return fetchMarsLandingSites();
}

/**
 * Add a new Mars point of interest to Supabase
 * @param {Object} geoJsonFeature - The GeoJSON feature to save
 * @returns {Promise<Object>} The created record
 */
export async function addMarsPoint(geoJsonFeature) {
  try {
    const { data, error } = await supabase
      .from('mars_landing_sites')
      .insert([
        {
          name: geoJsonFeature.properties.text,
          full_name: geoJsonFeature.properties.description,
          web_link: geoJsonFeature.properties.sourceURL,
          country: geoJsonFeature.properties.source,
          x_coord: geoJsonFeature.geometry.coordinates[0],
          y_coord: geoJsonFeature.geometry.coordinates[1],
          year: new Date().getFullYear() // Current year for user-added points
        }
      ])
      .select();

    if (error) throw error;

    return data[0];
  } catch (error) {
    console.error('Error adding Mars point:', error);
    throw error;
  }
}

/**
 * Update an existing Mars point
 * @param {string} id - The ID of the point to update
 * @param {Object} updates - Object containing fields to update
 * @returns {Promise<Object>} The updated record
 */
export async function updateMarsPoint(id, updates) {
  try {
    const { data, error } = await supabase
      .from('mars_landing_sites')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;

    return data[0];
  } catch (error) {
    console.error('Error updating Mars point:', error);
    throw error;
  }
}

/**
 * Delete a Mars point
 * @param {string} id - The ID of the point to delete
 * @returns {Promise<void>}
 */
export async function deleteMarsPoint(id) {
  try {
    const { error } = await supabase
      .from('mars_landing_sites')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting Mars point:', error);
    throw error;
  }
}