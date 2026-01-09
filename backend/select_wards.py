"""
Script to analyze Delhi wards and select 4 representative wards
based on their geographic distribution (one from each quadrant)
"""
import geopandas as gpd
import numpy as np
import json
import os

# Load Delhi Wards GeoJSON
print("Loading Delhi Wards...")
wards = gpd.read_file("Delhi_Wards.geojson")
print(f"✓ Loaded {len(wards)} wards")

# Calculate centroids for each ward
print("Calculating ward centroids...")
wards_projected = wards.to_crs(epsg=32643)  # UTM Zone 43N for Delhi
centroids_projected = wards_projected.geometry.centroid
centroids_wgs84 = centroids_projected.to_crs(epsg=4326)

wards['cent_lon'] = centroids_wgs84.x
wards['cent_lat'] = centroids_wgs84.y

# Calculate overall bounds
bounds = wards.total_bounds
center_lon = (bounds[0] + bounds[2]) / 2
center_lat = (bounds[1] + bounds[3]) / 2

print(f"Delhi bounds: {bounds}")
print(f"Center: ({center_lat}, {center_lon})")

# Classify wards into 4 quadrants
def classify_quadrant(lon, lat, center_lon, center_lat):
    """Classify ward into quadrant: NE, NW, SE, SW"""
    if lat >= center_lat and lon >= center_lon:
        return "NE"  # Northeast
    elif lat >= center_lat and lon < center_lon:
        return "NW"  # Northwest
    elif lat < center_lat and lon >= center_lon:
        return "SE"  # Southeast
    else:
        return "SW"  # Southwest

wards['quadrant'] = wards.apply(
    lambda row: classify_quadrant(row['cent_lon'], row['cent_lat'], center_lon, center_lat),
    axis=1
)

# Select one ward from each quadrant (closest to center of that quadrant)
selected_wards = []

for quadrant in ["NE", "NW", "SE", "SW"]:
    quadrant_wards = wards[wards['quadrant'] == quadrant].copy()
    
    # Calculate quadrant center
    quad_bounds = quadrant_wards.total_bounds
    quad_center_lon = (quad_bounds[0] + quad_bounds[2]) / 2
    quad_center_lat = (quad_bounds[1] + quad_bounds[3]) / 2
    
    # Find ward closest to quadrant center
    quadrant_wards['distance_to_center'] = np.sqrt(
        (quadrant_wards['cent_lon'] - quad_center_lon)**2 + 
        (quadrant_wards['cent_lat'] - quad_center_lat)**2
    )
    
    closest_ward = quadrant_wards.nsmallest(1, 'distance_to_center').iloc[0]
    
    selected_wards.append({
        'ward_name': closest_ward['Ward_Name'],
        'ward_no': closest_ward['Ward_No'],
        'latitude': closest_ward['cent_lat'],
        'longitude': closest_ward['cent_lon'],
        'quadrant': quadrant
    })
    
    print(f"\n{quadrant} Quadrant:")
    print(f"  Selected: {closest_ward['Ward_Name']} ({closest_ward['Ward_No']})")
    print(f"  Location: ({closest_ward['cent_lat']:.6f}, {closest_ward['cent_lon']:.6f})")

# Save selected wards to JSON file
output_file = "selected_wards.json"
with open(output_file, 'w') as f:
    json.dump(selected_wards, f, indent=2)

print(f"\n✓ Selected 4 wards saved to {output_file}")
print("\nSelected Wards Summary:")
print("=" * 70)
for ward in selected_wards:
    print(f"{ward['quadrant']}: {ward['ward_name']} ({ward['ward_no']})")
    print(f"  Coordinates: ({ward['latitude']:.6f}, {ward['longitude']:.6f})")
print("=" * 70)
