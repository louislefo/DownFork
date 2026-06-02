import { exec, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const execPromise = promisify(exec);

export interface DownloadInfo {
  title: string;
  fileSize: string;
  filePath: string;
  thumbnailUrl: string | null;
}

export interface ProgressInfo {
  percent: string;
  speed: string;
  eta: string;
}

// In-memory registry of active download progress, keyed by downloadId
export const downloadProgress = new Map<string, ProgressInfo>();

// Global registry of active download processes, keyed by downloadId
const activeProcesses = new Map<string, ChildProcess>();

function getBinaryPath(): string {
  const localPath = path.join(process.cwd(), 'yt-dlp.exe');
  if (fs.existsSync(localPath)) {
    return `"${localPath}" --js-runtimes nodejs`;
  }
  return 'yt-dlp --js-runtimes nodejs';
}

/**
 * Returns true if the given downloadId has an active (running) process.
 */
export function isDownloadActive(downloadId: string): boolean {
  return activeProcesses.has(downloadId);
}

/**
 * Stops an active download by killing its process tree.
 * Cleans up any partial files left behind by yt-dlp.
 * Returns true if a process was actually killed, false if nothing was running.
 */
export function stopDownload(downloadId: string): boolean {
  const proc = activeProcesses.get(downloadId);
  if (!proc || proc.killed) {
    activeProcesses.delete(downloadId);
    cleanupPartialFiles(downloadId);
    return false;
  }

  try {
    // On Windows, we need to kill the entire process tree
    if (process.platform === 'win32' && proc.pid) {
      exec(`taskkill /pid ${proc.pid} /T /F`, (err) => {
        if (err) console.error(`taskkill error for pid ${proc.pid}:`, err.message);
      });
    } else {
      proc.kill('SIGTERM');
    }
  } catch (err) {
    console.error(`Failed to kill process for download ${downloadId}:`, err);
  }

  activeProcesses.delete(downloadId);
  cleanupPartialFiles(downloadId);
  return true;
}

/**
 * Removes partial/temporary files that yt-dlp may have left behind.
 */
function cleanupPartialFiles(downloadId: string): void {
  const outputDir = path.join(process.cwd(), 'public', 'downloads');
  if (!fs.existsSync(outputDir)) return;

  try {
    const files = fs.readdirSync(outputDir);
    for (const file of files) {
      if (file.startsWith(downloadId)) {
        const fullPath = path.join(outputDir, file);
        try {
          fs.unlinkSync(fullPath);
          console.log(`Cleaned up partial file: ${file}`);
        } catch (err) {
          console.error(`Failed to clean up file ${file}:`, err);
        }
      }
    }
  } catch (err) {
    console.error('Error scanning for partial files:', err);
  }
}

export async function downloadMedia(url: string, format: string, downloadId: string): Promise<DownloadInfo> {
  const outputDir = path.join(process.cwd(), 'public', 'downloads');
  const binary = getBinaryPath();

  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // yt-dlp template: id + extension
  const outputPath = path.join(outputDir, `${downloadId}.%(ext)s`);

  // Command selection based on format
  let command = '';
  if (format === 'mp3') {
    command = `${binary} --newline -x --audio-format mp3 -o "${outputPath}" "${url}"`;
  } else {
    // Default to best video + best audio merged in mp4
    command = `${binary} --newline -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" -o "${outputPath}" "${url}"`;
  }

  try {
    // Get title first (quick)
    const { stdout: titleOutput } = await execPromise(`${binary} --get-title "${url}"`);
    const title = titleOutput.trim();

    // Get thumbnail URL (quick)
    let thumbnailUrl: string | null = null;
    try {
      const { stdout: thumbnailOutput } = await execPromise(`${binary} --get-thumbnail "${url}"`);
      thumbnailUrl = thumbnailOutput.trim() || null;
    } catch {
      // Ignore thumbnail fetch failure
    }

    // Perform actual download - use exec() directly so we get the ChildProcess handle
    const downloadResult = await new Promise<void>((resolve, reject) => {
      const proc = exec(command, (error) => {
        activeProcesses.delete(downloadId);
        downloadProgress.delete(downloadId);
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
      
      // Track progress via stdout streaming
      proc.stdout?.on('data', (chunk) => {
        const data = chunk.toString();
        const percentMatch = data.match(/([\d.]+)%/);
        if (percentMatch) {
          const percent = percentMatch[1];
          
          const speedMatch = data.match(/at\s+([^\s]+)/);
          const speed = speedMatch ? speedMatch[1] : '';
          
          const etaMatch = data.match(/ETA\s+([^\s]+)/);
          const eta = etaMatch ? etaMatch[1] : '';
          
          downloadProgress.set(downloadId, { percent, speed, eta });
        }
      });

      // Register in the active processes map
      activeProcesses.set(downloadId, proc);
    });

    // Find the actual file
    const files = fs.readdirSync(outputDir);
    const fileName = files.find(f => f.startsWith(downloadId));

    if (!fileName) {
      throw new Error('Downloaded file not found on disk.');
    }

    const fullPath = path.join(outputDir, fileName);
    const stats = fs.statSync(fullPath);
    const fileSize = (stats.size / (1024 * 1024)).toFixed(2) + ' MB';

    return {
      title,
      fileSize,
      filePath: `/downloads/${fileName}`,
      thumbnailUrl,
    };
  } catch (error) {
    activeProcesses.delete(downloadId);
    console.error('Download error:', error);
    throw error;
  }
}
