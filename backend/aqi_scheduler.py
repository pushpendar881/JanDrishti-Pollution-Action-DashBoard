"""
AQI Data Collection Scheduler
Runs background tasks to fetch hourly AQI data and calculate daily averages
"""
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from aqi_collector import AQICollector
from aqi_collector_singleton import get_collector
import atexit
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# IST timezone (Indian Standard Time)
IST_TIMEZONE = 'Asia/Kolkata'

class AQIScheduler:
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.collector = None
        self.is_running = False
    
    def start(self):
        """Start the scheduler and register jobs"""
        if self.is_running:
            logger.warning("Scheduler is already running")
            return
        
        try:
            # Use singleton instance to avoid creating multiple connections
            self.collector = get_collector()
            
            # Job 1: Fetch hourly AQI data every hour at minute 0 (IST)
            self.scheduler.add_job(
                func=self._fetch_hourly_data,
                trigger=CronTrigger(minute=0, timezone=IST_TIMEZONE),  # Every hour at :00 IST
                id='fetch_hourly_aqi',
                name='Fetch Hourly AQI Data',
                replace_existing=True
            )
            
            # Trigger initial data collection immediately on startup
            # This ensures data is available right away
            logger.info("Triggering initial AQI data collection on startup...")
            self._fetch_hourly_data()
            
            # Job 2: Calculate and store daily averages at 12:00 AM IST (midnight IST)
            self.scheduler.add_job(
                func=self._calculate_daily_averages,
                trigger=CronTrigger(hour=0, minute=0, timezone=IST_TIMEZONE),  # 12:00 AM IST every day
                id='calculate_daily_averages',
                name='Calculate Daily AQI Averages',
                replace_existing=True
            )
            
            self.scheduler.start()
            self.is_running = True
            logger.info("AQI Scheduler started successfully")
            logger.info("  - Hourly data collection: Every hour at :00 IST")
            logger.info("  - Daily average calculation: Every day at 12:00 AM IST (midnight)")
            
            # Register shutdown handler
            atexit.register(lambda: self.shutdown())
            
        except Exception as e:
            logger.error(f"Error starting scheduler: {e}")
            raise
    
    def _fetch_hourly_data(self):
        """Wrapper for hourly data collection"""
        try:
            logger.info("Starting hourly AQI data collection...")
            self.collector.fetch_and_store_hourly_data()
            logger.info("Hourly AQI data collection completed")
        except Exception as e:
            logger.error(f"Error in hourly data collection: {e}")
    
    def _calculate_daily_averages(self):
        """Wrapper for daily average calculation"""
        try:
            logger.info("Starting daily average calculation...")
            self.collector.calculate_and_store_daily_averages()
            logger.info("Daily average calculation completed")
        except Exception as e:
            logger.error(f"Error in daily average calculation: {e}")
    
    def shutdown(self):
        """Shutdown the scheduler"""
        if self.scheduler.running:
            self.scheduler.shutdown()
            self.is_running = False
            logger.info("AQI Scheduler stopped")
    
    def get_jobs(self):
        """Get list of scheduled jobs"""
        return self.scheduler.get_jobs()
    
    def trigger_hourly_fetch(self):
        """Manually trigger hourly data fetch"""
        if not self.collector:
            self.collector = get_collector()
        self._fetch_hourly_data()
    
    def trigger_daily_calculation(self):
        """Manually trigger daily average calculation"""
        if not self.collector:
            self.collector = get_collector()
        self._calculate_daily_averages()


# Global scheduler instance
_scheduler_instance = None

def get_scheduler() -> AQIScheduler:
    """Get or create the global scheduler instance"""
    global _scheduler_instance
    if _scheduler_instance is None:
        _scheduler_instance = AQIScheduler()
    return _scheduler_instance
