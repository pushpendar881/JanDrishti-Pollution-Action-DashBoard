import requests
import pandas as pd
import geopandas as gpd
import numpy as np
from shapely.geometry import Point
import folium
from folium import plugins
from branca.colormap import LinearColormap
from branca.element import Template, MacroElement
import time
import os
from datetime import datetime

print("="*70)
print("DELHI AIR QUALITY INTERACTIVE MAP - Enhanced UI/UX")
print("="*70)

# ------------------------------------------------------
# Download Delhi Wards GeoJSON if not present
# ------------------------------------------------------
if not os.path.exists("Delhi_Wards.geojson"):
    print("Downloading Delhi Wards GeoJSON...")
    try:
        url = "https://github.com/datameet/Municipal_Spatial_Data/raw/master/Delhi/Delhi_Wards.geojson"
        response = requests.get(url, timeout=30)
        with open("Delhi_Wards.geojson", "wb") as f:
            f.write(response.content)
        print("✓ Downloaded successfully!")
    except Exception as e:
        print(f"❌ Could not download: {e}")
        exit()

print("Loading Delhi Ward Boundaries...")
wards = gpd.read_file("Delhi_Wards.geojson")
print(f"✓ Loaded {len(wards)} wards")

# Detect name column
name_col = None
for col in ['Ward_Name', 'ward_name', 'name', 'Ward_No', 'ward_no']:
    if col in wards.columns:
        name_col = col
        break
if name_col is None:
    name_col = [c for c in wards.columns if c != 'geometry'][0]

bounds = wards.total_bounds

# ------------------------------------------------------
# WAQI API
# ------------------------------------------------------
WAQI_TOKEN = "62fbeb618094ae4ec793918f91392c3716055dab"

if WAQI_TOKEN == "YOUR_WAQI_TOKEN_HERE":
    print("\n⚠️  ERROR: Please add your WAQI API token!")
    print("Get it at: https://aqicn.org/data-platform/token/")
    exit()

print("\nFetching air quality data...")
latlng_bounds = f"{bounds[1]},{bounds[0]},{bounds[3]},{bounds[2]}"
url = f"https://api.waqi.info/map/bounds/?latlng={latlng_bounds}&token={WAQI_TOKEN}"

try:
    response = requests.get(url)
    data = response.json()
    if data["status"] != "ok":
        print(f"API Error: {data}")
        exit()
    stations_raw = data["data"]
    print(f"✓ Found {len(stations_raw)} stations")
except Exception as e:
    print(f"Error: {e}")
    exit()

# Get detailed data
print("Fetching detailed pollutant data...")
station_data = []

for i, station in enumerate(stations_raw):
    try:
        lat = station["lat"]
        lon = station["lon"]
        aqi = station.get("aqi")
        
        if aqi is None or aqi == "-":
            continue
        
        aqi = float(aqi)
        name = station.get("station", {}).get("name", "Unknown")
        
        detail_url = f"https://api.waqi.info/feed/geo:{lat};{lon}/?token={WAQI_TOKEN}"
        detail_response = requests.get(detail_url)
        detail_data = detail_response.json()
        
        if detail_data["status"] == "ok":
            station_full = detail_data["data"]
            iaqi = station_full.get("iaqi", {})
            time_data = station_full.get("time", {})
            
            station_data.append({
                "name": name,
                "lon": lon,
                "lat": lat,
                "aqi": aqi,
                "pm25": iaqi.get("pm25", {}).get("v"),
                "pm10": iaqi.get("pm10", {}).get("v"),
                "no2": iaqi.get("no2", {}).get("v"),
                "o3": iaqi.get("o3", {}).get("v"),
                "updated": time_data.get("s", "Unknown")
            })
        
        time.sleep(0.1)
        
        if (i + 1) % 10 == 0:
            print(f"  Processed {i+1}/{len(stations_raw)}...")
        print(station_data)
    except Exception as e:
        continue

df_stations = pd.DataFrame(station_data)
print(f"✓ {len(df_stations)} stations with data")
print(f"✓ Average AQI: {df_stations['aqi'].mean():.1f}")

# ------------------------------------------------------
# Spatial Interpolation
# ------------------------------------------------------
print("\nPerforming spatial interpolation...")

wards_projected = wards.to_crs(epsg=32643)
centroids_projected = wards_projected.geometry.centroid
centroids_wgs84 = centroids_projected.to_crs(epsg=4326)
wards['cent_lon'] = centroids_wgs84.x
wards['cent_lat'] = centroids_wgs84.y

def idw_interpolation(target_lon, target_lat, station_lons, station_lats, station_values, power=2):
    distances = np.sqrt((station_lons - target_lon)**2 + (station_lats - target_lat)**2)
    if np.min(distances) < 0.001:
        return station_values[np.argmin(distances)]
    weights = 1 / (distances ** power)
    weights /= weights.sum()
    return np.sum(weights * station_values)

interpolated_aqi = []
for idx, row in wards.iterrows():
    ward_aqi = idw_interpolation(
        row['cent_lon'], row['cent_lat'],
        df_stations['lon'].values, df_stations['lat'].values,
        df_stations['aqi'].values, power=2
    )
    interpolated_aqi.append(ward_aqi)

wards['aqi_interpolated'] = interpolated_aqi

gdf_stations = gpd.GeoDataFrame(
    df_stations, 
    geometry=gpd.points_from_xy(df_stations.lon, df_stations.lat),
    crs="EPSG:4326"
)

joined = gpd.sjoin(gdf_stations, wards, how="left", predicate="intersects")
ward_measured = joined.groupby(name_col)['aqi'].max().reset_index()
ward_measured.columns = [name_col, 'aqi_measured']

wards = wards.merge(ward_measured, on=name_col, how="left")
wards['aqi_final'] = wards['aqi_measured'].fillna(wards['aqi_interpolated'])

wards_for_map = wards.drop(columns=['cent_lon', 'cent_lat'], errors='ignore')

print(f"✓ All {len(wards)} wards now have AQI estimates")

# ------------------------------------------------------
# CREATE ENHANCED MAP
# ------------------------------------------------------
print("\nGenerating enhanced interactive map...")

# Initialize map with better tiles
m = folium.Map(
    location=[28.6139, 77.2090],
    zoom_start=11,
    tiles='CartoDB positron',
    control_scale=True
)

# Add multiple tile layers for user choice
folium.TileLayer('OpenStreetMap', name='Street Map').add_to(m)
folium.TileLayer('CartoDB dark_matter', name='Dark Mode').add_to(m)

# Create enhanced color scale
aqi_min = wards_for_map['aqi_final'].min()
aqi_max = wards_for_map['aqi_final'].max()

color_scale = LinearColormap(
    colors=['#00e400', '#ffff00', '#ff7e00', '#ff0000', '#8f3f97', '#7e0023'],
    vmin=0,
    vmax=500,
    caption='Air Quality Index (AQI)'
)

# Add wards layer with enhanced styling
def style_function(feature):
    aqi_value = feature['properties'].get('aqi_final', 0)
    is_measured = feature['properties'].get('aqi_measured') is not None
    
    return {
        'fillColor': color_scale(aqi_value),
        'fillOpacity': 0.7 if is_measured else 0.5,
        'color': '#000000' if is_measured else '#666666',
        'weight': 1.5 if is_measured else 0.5,
        'dashArray': '0' if is_measured else '3, 3'
    }

def highlight_function(feature):
    return {
        'fillColor': color_scale(feature['properties'].get('aqi_final', 0)),
        'fillOpacity': 0.9,
        'color': '#ffffff',
        'weight': 3
    }

# Custom tooltip styling
tooltip_style = """
    background-color: white;
    border: 2px solid black;
    border-radius: 5px;
    box-shadow: 3px 3px 10px rgba(0,0,0,0.3);
    font-family: Arial, sans-serif;
    padding: 10px;
"""

ward_layer = folium.GeoJson(
    wards_for_map,
    style_function=style_function,
    highlight_function=highlight_function,
    tooltip=folium.GeoJsonTooltip(
        fields=[name_col, 'aqi_final', 'aqi_measured'],
        aliases=['<b>Ward</b>', '<b>AQI</b>', '<b>Measured</b>'],
        localize=True,
        sticky=False,
        style=tooltip_style
    ),
    name='Ward AQI'
)
ward_layer.add_to(m)

# Add enhanced station markers
marker_cluster = plugins.MarkerCluster(name='Monitoring Stations').add_to(m)

for _, row in df_stations.iterrows():
    aqi = row['aqi']
    
    # Determine color and category
    if aqi <= 50:
        color = '#00e400'
        category = 'Good'
        icon = 'smile'
    elif aqi <= 100:
        color = '#ffff00'
        category = 'Satisfactory'
        icon = 'meh'
    elif aqi <= 200:
        color = '#ff7e00'
        category = 'Moderate'
        icon = 'frown'
    elif aqi <= 300:
        color = '#ff0000'
        category = 'Poor'
        icon = 'sad-tear'
    elif aqi <= 400:
        color = '#8f3f97'
        category = 'Very Poor'
        icon = 'dizzy'
    else:
        color = '#7e0023'
        category = 'Severe'
        icon = 'skull'
    
    # Enhanced popup
    popup_html = f"""
    <div style="font-family: Arial; width: 280px; padding: 10px;">
        <h4 style="margin: 0 0 10px 0; color: #333; border-bottom: 2px solid {color};">
            📍 {row['name']}
        </h4>
        <div style="background: {color}; color: white; padding: 10px; border-radius: 5px; margin: 10px 0; text-align: center;">
            <div style="font-size: 32px; font-weight: bold;">{aqi:.0f}</div>
            <div style="font-size: 14px;">{category}</div>
        </div>
        <table style="width: 100%; font-size: 12px;">
            <tr><td><b>PM2.5:</b></td><td>{row['pm25']:.1f} µg/m³</td></tr>
            <tr><td><b>PM10:</b></td><td>{row['pm10']:.1f} µg/m³</td></tr>
        </table>
        <div style="margin-top: 10px; font-size: 10px; color: #666;">
            Updated: {row['updated']}
        </div>
    </div>
    """ if pd.notna(row['pm25']) else f"""
    <div style="font-family: Arial; width: 200px;">
        <h4>{row['name']}</h4>
        <p style="font-size: 24px; color: {color};"><b>AQI: {aqi:.0f}</b></p>
        <p>{category}</p>
    </div>
    """
    
    folium.CircleMarker(
        location=[row['lat'], row['lon']],
        radius=10,
        popup=folium.Popup(popup_html, max_width=300),
        tooltip=f"<b>{row['name']}</b><br>AQI: {aqi:.0f}",
        color='white',
        fill=True,
        fillColor=color,
        fillOpacity=0.9,
        weight=2
    ).add_to(marker_cluster)

color_scale.add_to(m)

# Add fullscreen button
plugins.Fullscreen(
    position='topright',
    title='Fullscreen',
    title_cancel='Exit Fullscreen',
    force_separate_button=True
).add_to(m)

# Add locate control
plugins.LocateControl(auto_start=False).add_to(m)

# Add layer control
folium.LayerControl(position='topright', collapsed=False).add_to(m)

# Add custom info panel
info_html = f"""
<div style="position: fixed; 
            top: 10px; left: 60px; 
            width: 350px; 
            background-color: rgba(255, 255, 255, 0.95); 
            border: 3px solid #333;
            border-radius: 10px;
            z-index: 9999; 
            padding: 15px;
            box-shadow: 5px 5px 20px rgba(0,0,0,0.3);
            font-family: Arial, sans-serif;">
    
    <h3 style="margin: 0 0 10px 0; color: #333; border-bottom: 2px solid #ff7e00;">
        🌍 Delhi Air Quality Monitor
    </h3>
    
    <div style="font-size: 13px; margin: 10px 0;">
        <b>📊 Live Statistics:</b><br>
        • Total Wards: {len(wards)}<br>
        • Monitoring Stations: {len(df_stations)}<br>
        • Average AQI: <span style="color: {color_scale(df_stations['aqi'].mean())}; font-weight: bold;">
            {df_stations['aqi'].mean():.1f}
        </span><br>
        • Last Updated: {datetime.now().strftime('%Y-%m-%d %H:%M')}
    </div>
    
    <div style="font-size: 11px; margin: 10px 0; padding: 8px; background: #f0f0f0; border-radius: 5px;">
        <b>💡 How to use:</b><br>
        • Hover over wards for AQI info<br>
        • Click markers for detailed data<br>
        • Solid borders = measured stations<br>
        • Dashed borders = interpolated data
    </div>
    
    <div style="font-size: 10px; color: #666; margin-top: 10px; text-align: center;">
        Data: WAQI.info • CPCB India
    </div>
</div>
"""

m.get_root().html.add_child(folium.Element(info_html))

# Add search functionality
plugins.Geocoder(collapsed=True, position='topleft').add_to(m)

# Add measurement tool
plugins.MeasureControl(position='bottomleft', primary_length_unit='kilometers').add_to(m)

# Save map
m.save("delhi_aqi_enhanced.html")

print("\n" + "="*70)
print("✅ ENHANCED MAP CREATED SUCCESSFULLY!")
print("="*70)
print(f"📁 File: delhi_aqi_enhanced.html")
print(f"📊 Total Wards: {len(wards)}")
print(f"🎯 Monitoring Stations: {len(df_stations)}")
print(f"🌡️  Average AQI: {df_stations['aqi'].mean():.1f}")
print("="*70)
print("\n🚀 Open delhi_aqi_enhanced.html in your browser!")
print("\n✨ New Features:")
print("   • Multiple map themes (Street, Dark Mode)")
print("   • Fullscreen mode")
print("   • Location finder")
print("   • Distance measurement tool")
print("   • Search locations")
print("   • Clustered markers for better performance")
print("   • Enhanced tooltips and popups")
print("   • Live statistics dashboard")
print("="*70)