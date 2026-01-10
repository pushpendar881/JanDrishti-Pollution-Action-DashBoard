// Supabase Edge Function to fetch AQI station data from WAQI API
// This function runs periodically via pg_cron or can be triggered manually

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const WAQI_API_TOKEN = Deno.env.get('WAQI_API_TOKEN') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

interface WAQIStation {
  lat: number
  lon: number
  aqi: string | number
  station: {
    name: string
  }
}

interface StationDetail {
  name: string
  lat: number
  lon: number
  aqi: number
  category: string
  color: string
  pm25?: number
  pm10?: number
  no2?: number
  so2?: number
  o3?: number
  co?: number
  temperature?: number
  humidity?: number
  pressure?: number
  wind_speed?: number
  updated?: string
  dominentpol?: string
}

function getAQICategory(aqi: number): { category: string; color: string } {
  if (aqi <= 50) return { category: "Good", color: "#00e400" }
  if (aqi <= 100) return { category: "Satisfactory", color: "#ffff00" }
  if (aqi <= 200) return { category: "Moderate", color: "#ff7e00" }
  if (aqi <= 300) return { category: "Poor", color: "#ff0000" }
  if (aqi <= 400) return { category: "Very Poor", color: "#8f3f97" }
  return { category: "Severe", color: "#7e0023" }
}

async function fetchDetailedStationData(lat: number, lon: number): Promise<Partial<StationDetail>> {
  try {
    const url = `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${WAQI_API_TOKEN}`
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) })
    const data = await response.json()
    
    if (data.status !== "ok") {
      return {}
    }
    
    const stationData = data.data
    const iaqi = stationData.get("iaqi", {})
    
    return {
      pm25: iaqi.pm25?.v,
      pm10: iaqi.pm10?.v,
      no2: iaqi.no2?.v,
      so2: iaqi.so2?.v,
      o3: iaqi.o3?.v,
      co: iaqi.co?.v,
      temperature: iaqi.t?.v,
      humidity: iaqi.h?.v,
      pressure: iaqi.p?.v,
      wind_speed: iaqi.w?.v,
      updated: stationData.time?.s,
      dominentpol: stationData.dominentpol
    }
  } catch (error) {
    console.error(`Error fetching detailed data for ${lat},${lon}:`, error)
    return {}
  }
}

serve(async (req) => {
  try {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }

    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    if (!WAQI_API_TOKEN) {
      return new Response(
        JSON.stringify({ error: 'WAQI_API_TOKEN not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Starting AQI station data fetch...')

    // Step 1: Fetch basic station data from WAQI
    const boundsUrl = `https://api.waqi.info/map/bounds/?latlng=28.4,76.8,28.9,77.4&token=${WAQI_API_TOKEN}`
    const boundsResponse = await fetch(boundsUrl)
    const boundsData = await boundsResponse.json()

    if (boundsData.status !== "ok") {
      throw new Error(`WAQI API error: ${boundsData.data || 'Unknown error'}`)
    }

    const stationsRaw: WAQIStation[] = boundsData.data || []
    console.log(`Found ${stationsRaw.length} WAQI stations`)

    // Step 2: Process each station and fetch detailed data
    const stationDetails: StationDetail[] = []
    
    for (let i = 0; i < stationsRaw.length; i++) {
      const st = stationsRaw[i]
      const aqiVal = st.aqi
      
      if (aqiVal === "-" || aqiVal === null || aqiVal === undefined) {
        continue
      }

      let aqiInt: number
      try {
        aqiInt = typeof aqiVal === 'string' ? parseInt(aqiVal) : aqiVal
        if (isNaN(aqiInt)) continue
      } catch {
        continue
      }

      const lat = parseFloat(st.lat.toString())
      const lon = parseFloat(st.lon.toString())
      const name = st.station?.name || 'Unknown Station'

      const categoryInfo = getAQICategory(aqiInt)
      
      const stationInfo: StationDetail = {
        name,
        lat,
        lon,
        aqi: aqiInt,
        category: categoryInfo.category,
        color: categoryInfo.color
      }

      // Fetch detailed pollutant data
      try {
        const detailed = await fetchDetailedStationData(lat, lon)
        Object.assign(stationInfo, detailed)
      } catch (error) {
        console.warn(`Failed to fetch details for ${name}:`, error)
      }

      stationDetails.push(stationInfo)

      // Small delay to avoid rate limiting
      if (i < stationsRaw.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 150))
      }
    }

    console.log(`Processed ${stationDetails.length} stations with data`)

    // Step 3: Calculate summary statistics
    const aqiValues = stationDetails.map(s => s.aqi).filter(a => a > 0)
    const summary = {
      total_stations: stationDetails.length,
      avg_aqi: aqiValues.length > 0 ? Math.round((aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length) * 10) / 10 : 0,
      max_aqi: aqiValues.length > 0 ? Math.max(...aqiValues) : 0,
      min_aqi: aqiValues.length > 0 ? Math.min(...aqiValues) : 0,
      fetched_at: new Date().toISOString()
    }

    // Step 4: Save to Supabase aqi_cache table
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      
      // Get existing cache record
      const { data: existing } = await supabase
        .from('aqi_cache')
        .select('id')
        .order('id', { ascending: false })
        .limit(1)
        .single()

      const cacheData = {
        wards: {}, // Will be populated by backend heavy processing
        stations: stationDetails,
        summary: summary
      }

      if (existing) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('aqi_cache')
          .update({
            data: cacheData,
            generated_at: new Date().toISOString()
          })
          .eq('id', existing.id)

        if (updateError) {
          console.error('Error updating cache:', updateError)
        } else {
          console.log(`✅ Updated cache record id=${existing.id}`)
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('aqi_cache')
          .insert({
            data: cacheData,
            generated_at: new Date().toISOString()
          })

        if (insertError) {
          console.error('Error inserting cache:', insertError)
        } else {
          console.log('✅ Created new cache record')
        }
      }
    }

    return new Response(
      JSON.stringify({
        status: 'success',
        message: 'AQI station data fetched and cached successfully',
        stations_count: stationDetails.length,
        summary: summary
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in fetch-aqi-stations function:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : String(error)
      }),
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      }
    )
  }
})
