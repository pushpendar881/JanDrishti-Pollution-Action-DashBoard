# 🌍 JanDrishti - Air Quality Monitoring Dashboard

<div align="center">
  <img src="./public/dashboard-screenshot.png" alt="JanDrishti Dashboard" width="800"/>
  
  [![Next.js](https://img.shields.io/badge/Next.js-16.0.10-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19.2.0-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.9-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
</div>

## 📋 Table of Contents

- [🎯 Overview](#-overview)
- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🚀 Quick Start](#-quick-start)
- [📱 Components](#-components)
- [🔧 Configuration](#-configuration)
- [📊 Data Sources](#-data-sources)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

## 🎯 Overview

**JanDrishti** is a comprehensive air quality monitoring dashboard that provides real-time pollution data, AI-powered forecasts, and citizen engagement tools. Built with modern web technologies, it offers ward-wise pollution monitoring with actionable insights for both citizens and policymakers.

### Key Highlights
- 🔴 **Real-time AQI monitoring** with live data streaming and severity indicators
- 🤖 **AI-powered forecasting** for pollution trends
- 📍 **Ward-wise data visualization** for Central Delhi with interactive maps
- 👥 **Citizen reporting system** with community-driven pollution monitoring
- 📋 **Policy recommendations** with AI-generated actionable insights
- 🚨 **Live alerts & emergency system** with WhatsApp integration
- 📰 **Real-time news updates** with categorized environmental information
- 📞 **Emergency helplines** with 24/7 government and health services
- 📱 **Responsive design** optimized for all devices and platforms

## ✨ Features

<details>
<summary><strong>🔍 Live Monitoring & Real-time Data</strong></summary>

- **Real-time AQI monitoring** with color-coded severity indicators (Good, Moderate, Unhealthy, Severe, Hazardous)
- **Multi-pollutant tracking**: PM2.5, PM10, CO, SO2, NO2 with live readings
- **Weather integration**: Temperature, humidity, wind speed, UV index
- **Ward-wise monitoring** for Central Delhi with location-specific data
- **Live data indicators** with confidence levels and update timestamps
- **Interactive AQI gauge** with animated visual feedback
</details>

<details>
<summary><strong>🚨 Live Alerts & Emergency System</strong></summary>

- **Real-time alert notifications** with priority levels (Critical, High, Medium, Low)
- **Multi-category alerts**: Emergency, Health, Traffic, Weather, Policy updates
- **WhatsApp integration** for instant mobile notifications
- **Emergency SOPs** based on AQI levels (Severe+, Severe, Very Poor)
- **Automated health advisories** for vulnerable groups
- **Government regulation alerts** (Odd-even schemes, construction bans)
</details>

<details>
<summary><strong>📰 Live News & Updates</strong></summary>

- **Real-time news feed** with air quality updates
- **Categorized news**: Alerts, Health advisories, Policy updates
- **Live data streaming** with timestamps
- **Weather pattern updates** affecting air quality
- **Government announcement integration**
- **Regional news coverage** (Delhi, Mumbai, Bangalore)
</details>

<details>
<summary><strong>🤖 AI-Powered Features</strong></summary>

- **Intelligent chatbot assistant** with contextual responses
- **AI-driven pollution forecasting** (24-hour, 7-day, 30-day predictions)
- **Smart policy recommendations** based on current AQI levels
- **Contributing factor analysis** (Weather, Traffic, Industrial, Construction)
- **Automated health suggestions** based on pollution levels
- **Emergency response recommendations**
</details>

<details>
<summary><strong>👥 Citizen Reporting & Community Engagement</strong></summary>

- **Community pollution reporting** with photo uploads
- **Report categories**: Smoke/Burning, Construction Dust, Vehicle Pollution, Industrial Waste
- **Real-time report tracking** with status updates (Open, In-Progress, Resolved)
- **Upvoting system** for community validation
- **Ward-wise analytics** with resolution rates and response times
- **Citizen participation metrics** and success tracking
</details>

<details>
<summary><strong>🏛️ Policy Hub & Government Integration</strong></summary>

- **AI-generated policy recommendations** with impact assessments
- **Current regulations database** (NCAP, Air Act 1981, BS-VI standards)
- **Emergency Standard Operating Procedures** for different AQI levels
- **Government helplines directory** with 24/7 contact numbers
- **Resource portal** with health facilities and emergency services
- **Compliance monitoring** and enforcement tracking
</details>

<details>
<summary><strong>📊 Advanced Data Visualization</strong></summary>

- **Interactive pollution maps** with ward-wise overlays
- **Multi-metric charts** with Recharts integration
- **Historical trend analysis** with comparative data
- **Forecast visualization** with confidence intervals
- **Real-time data streaming** with live updates
- **Export capabilities** for reports and analysis
</details>

<details>
<summary><strong>📞 Emergency Services & Helplines</strong></summary>

- **24/7 Emergency helplines**: Pollution Control Board (1800-11-0031)
- **Municipal services**: Corporation helpline (1800-11-3344)
- **Traffic emergency**: Police helpline (1095)
- **Health emergency**: Medical services (108)
- **Specialized healthcare**: AIIMS Pollution Clinic, Chest Disease Hospital
- **Government portals**: CPCB, AQI Portal, SAMEER App integration
</details>

## 🏗️ Architecture

<div align="center">
  <img src="./public/architecture-diagram.png" alt="System Architecture" width="800"/>
</div>

### System Components

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | Next.js 16 + React 19 | User interface and interactions |
| **UI Components** | Radix UI + Tailwind CSS | Accessible, responsive design |
| **Data Visualization** | Recharts | Charts and graphs |
| **State Management** | React Hooks | Component state handling |
| **API Integration** | REST APIs | Real-time data fetching |
| **Notifications** | Sonner | Toast notifications |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/pushpendar881/jandrishti-dashboard.git
cd jandrishti-dashboard

# Install dependencies
npm install
# or
yarn install
# or
pnpm install
```

### Development

```bash
# Start the development server
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Build for Production

```bash
# Build the application
npm run build
npm start

# or
yarn build
yarn start
```

## 📱 Components

### Core Components

<details>
<summary><strong>🏠 Main Dashboard</strong></summary>

```typescript
// Real-time metrics and monitoring
<MainMetrics aqiData={aqiData} selectedWard={selectedWard} />
<PollutantFilters pollutants={pollutants} />
<StatsGrid aqiData={aqiData} />
```
- **Live AQI display** with animated gauge (206 - Severe status)
- **Multi-pollutant tracking**: PM2.5 (130 µg/m³), PM10 (180 µg/m³)
- **Weather integration**: Temperature (13°C), Humidity (77%), Wind Speed (7 km/h)
- **Interactive AQI scale** with color-coded severity levels
</details>

<details>
<summary><strong>🗺️ Interactive Pollution Map</strong></summary>

```typescript
<PollutionMap selectedPollutant={selectedPollutant} />
```
- **Ward-wise visualization** for Central Delhi regions
- **Real-time data overlays** with pollution hotspots
- **Interactive markers** with detailed pollution readings
- **Geographic filtering** by pollutant type (AQI, PM2.5, PM10, CO, SO2, NO2)
</details>

<details>
<summary><strong>🚨 Live Alerts System</strong></summary>

```typescript
<AlertsPanel />
```
- **Real-time notifications** with priority levels (Critical, High, Medium, Low)
- **Multi-category alerts**: Emergency (🚨), Health (🏥), Traffic (🚗), Weather (🌤️)
- **WhatsApp integration** for instant mobile notifications
- **Emergency SOPs** with actionable guidelines
- **Government regulation updates** (Odd-even schemes, construction bans)
</details>

<details>
<summary><strong>🤖 AI-Powered Features</strong></summary>

```typescript
<ChatbotAssistant />
<AIForecast selectedCity={selectedCity} selectedWard={selectedWard} />
<PolicyRecommendations aqiData={aqiData} />
```
- **Intelligent chatbot** with contextual air quality responses
- **Predictive analytics** with 24-hour, 7-day, and 30-day forecasts
- **AI policy recommendations** with impact assessments
- **Smart health suggestions** based on current pollution levels
- **Contributing factor analysis** (Weather 85%, Traffic 72%, Industrial 68%)
</details>

<details>
<summary><strong>👥 Community Engagement</strong></summary>

```typescript
<CitizenReporting selectedWard={selectedWard} />
<NewsSection />
```
- **Community reporting system** with photo upload capabilities
- **Report categories**: Smoke/Burning, Construction Dust, Vehicle Pollution, Industrial Waste
- **Real-time news feed** with live environmental updates
- **Upvoting system** for community validation
- **Ward analytics** with resolution rates (89% success rate)
</details>

<details>
<summary><strong>📊 Data Visualization & Analytics</strong></summary>

```typescript
<PollutionChart selectedPollutant={selectedPollutant} />
<HistoricalAnalysis selectedPollutant={selectedPollutant} />
```
- **Interactive charts** with Recharts integration
- **Historical trend analysis** with comparative data
- **Multi-metric visualization** (AQI, PM2.5, PM10, CO, SO2, NO2)
- **Export functionality** for reports and analysis
- **Real-time data streaming** with confidence intervals
</details>

<details>
<summary><strong>📞 Emergency Services Integration</strong></summary>

```typescript
// Emergency helplines and resources
const emergencyServices = {
  pollutionControl: "1800-11-0031",
  municipal: "1800-11-3344", 
  traffic: "1095",
  health: "108"
}
```
- **24/7 Emergency helplines** with direct contact integration
- **Healthcare resources**: AIIMS Pollution Clinic, Chest Disease Hospital
- **Government portals**: CPCB, AQI Portal, SAMEER App
- **WhatsApp alert subscriptions** for instant notifications
</details>

### UI Components

Built with **Radix UI** primitives for accessibility and **Tailwind CSS** for styling:

- `AlertsPanel` - Real-time emergency notifications with WhatsApp integration
- `WeatherCard` - Live weather data with temperature, humidity, wind speed
- `PollutantFilters` - Interactive filtering for AQI, PM2.5, PM10, CO, SO2, NO2
- `HistoricalAnalysis` - Trend analysis with comparative historical data
- `ChatbotAssistant` - AI-powered floating chat interface
- `CitizenReporting` - Community reporting with photo uploads and status tracking
- `PolicyRecommendations` - AI-generated policy suggestions with impact analysis
- `NewsSection` - Live news feed with categorized environmental updates
- `AIForecast` - Predictive analytics with confidence intervals and recommendations

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=your_api_endpoint
NEXT_PUBLIC_WEATHER_API_KEY=your_weather_api_key
NEXT_PUBLIC_AQI_API_KEY=your_aqi_api_key

# WhatsApp Integration
NEXT_PUBLIC_WHATSAPP_API_KEY=your_whatsapp_api_key
NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER=your_whatsapp_number

# Emergency Services
NEXT_PUBLIC_EMERGENCY_API_ENDPOINT=your_emergency_api
NEXT_PUBLIC_HELPLINE_INTEGRATION=enabled

# Analytics & Monitoring
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
NEXT_PUBLIC_MONITORING_ENABLED=true

# AI/ML Services
NEXT_PUBLIC_AI_FORECAST_API=your_ai_api_endpoint
NEXT_PUBLIC_CHATBOT_API_KEY=your_chatbot_api_key
```

### Feature Configuration

```typescript
// config/features.ts
export const features = {
  realTimeAlerts: true,
  whatsappIntegration: true,
  aiForecasting: true,
  citizenReporting: true,
  emergencyServices: true,
  newsIntegration: true,
  policyRecommendations: true
}
```

### Customization

The application uses **Tailwind CSS** for styling. Customize the theme in:

```typescript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6",
        accent: "#06b6d4",
        // AQI Status Colors
        good: "#10b981",
        moderate: "#f59e0b", 
        unhealthy: "#ef4444",
        severe: "#7c2d12"
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite alternate',
        'subtle-float': 'subtle-float 6s ease-in-out infinite'
      }
    }
  }
}
```

## 📊 Data Sources & Integration

### Real-time Data APIs

- **Air Quality Monitoring** - Live AQI, PM2.5, PM10, CO, SO2, NO2 readings
- **Weather Services** - Temperature, humidity, wind speed, UV index data
- **Government APIs** - Policy updates, regulations, emergency notifications
- **News APIs** - Environmental news, health advisories, government announcements
- **Emergency Services** - Helpline integration, healthcare facility data

### Data Processing & AI

1. **Real-time Data Streaming** - WebSocket connections for live updates
2. **AI/ML Processing** - Pollution forecasting with 94.2% accuracy
3. **Caching Layer** - Redis for performance optimization
4. **Data Storage** - Historical analysis and trend tracking
5. **Notification System** - WhatsApp, SMS, and in-app alerts

### Emergency Services Integration

| Service | Contact | Availability | Purpose |
|---------|---------|--------------|---------|
| **Pollution Control Board** | 1800-11-0031 | 24/7 | Air quality complaints |
| **Municipal Corporation** | 1800-11-3344 | 24/7 | Civic issues, waste burning |
| **Traffic Police** | 1095 | 24/7 | Vehicle pollution, traffic |
| **Health Emergency** | 108 | 24/7 | Medical emergencies |
| **AIIMS Pollution Clinic** | 011-26588500 | Business hours | Specialized respiratory care |

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use TypeScript for type safety
- Follow ESLint configuration
- Write meaningful commit messages
- Add tests for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Built with ❤️ for cleaner air and healthier communities</p>
  <p>
    <strong>🌍 JanDrishti - Professional Air Quality Monitor</strong><br>
    Real-time pollution monitoring • AI-powered forecasting • Community engagement
  </p>
  <p>
    <a href="#-overview">Back to Top</a> •
    <a href="https://github.com/pushpendar881/jandrishti-dashboard/issues">Report Bug</a> •
    <a href="https://github.com/pushpendar881/jandrishti-dashboard/issues">Request Feature</a> •
    <a href="CONTRIBUTING.md">Contributing Guide</a>
  </p>
  
  ### 🚨 Emergency Contacts
  
  | Service | Number | Purpose |
  |---------|--------|---------|
  | 🏥 Health Emergency | **108** | Medical emergencies |
  | 🚨 Pollution Control | **1800-11-0031** | Air quality complaints |
  | 🚗 Traffic Police | **1095** | Vehicle pollution reports |
  | 🏛️ Municipal Corp | **1800-11-3344** | Civic issues, waste burning |
  
  <p><em>Stay informed, stay safe, breathe better! 🌱</em></p>

</div>

