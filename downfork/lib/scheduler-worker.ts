import { db } from './db';
import { downloadMedia } from './downloader';

let isWorkerRunning = false;

export function startSchedulerWorker() {
  if (isWorkerRunning) return;
  isWorkerRunning = true;
  console.log('Scheduler worker: initialized successfully');
  
  // Run check immediately and then every 60 seconds
  checkSchedules().catch(err => console.error('Scheduler worker: initial check error', err));
  
  setInterval(() => {
    checkSchedules().catch(err => console.error('Scheduler worker: interval check error', err));
  }, 60000);
}

async function checkSchedules() {
  const activeSchedules = await db.schedule.findMany();
  const now = new Date();
  
  // Format hours and minutes to match HH:MM
  const currentHour = now.getHours().toString().padStart(2, '0');
  const currentMinute = now.getMinutes().toString().padStart(2, '0');
  const currentTimeStr = `${currentHour}:${currentMinute}`;
  
  for (const schedule of activeSchedules) {
    if (schedule.status !== 'ACTIVE') continue;
    
    let shouldTrigger = false;
    const [schedHour, schedMinute] = schedule.time.split(':');
    
    const lastTriggered = schedule.lastTriggeredAt ? new Date(schedule.lastTriggeredAt) : null;
    
    if (schedule.frequency === 'hourly') {
      // Trigger when current minute matches the scheduled minute
      if (currentMinute === schedMinute) {
        if (!lastTriggered || (now.getTime() - lastTriggered.getTime()) >= 50 * 60 * 1000) {
          shouldTrigger = true;
        }
      }
    } else if (schedule.frequency === 'daily') {
      // Trigger when time matches exactly
      if (currentTimeStr === schedule.time) {
        if (!lastTriggered || (now.getTime() - lastTriggered.getTime()) >= 23 * 60 * 60 * 1000) {
          shouldTrigger = true;
        }
      }
    } else if (schedule.frequency === 'weekly') {
      // Trigger on the same day of the week as the creation date at the specified time
      const createdDate = new Date(schedule.createdAt);
      if (now.getDay() === createdDate.getDay() && currentTimeStr === schedule.time) {
        if (!lastTriggered || (now.getTime() - lastTriggered.getTime()) >= 6 * 24 * 60 * 60 * 1000) {
          shouldTrigger = true;
        }
      }
    }
    
    if (shouldTrigger) {
      console.log(`Scheduler worker: Triggering schedule ${schedule.id} (URL: ${schedule.url})`);
      
      // Update lastTriggeredAt immediately to avoid double triggering
      await db.schedule.update({
        where: { id: schedule.id },
        data: { lastTriggeredAt: now.toISOString() }
      });
      
      // Execute the download asynchronously in the background
      (async () => {
        try {
          const download = await db.download.create({
            data: {
              url: schedule.url,
              format: schedule.format,
              status: 'PENDING',
            }
          });
          
          console.log(`Scheduler worker: Created download record ${download.id} for schedule ${schedule.id}`);
          
          const info = await downloadMedia(schedule.url, schedule.format, download.id);
          
          await db.download.update({
            where: { id: download.id },
            data: {
              title: info.title,
              fileSize: info.fileSize,
              filePath: info.filePath,
              thumbnailUrl: info.thumbnailUrl,
              status: 'COMPLETED',
            }
          });
          
          console.log(`Scheduler worker: Completed download ${download.id} for schedule ${schedule.id}`);
        } catch (error) {
          console.error(`Scheduler worker: Error executing scheduled download for schedule ${schedule.id}:`, error);
        }
      })();
    }
  }
}
