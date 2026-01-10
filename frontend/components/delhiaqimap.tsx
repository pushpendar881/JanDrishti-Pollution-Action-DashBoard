'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { RefreshCw, Maximize2, Minimize2, Search, X, Layers2, MapPin, ZoomIn, ZoomOut, RotateCcw, Clock, AlertCircle, CheckCircle2, Loader2, Info, TrendingUp, TrendingDown, Activity, BarChart3, Filter, Eye, EyeOff, HelpCircle, Download, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Import Leaflet CSS - must be done at top level for Next.js to process
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// Leaflet will be loaded dynamically on client side

interface Station {
  station: string;
  lat: number;
  lon: number;
  aqi: number;
  pm25?: number;
  pm10?: number;
  no2?: number;
  so2?: number;
  o3?: number;
  co?: number;
  temperature?: number;
  humidity?: number;
  updated?: string;
  pollutants?: any;
}

interface Ward {
  type: string;
  properties: {
    [key: string]: any;
  };
  geometry: {
    type: string;
    coordinates: any[];
  };
}

interface FeatureCollection {
  type: string;
  features: Ward[];
}

interface Summary {
  total_wards?: number;
  total_stations?: number;
  avg_aqi?: number;
  max_aqi?: number;
  min_aqi?: number;
}

const DelhiAQIMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const wardLayerRef = useRef<any>(null);
  const markerClusterRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [wards, setWards] = useState<FeatureCollection | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showWards, setShowWards] = useState(true);
  const [showStations, setShowStations] = useState(true);
  const [selectedLayer, setSelectedLayer] = useState('osm');
  const [searchResults, setSearchResults] = useState<Array<{ name: string; lat: number; lon: number; type: 'ward' | 'station' }>>([]);
  const [showInfoPanel, setShowInfoPanel] = useState(true);
  const [selectedWard, setSelectedWard] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [aqiRange, setAqiRange] = useState<[number, number]>([0, 1000]);
  const [showTooltips, setShowTooltips] = useState(true);

  // Get AQI color based on value
  const getAQIColor = useCallback((aqi: number): string => {
    if (aqi <= 50) return '#00e400';
    if (aqi <= 100) return '#ffff00';
    if (aqi <= 200) return '#ff7e00';
    if (aqi <= 300) return '#ff0000';
    if (aqi <= 400) return '#8f3f97';
    return '#7e0023';
  }, []);

  // Get AQI category
  const getAQICategory = useCallback((aqi: number): string => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Satisfactory';
    if (aqi <= 200) return 'Moderate';
    if (aqi <= 300) return 'Poor';
    if (aqi <= 400) return 'Very Poor';
    return 'Severe';
  }, []);

  // Fetch data from backend
  const fetchData = useCallback(async (isRefresh = false) => {
    console.log('🔄 fetchData called', { isRefresh });
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
      setLoading(true);
      }
      setError(null);
      
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      console.log('📡 Fetching from:', `${backendUrl}/api/delhi-aqi`);
      
      const response = await fetch(`${backendUrl}/api/delhi-aqi`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('❌ Backend error response:', errorText);
        throw new Error(`Backend error: ${response.status} ${response.statusText}. ${errorText}`);
      }
      
      // Clone response to read it multiple times if needed
      const responseClone = response.clone();
      const data = await response.json().catch(async (err) => {
        console.error('❌ JSON parse error:', err);
        const text = await responseClone.text().catch(() => 'Unable to read response');
        console.error('Response text:', text.substring(0, 500));
        throw new Error('Failed to parse response as JSON');
      });
      
      if (!data) {
        throw new Error('Empty response from backend');
      }
      
      console.log('📥 Received data from backend:', {
        hasWards: !!data.wards,
        hasStations: !!data.stations,
        hasSummary: !!data.summary,
        dataKeys: Object.keys(data)
      });
      
      // Handle wards data
      console.log('📊 Raw data received:', {
        hasWards: !!data.wards,
        wardsType: typeof data.wards,
        hasFeatures: !!(data.wards && data.wards.features),
        featuresType: data.wards?.features ? typeof data.wards.features : 'N/A',
        isArray: Array.isArray(data.wards?.features),
        featuresLength: data.wards?.features?.length || 0
      });
      
      if (data.wards && data.wards.features && Array.isArray(data.wards.features)) {
        console.log(`✅ Loaded ${data.wards.features.length} wards`);
        if (data.wards.features.length > 0) {
          console.log('Sample ward:', data.wards.features[0]);
          console.log('Ward properties:', data.wards.features[0].properties);
        }
        setWards(data.wards);
      } else {
        console.warn('⚠️ No ward data in response or invalid format', {
          data,
          wards: data.wards,
          features: data.wards?.features,
          isArray: Array.isArray(data.wards?.features)
        });
        setWards(null);
      }
      
      // Handle stations data
      console.log('📊 Stations data check:', {
        hasStations: !!data.stations,
        stationsType: typeof data.stations,
        isArray: Array.isArray(data.stations),
        stationsLength: data.stations?.length || 0
      });
      
      if (data.stations && Array.isArray(data.stations)) {
        const formattedStations = data.stations
          .filter((st: any) => st && typeof st === 'object')
          .map((st: any) => {
            try {
              return {
                station: st.name || 'Unknown',
                lat: typeof st.lat === 'number' ? st.lat : 0,
                lon: typeof st.lon === 'number' ? st.lon : 0,
                aqi: typeof st.aqi === 'number' ? st.aqi : 0,
                pm25: st.pollutants?.pm25 ?? undefined,
                pm10: st.pollutants?.pm10 ?? undefined,
                no2: st.pollutants?.no2 ?? undefined,
                so2: st.pollutants?.so2 ?? undefined,
                o3: st.pollutants?.o3 ?? undefined,
                co: st.pollutants?.co ?? undefined,
                temperature: st.pollutants?.temperature ?? undefined,
                humidity: st.pollutants?.humidity ?? undefined,
                updated: st.updated || undefined,
                pollutants: st.pollutants || {},
              };
            } catch (e) {
              console.warn('Error formatting station:', st, e);
              return null;
            }
          })
          .filter((st: Station | null): st is Station => st !== null);
        
        console.log(`✅ Loaded ${formattedStations.length} stations`);
        if (formattedStations.length > 0) {
          console.log('Sample station:', formattedStations[0]);
        }
        setStations(formattedStations);
      } else {
        console.warn('⚠️ No station data in response or invalid format');
        setStations([]);
      }
      
      // Handle summary data
      if (data.summary && typeof data.summary === 'object') {
        setSummary(data.summary);
      } else {
        setSummary(null);
      }
      
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch AQI data';
      // Only log to console if not a network error (to avoid noise)
      if (!errorMsg.includes('Failed to fetch') && !errorMsg.includes('NetworkError')) {
        console.error('Error fetching AQI data:', errorMsg, err);
      }
      setError(errorMsg);
      
      // Don't clear existing data on error if we're refreshing
      if (!isRefresh) {
        setWards(null);
        setStations([]);
        setSummary(null);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Trigger AQI recomputation
  const triggerRecompute = useCallback(async () => {
    try {
      setRefreshing(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      // Try to call Supabase Edge Function first (if configured)
      if (supabaseUrl && supabaseAnonKey) {
        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/trigger-aqi-recompute`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseAnonKey}`,
            },
          });
          
          if (response.ok) {
            // Wait a bit for processing, then fetch new data
            setTimeout(() => {
              fetchData(true);
            }, 5000);
        return;
          }
        } catch (e) {
          console.warn('Edge function not available, calling backend directly');
        }
      }
      
      // Fallback to direct backend call
      const response = await fetch(`${backendUrl}/api/admin/recompute-aqi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        setTimeout(() => {
          fetchData(true);
        }, 3000);
      } else {
        throw new Error('Failed to trigger recomputation');
      }
    } catch (err) {
      console.error('Error triggering recomputation:', err);
      setError('Failed to trigger data refresh');
      setRefreshing(false);
    }
  }, [fetchData]);

  // Load Leaflet on client side
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const loadLeaflet = async () => {
      try {
        // CSS is imported at top level, Next.js will handle it
        
        // Import Leaflet first
        const leaflet = await import('leaflet');
        leafletRef.current = leaflet.default;
        const L = leafletRef.current;
        
        // Fix for default marker icons in Next.js
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
        
        // Import marker cluster AFTER Leaflet is loaded
        // leaflet.markercluster extends Leaflet's L namespace
        await import('leaflet.markercluster');
        // After import, L.markerClusterGroup will be available
        // Verify it's available
        if (!L.markerClusterGroup) {
          console.error('❌ markerClusterGroup not available on L namespace');
        } else {
          console.log('✅ MarkerClusterGroup loaded successfully');
        }
        
        setLeafletLoaded(true);
        console.log('✅ Leaflet loaded successfully');
      } catch (error) {
        console.error('❌ Error loading Leaflet:', error);
      }
    };
    
    loadLeaflet();
  }, []);

  // Initialize map
  useEffect(() => {
    if (typeof window === 'undefined' || !leafletLoaded || !leafletRef.current) return;
    
    const L = leafletRef.current;
    console.log('🗺️ Initializing map...', {
      hasContainer: !!mapContainer.current,
      hasMap: !!map.current,
      containerDimensions: mapContainer.current ? {
        width: mapContainer.current.offsetWidth,
        height: mapContainer.current.offsetHeight
      } : null
    });
    
    if (mapContainer.current && !map.current) {
      console.log('✅ Creating Leaflet map instance');
      map.current = L.map(mapContainer.current, {
        zoomControl: false,
        attributionControl: true,
      }).setView([28.6139, 77.209], 11);
      
      console.log('✅ Map created successfully');

      // Add zoom control in a specific position
      L.control.zoom({
        position: 'bottomright'
      }).addTo(map.current);

      // Create base layers
      const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '©️ OpenStreetMap contributors',
        maxZoom: 19,
      });

      const cartoLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '©️ CartoDB',
        maxZoom: 19,
      });

      const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '©️ CartoDB',
        maxZoom: 19,
      });

      // Add default layer
      osmLayer.addTo(map.current);

      // Store layers for switching
      (map.current as any).layers = { osm: osmLayer, carto: cartoLayer, dark: darkLayer };

      // Add scale control
      L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map.current);
    }
    
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [leafletLoaded]);

  // Switch base layer
  const switchLayer = useCallback((layerName: string) => {
    if (!map.current) return;
    const layers = (map.current as any).layers;
    if (!layers) return;

    Object.values(layers).forEach((layer: any) => {
      map.current?.removeLayer(layer);
    });

    if (layers[layerName]) {
      map.current.addLayer(layers[layerName]);
      setSelectedLayer(layerName);
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    console.log('🗺️ DelhiAQIMap component mounted, fetching data...');
    console.log('Map container:', mapContainer.current);
    console.log('Backend URL:', process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000');
    fetchData();
  }, [fetchData]);

  // Search functionality
  const handleSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const results: Array<{ name: string; lat: number; lon: number; type: 'ward' | 'station' }> = [];
    const lowerQuery = query.toLowerCase();

    // Search in wards
    if (wards) {
      wards.features.forEach((feature) => {
        const wardName = feature.properties.Ward_Name || feature.properties.Ward_No || feature.properties.name || '';
        if (wardName.toLowerCase().includes(lowerQuery)) {
          // Get centroid of polygon
          const coords = feature.geometry.coordinates[0];
          const lats = coords.map((c: number[]) => c[1]);
          const lons = coords.map((c: number[]) => c[0]);
          const lat = lats.reduce((a: number, b: number) => a + b) / lats.length;
          const lon = lons.reduce((a: number, b: number) => a + b) / lons.length;
          results.push({ name: wardName, lat, lon, type: 'ward' });
        }
      });
    }

    // Search in stations
    stations.forEach((station) => {
      if (station.station.toLowerCase().includes(lowerQuery)) {
        results.push({ name: station.station, lat: station.lat, lon: station.lon, type: 'station' });
      }
    });

    setSearchResults(results.slice(0, 10));
  }, [wards, stations]);

  // Handle search input
  useEffect(() => {
    if (searchQuery) {
      handleSearch(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, handleSearch]);

  // Fly to location
  const flyToLocation = useCallback((lat: number, lon: number) => {
    if (map.current) {
      map.current.flyTo([lat, lon], 14, {
        animate: true,
        duration: 1.5,
      });
      setShowSearch(false);
      setSearchQuery('');
    }
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!mapContainer.current) return;

    if (!isFullscreen) {
      if (mapContainer.current.requestFullscreen) {
        mapContainer.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (map.current) {
        setTimeout(() => {
          map.current?.invalidateSize();
        }, 100);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Add ward boundaries to map
  useEffect(() => {
    if (!map.current || !wards || !showWards || !leafletLoaded || !leafletRef.current) {
      // Remove existing ward layer if wards are hidden or not available
      if (wardLayerRef.current && map.current) {
        map.current.removeLayer(wardLayerRef.current);
        wardLayerRef.current = null;
      }
      return;
    }

    try {
      // Remove existing ward layer
      if (wardLayerRef.current && map.current) {
        map.current.removeLayer(wardLayerRef.current);
      }

      if (!wards.features || !Array.isArray(wards.features) || wards.features.length === 0) {
        console.warn('⚠️ No valid ward features to render', {
          wards,
          hasFeatures: !!wards.features,
          isArray: Array.isArray(wards.features),
          length: wards.features?.length
        });
        return;
      }

      const L = leafletRef.current;
      if (!L || !L.geoJSON) {
        console.warn('⚠️ Leaflet not loaded yet');
        return;
      }
      
      console.log(`🗺️ Rendering ${wards.features.length} ward boundaries on map`);
      console.log('Sample ward before rendering:', {
        type: wards.features[0]?.type,
        hasGeometry: !!wards.features[0]?.geometry,
        hasProperties: !!wards.features[0]?.properties,
        properties: wards.features[0]?.properties
      });
      
      // Ensure wards is a valid GeoJSON FeatureCollection
      const geoJsonData = {
        type: wards.type || 'FeatureCollection',
        features: wards.features
      };
      
      const wardLayer = L.geoJSON(geoJsonData as any, {
        style: (feature?: any) => {
          const aqiValue = feature?.properties?.avg_aqi || 0;
          const stationCount = feature?.properties?.station_count || 0;
          const hasData = stationCount > 0;
          
          // Always show wards, even if no data
          const fillColor = aqiValue > 0 ? getAQIColor(aqiValue) : '#cccccc';
          const fillOpacity = aqiValue > 0 ? (hasData ? 0.7 : 0.5) : 0.3;

          return {
            fillColor: fillColor,
            fillOpacity: fillOpacity,
            color: '#000000',  // Always use dark borders for visibility
            weight: 3,  // Consistent border width
            opacity: 1,  // Full opacity for borders
            dashArray: hasData ? '' : '5, 5',
            lineCap: 'round',
            lineJoin: 'round',
          };
        },
        onEachFeature: (feature: any, layer: any) => {
          const props = feature.properties;
          const wardName = props.Ward_Name || props.Ward_No || props.name || 'Unknown Ward';
          const aqiValue = props.avg_aqi?.toFixed(1) || 'N/A';
          const stationCount = props.station_count || 0;
          const category = props.category || getAQICategory(props.avg_aqi || 0);

          const popupContent = `
            <div style="font-family: system-ui, -apple-system, sans-serif; width: 300px; padding: 16px;">
              <h4 style="margin: 0 0 12px 0; color: #1a1a1a; border-bottom: 3px solid ${getAQIColor(
                props.avg_aqi || 0
              )}; padding-bottom: 8px; font-size: 16px;">
                📍 ${wardName}
              </h4>
              <div style="background: ${getAQIColor(
                props.avg_aqi || 0
              )}; color: white; padding: 16px; border-radius: 8px; margin: 12px 0; text-align: center; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="font-size: 42px; margin-bottom: 8px; font-weight: 700;">${aqiValue}</div>
                <div style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">${category}</div>
              </div>
              <table style="width: 100%; font-size: 13px; border-collapse: collapse; margin: 12px 0;">
                <tr style="background: #f8f9fa;">
                  <td style="padding: 8px; font-weight: 600;">Monitoring Stations:</td>
                  <td style="padding: 8px; text-align: right;">${stationCount}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: 600;">Max AQI:</td>
                  <td style="padding: 8px; text-align: right; color: #dc2626;">${props.max_aqi?.toFixed(1) || 'N/A'}</td>
                </tr>
                <tr style="background: #f8f9fa;">
                  <td style="padding: 8px; font-weight: 600;">Min AQI:</td>
                  <td style="padding: 8px; text-align: right; color: #16a34a;">${props.min_aqi?.toFixed(1) || 'N/A'}</td>
                </tr>
              </table>
              <div style="font-size: 11px; color: #6b7280; margin-top: 12px; border-top: 1px solid #e5e7eb; padding-top: 12px; text-align: center;">
                ${stationCount > 0 ? '✅ Based on measured data' : '⚠️ Estimated from nearby stations'}
              </div>
            </div>
          `;

          layer.bindPopup(popupContent, { maxWidth: 320 });
          
          // Add click handler to open ward details in new page
          layer.on('click', function(e) {
            const wardId = props.Ward_No || props.Ward_Name || props.name || 'unknown';
            const wardName = props.Ward_Name || props.Ward_No || props.name || 'Unknown Ward';
            // Store selected ward for info panel
            setSelectedWard({ id: wardId, name: wardName, properties: props });
            // Open ward details in new page
            window.open(`/ward/${encodeURIComponent(wardId)}?name=${encodeURIComponent(wardName)}`, '_blank');
          });
          
          // Change cursor to pointer on hover
          layer.on('mouseover', function(e) {
            this.setStyle({
              weight: 6,
              opacity: 1,
              fillOpacity: 0.85,
              color: '#000000',
            });
            // Change cursor
            if (map.current) {
              map.current.getContainer().style.cursor = 'pointer';
            }
          });
          
          layer.on('mouseout', function() {
            wardLayer.resetStyle(this);
            if (map.current) {
              map.current.getContainer().style.cursor = '';
            }
          });
        },
      });

      wardLayer.addTo(map.current);
      wardLayerRef.current = wardLayer;
      
      // Fit map to show all wards
      try {
        const bounds = wardLayer.getBounds();
        if (bounds.isValid()) {
          map.current.fitBounds(bounds, { padding: [50, 50] });
          console.log('✅ Map fitted to ward boundaries');
        }
      } catch (e) {
        console.warn('Could not fit bounds:', e);
      }
    } catch (err) {
      console.error('❌ Error rendering ward boundaries:', err);
      console.error('Error details:', {
        error: err,
        wards: wards,
        mapInitialized: !!map.current,
        showWards: showWards
      });
      setError(`Failed to render ward boundaries: ${err instanceof Error ? err.message : String(err)}`);
    }

      return () => {
      try {
        if (wardLayerRef.current && map.current) {
          map.current.removeLayer(wardLayerRef.current);
          wardLayerRef.current = null;
        }
      } catch (err) {
        console.error('Error cleaning up ward layer:', err);
      }
    };
  }, [wards, showWards, getAQIColor, getAQICategory, leafletLoaded]);

  // Add station markers to map
  useEffect(() => {
    if (!map.current || !showStations || !leafletLoaded || !leafletRef.current) {
      // Remove existing markers if stations are hidden
      if (markerClusterRef.current && map.current) {
        map.current.removeLayer(markerClusterRef.current);
        markerClusterRef.current = null;
      }
      return;
    }

    if (stations.length === 0) {
      // Remove existing markers if no stations
      if (markerClusterRef.current && map.current) {
        map.current.removeLayer(markerClusterRef.current);
        markerClusterRef.current = null;
      }
      return;
    }

    try {
      // Remove existing markers
      if (markerClusterRef.current && map.current) {
        map.current.removeLayer(markerClusterRef.current);
      }

      const L = leafletRef.current;
      
      if (!L || !L.markerClusterGroup) {
        console.warn('⚠️ Leaflet or MarkerClusterGroup not loaded yet', {
          hasL: !!L,
          hasMarkerClusterGroup: !!(L && L.markerClusterGroup)
        });
        return;
      }
      
      // L.markerClusterGroup is a factory function, not a constructor
      const markerClusterGroup = L.markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: true,
        zoomToBoundsOnClick: true,
        iconCreateFunction: (cluster: any) => {
          const childCount = cluster.getChildCount();
          let size = 'small';
          if (childCount >= 100) size = 'large';
          else if (childCount >= 10) size = 'medium';
          
          return new L.DivIcon({
            html: `<div style="background: rgba(56, 189, 248, 0.9); color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"><span>${childCount}</span></div>`,
            className: 'marker-cluster',
            iconSize: L.point(40, 40),
          });
        },
      });

      stations.forEach((station) => {
        const color = getAQIColor(station.aqi);
        const category = getAQICategory(station.aqi);

        const markerIcon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="
              background: ${color};
              width: 45px;
              height: 45px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 14px;
              border: 4px solid white;
              box-shadow: 0 3px 12px rgba(0,0,0,0.5);
              cursor: pointer;
              transition: transform 0.2s;
            " onmouseover="this.style.transform='scale(1.3)'; this.style.zIndex='1000';" onmouseout="this.style.transform='scale(1)'; this.style.zIndex='auto';">
              ${Math.round(station.aqi)}
            </div>
          `,
          iconSize: [45, 45],
          iconAnchor: [22, 22],
          popupAnchor: [0, -22],
        });

        const pollutants = station.pollutants || {};
        const formatPollutant = (value: any): string => {
          if (value === null || value === undefined || typeof value !== 'number') return 'N/A';
          return value.toFixed(1);
        };
        
        // Format pollutants before using in template string
        const pm25 = formatPollutant(pollutants.pm25);
        const pm10 = formatPollutant(pollutants.pm10);
        const no2 = formatPollutant(pollutants.no2);
        const so2 = formatPollutant(pollutants.so2);
        const o3 = formatPollutant(pollutants.o3);
        const co = formatPollutant(pollutants.co);

        const popupContent = `
          <div style="font-family: system-ui, -apple-system, sans-serif; width: 320px; padding: 16px;">
            <h4 style="margin: 0 0 12px 0; color: #1a1a1a; border-bottom: 3px solid ${color}; padding-bottom: 8px; font-size: 16px; display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 20px;">📍</span> ${station.station || 'Unknown Station'}
            </h4>
            <div style="background: ${color}; color: white; padding: 16px; border-radius: 8px; margin: 12px 0; text-align: center; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <div style="font-size: 42px; margin-bottom: 8px; font-weight: 700;">${Math.round(station.aqi || 0)}</div>
              <div style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">${category}</div>
            </div>
            <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; margin: 12px 0;">
              <div style="font-size: 12px; font-weight: 700; color: #6b7280; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Pollutant Levels</div>
            <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                ${pollutants.pm25 != null ? `<tr><td style="padding: 6px; font-weight: 600;">PM2.5:</td><td style="padding: 6px; text-align: right;">${pm25} µg/m³</td></tr>` : ''}
                ${pollutants.pm10 != null ? `<tr style="background: white;"><td style="padding: 6px; font-weight: 600;">PM10:</td><td style="padding: 6px; text-align: right;">${pm10} µg/m³</td></tr>` : ''}
                ${pollutants.no2 != null ? `<tr><td style="padding: 6px; font-weight: 600;">NO₂:</td><td style="padding: 6px; text-align: right;">${no2} µg/m³</td></tr>` : ''}
                ${pollutants.so2 != null ? `<tr style="background: white;"><td style="padding: 6px; font-weight: 600;">SO₂:</td><td style="padding: 6px; text-align: right;">${so2} µg/m³</td></tr>` : ''}
                ${pollutants.o3 != null ? `<tr><td style="padding: 6px; font-weight: 600;">O₃:</td><td style="padding: 6px; text-align: right;">${o3} µg/m³</td></tr>` : ''}
                ${pollutants.co != null ? `<tr style="background: white;"><td style="padding: 6px; font-weight: 600;">CO:</td><td style="padding: 6px; text-align: right;">${co} µg/m³</td></tr>` : ''}
            </table>
            </div>
            ${station.updated ? `<div style="font-size: 11px; color: #6b7280; margin-top: 12px; border-top: 1px solid #e5e7eb; padding-top: 12px; text-align: center;">
              🕐 Updated: ${new Date(station.updated).toLocaleString()}
            </div>` : ''}
          </div>
        `;

        const marker = L.marker([station.lat, station.lon], { icon: markerIcon } as any)
          .bindPopup(popupContent, { maxWidth: 340 });

        // Add click handler to open station details (optional - can be implemented later)
        marker.on('click', function(e) {
          // You can add station detail page navigation here if needed
          console.log('Station clicked:', station.station);
        });

        markerClusterGroup.addLayer(marker);
      });

      markerClusterGroup.addTo(map.current);
      markerClusterRef.current = markerClusterGroup;
      console.log(`✅ Rendered ${stations.length} station markers`);
    } catch (err) {
      console.error('❌ Error rendering station markers:', err);
      setError('Failed to render station markers on map');
    }

      return () => {
      try {
        if (markerClusterRef.current && map.current) {
          map.current.removeLayer(markerClusterRef.current);
          markerClusterRef.current = null;
        }
      } catch (err) {
        console.error('Error cleaning up marker cluster:', err);
      }
    };
  }, [stations, showStations, getAQIColor, getAQICategory, leafletLoaded]);

  // Invalidate map size on container resize
  useEffect(() => {
    if (!map.current) return;
    
    const resizeObserver = new ResizeObserver(() => {
      map.current?.invalidateSize();
    });
    
    if (mapContainer.current) {
      resizeObserver.observe(mapContainer.current);
    }
    
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col" style={{ position: 'relative' }}>
      {/* Loading Overlay */}
      <AnimatePresence>
      {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center flex-col gap-4"
          >
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading AQI data...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="absolute top-0 left-0 right-0 z-40 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 p-3 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar - Repositioned to account for info panel */}
      <div className={`absolute top-4 right-4 z-30 flex flex-wrap items-start gap-2 transition-all left-4 ${showInfoPanel ? 'md:left-[21rem]' : 'md:left-4'}`}>
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[280px] max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search wards or stations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearch(true)}
              className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search Results */}
          {showSearch && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-50"
            >
              {searchResults.map((result, idx) => (
                <button
                  key={idx}
                  onClick={() => flyToLocation(result.lat, result.lon)}
                  className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 last:border-0 transition-colors"
                >
                  {result.type === 'ward' ? (
                    <Layers2 className="w-4 h-4 text-primary flex-shrink-0" />
                  ) : (
                    <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{result.name}</span>
                  <span className="ml-auto text-xs text-slate-400 uppercase">{result.type}</span>
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={triggerRecompute}
            disabled={refreshing}
            className="px-4 py-2.5 bg-primary text-primary-foreground border border-primary/20 rounded-xl text-sm font-semibold shadow-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            title="Refresh AQI data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <div className="relative group">
            <button
              onClick={() => switchLayer(selectedLayer === 'osm' ? 'carto' : selectedLayer === 'carto' ? 'dark' : 'osm')}
              className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 shadow-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
              title={`Current: ${selectedLayer === 'osm' ? 'OpenStreetMap' : selectedLayer === 'carto' ? 'Carto Light' : 'Dark Mode'}. Click to change.`}
            >
              <Layers2 className="w-4 h-4" />
              <span className="hidden sm:inline">{selectedLayer === 'osm' ? 'OSM' : selectedLayer === 'carto' ? 'Light' : 'Dark'}</span>
            </button>
          </div>

          <button
            onClick={toggleFullscreen}
            className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 shadow-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Full'}</span>
          </button>

          {/* Zoom Controls */}
          <div className="flex flex-col gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-1">
            <button
              onClick={() => map.current?.zoomIn()}
              className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
            <div className="h-px bg-slate-200 dark:bg-slate-700 mx-1" />
            <button
              onClick={() => map.current?.zoomOut()}
              className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <AnimatePresence>
        {showInfoPanel && summary && (
          <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            className="absolute top-4 left-4 z-30 w-80 max-w-[calc(100%-2rem)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden hidden md:block"
          >
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-primary/10 to-primary/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/20 rounded-xl">
                    <BarChart3 className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">AQI Summary</h3>
                </div>
                <button
                  onClick={() => setShowInfoPanel(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="Hide info panel"
                >
                  <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </button>
              </div>
              {lastUpdated && (
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Last updated: {lastUpdated.toLocaleString()}
                </p>
              )}
            </div>
            
            <div className="p-5 space-y-4">
              {/* Average AQI */}
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Average AQI</span>
                  <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">{summary.avg_aqi?.toFixed(1) || 'N/A'}</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                    {summary.avg_aqi ? getAQICategory(summary.avg_aqi) : 'N/A'}
                  </span>
                </div>
                <div className="mt-2 h-2 bg-blue-200 dark:bg-blue-900/30 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((summary.avg_aqi || 0) / 500 * 100, 100)}%`,
                      backgroundColor: summary.avg_aqi ? getAQIColor(summary.avg_aqi) : '#cccccc'
                    }}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">Max AQI</div>
                  <div className="text-xl font-bold text-red-600 dark:text-red-400">{summary.max_aqi?.toFixed(0) || 'N/A'}</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">Min AQI</div>
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">{summary.min_aqi?.toFixed(0) || 'N/A'}</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">Wards</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white">{summary.total_wards || 0}</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">Stations</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white">{summary.total_stations || 0}</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => {
                    if (map.current) {
                      map.current.setView([28.6139, 77.209], 11);
                    }
                  }}
                  className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset View
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Info Panel Button */}
      {!showInfoPanel && (
        <button
          onClick={() => setShowInfoPanel(true)}
          className="absolute top-4 left-4 z-30 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
          title="Show info panel"
        >
          <Info className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          <span className="hidden sm:inline text-sm font-medium text-slate-700 dark:text-slate-300">Info</span>
        </button>
      )}

      {/* Layer Controls */}
      <div className="absolute bottom-4 left-4 z-30 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-xl max-w-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Layers</div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Toggle filters"
          >
            <Filter className={`w-4 h-4 text-slate-500 dark:text-slate-400 ${showFilters ? 'text-primary' : ''}`} />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <input
              type="checkbox"
              checked={showWards}
              onChange={(e) => setShowWards(e.target.checked)}
              className="w-4 h-4 text-primary rounded border-slate-300 dark:border-slate-600 focus:ring-primary"
            />
            <Layers2 className={`w-4 h-4 ${showWards ? 'text-primary' : 'text-slate-400'}`} />
            <span className="text-slate-700 dark:text-slate-300 font-medium">Ward Boundaries</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <input
              type="checkbox"
              checked={showStations}
              onChange={(e) => setShowStations(e.target.checked)}
              className="w-4 h-4 text-primary rounded border-slate-300 dark:border-slate-600 focus:ring-primary"
            />
            <MapPin className={`w-4 h-4 ${showStations ? 'text-primary' : 'text-slate-400'}`} />
            <span className="text-slate-700 dark:text-slate-300 font-medium">Monitoring Stations</span>
          </label>
        </div>
        
        {/* AQI Range Filter */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700"
          >
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">AQI Range</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <input
                  type="number"
                  value={aqiRange[0]}
                  onChange={(e) => setAqiRange([Number(e.target.value), aqiRange[1]])}
                  className="w-20 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300"
                  placeholder="Min"
                  min="0"
                  max="1000"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="number"
                  value={aqiRange[1]}
                  onChange={(e) => setAqiRange([aqiRange[0], Number(e.target.value)])}
                  className="w-20 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300"
                  placeholder="Max"
                  min="0"
                  max="1000"
                />
              </div>
              <button
                onClick={() => setAqiRange([0, 1000])}
                className="w-full px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Reset Filter
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Selected Ward Info Panel */}
      <AnimatePresence>
        {selectedWard && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="absolute top-4 right-4 z-30 w-80 max-w-[calc(100%-2rem)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[calc(100vh-8rem)] overflow-y-auto"
          >
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-primary/10 to-primary/5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  {selectedWard.name}
                </h3>
                <button
                  onClick={() => setSelectedWard(null)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Click ward on map for details</p>
            </div>
            <div className="p-5 space-y-4">
              {selectedWard.properties && (
                <>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Current AQI</div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-3xl font-bold text-slate-900 dark:text-white">
                        {selectedWard.properties.avg_aqi?.toFixed(1) || 'N/A'}
                      </span>
                      <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                        {selectedWard.properties.category || getAQICategory(selectedWard.properties.avg_aqi || 0)}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min((selectedWard.properties.avg_aqi || 0) / 500 * 100, 100)}%`,
                          backgroundColor: selectedWard.properties.avg_aqi ? getAQIColor(selectedWard.properties.avg_aqi) : '#cccccc'
                        }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Max AQI</div>
                      <div className="text-xl font-bold text-red-600 dark:text-red-400">
                        {selectedWard.properties.max_aqi?.toFixed(0) || 'N/A'}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Min AQI</div>
                      <div className="text-xl font-bold text-green-600 dark:text-green-400">
                        {selectedWard.properties.min_aqi?.toFixed(0) || 'N/A'}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl col-span-2">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Monitoring Stations</div>
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {selectedWard.properties.station_count || 0}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const wardId = selectedWard.properties.Ward_No || selectedWard.properties.Ward_Name || selectedWard.name;
                      window.open(`/ward/${encodeURIComponent(wardId)}?name=${encodeURIComponent(selectedWard.name)}`, '_blank');
                    }}
                    className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 mt-4"
                  >
                    View Full Details
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Bar - Compact */}
      <div className="absolute bottom-20 right-4 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 shadow-xl flex items-center gap-3 flex-wrap max-w-md">
        {lastUpdated && (
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Updated:</span>
            <span>{lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}
        {summary && (
          <>
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                {summary.total_stations || 0} stations
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <Layers2 className="w-3.5 h-3.5" />
              <span className="font-medium">{summary.total_wards || 0} wards</span>
            </div>
          </>
        )}
      </div>

      {/* Map Container */}
      <div 
        ref={mapContainer} 
        className="flex-1 min-h-0 w-full rounded-lg overflow-hidden"
        style={{ minHeight: '500px', height: '100%' }}
      />

      {/* AQI Legend - Enhanced */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-2xl px-4 md:px-6 py-3 md:py-4 shadow-2xl max-w-[calc(100%-2rem)]">
        <div className="flex items-center justify-center gap-1 mb-2">
          <BarChart3 className="w-3 h-3 md:w-4 md:h-4 text-slate-500 dark:text-slate-400" />
          <span className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">AQI Scale</span>
        </div>
        <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-center text-[10px] md:text-xs">
          <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <span className="w-3 h-3 rounded-full bg-[#00e400] shadow-sm" style={{ boxShadow: '0 0 8px #00e400' }} />
            <span className="text-slate-700 dark:text-slate-300 font-semibold">Good</span>
            <span className="text-slate-400 text-[10px]">0-50</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <span className="w-3 h-3 rounded-full bg-[#ffff00] shadow-sm" style={{ boxShadow: '0 0 8px #ffff00' }} />
            <span className="text-slate-700 dark:text-slate-300 font-semibold">Satisfactory</span>
            <span className="text-slate-400 text-[10px]">51-100</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <span className="w-3 h-3 rounded-full bg-[#ff7e00] shadow-sm" style={{ boxShadow: '0 0 8px #ff7e00' }} />
            <span className="text-slate-700 dark:text-slate-300 font-semibold">Moderate</span>
            <span className="text-slate-400 text-[10px]">101-200</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <span className="w-3 h-3 rounded-full bg-[#ff0000] shadow-sm" style={{ boxShadow: '0 0 8px #ff0000' }} />
            <span className="text-slate-700 dark:text-slate-300 font-semibold">Poor</span>
            <span className="text-slate-400 text-[10px]">201-300</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <span className="w-3 h-3 rounded-full bg-[#8f3f97] shadow-sm" style={{ boxShadow: '0 0 8px #8f3f97' }} />
            <span className="text-slate-700 dark:text-slate-300 font-semibold">Very Poor</span>
            <span className="text-slate-400 text-[10px]">301-400</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <span className="w-3 h-3 rounded-full bg-[#7e0023] shadow-sm" style={{ boxShadow: '0 0 8px #7e0023' }} />
            <span className="text-slate-700 dark:text-slate-300 font-semibold">Severe</span>
            <span className="text-slate-400 text-[10px]">400+</span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-center">
          <button
            onClick={() => setShowTooltips(!showTooltips)}
            className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-primary transition-colors flex items-center gap-1 mx-auto"
            title={showTooltips ? "Hide tooltips" : "Show tooltips"}
          >
            <HelpCircle className="w-3 h-3" />
            <span>{showTooltips ? 'Hide' : 'Show'} Help</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DelhiAQIMap;