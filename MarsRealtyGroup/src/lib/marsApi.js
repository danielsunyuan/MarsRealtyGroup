import { supabase } from './supabaseClient';

/**
 * Fetch all Mars points of interest from Supabase and convert to GeoJSON
 * @returns {Promise<Object>} GeoJSON FeatureCollection
 */
export async function fetchMarsPoints() {
  try {
    const { data, error } = await supabase
      .from('mars_landing_sites')
      .select('*');

    if (error) throw error;

    // Convert SQL records back to GeoJSON FeatureCollection for Cesium
    return {
      type: "FeatureCollection",
      features: data.map(site => ({
        type: "Feature",
        properties: {
          text: site.name,
          description: site.full_name || site.name,
          source: site.country,
          sourceURL: site.web_link,
          imageURL: '', // Add image URL if available in your data
          destination: [site.x_coord, site.y_coord, 500000],
          orientation: [0, -1.57, 0]
        },
        geometry: {
          type: "Point",
          coordinates: [site.x_coord, site.y_coord]
        }
      }))
    };
  } catch (error) {
    console.error('Error fetching Mars points:', error);
    throw error;
  }
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
