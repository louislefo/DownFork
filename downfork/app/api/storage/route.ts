import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const downloadsDir = path.join(process.cwd(), 'public', 'downloads');
    let totalBytes = 0;

    if (fs.existsSync(downloadsDir)) {
      const files = fs.readdirSync(downloadsDir);
      for (const file of files) {
        const filePath = path.join(downloadsDir, file);
        try {
          const stat = fs.statSync(filePath);
          if (stat.isFile()) {
            totalBytes += stat.size;
          }
        } catch {
          // ignore individual file stat error
        }
      }
    }

    let used = '0 MB';
    if (totalBytes < 1024 * 1024) {
      used = (totalBytes / 1024).toFixed(1) + ' KB';
    } else if (totalBytes < 1024 * 1024 * 1024) {
      used = (totalBytes / (1024 * 1024)).toFixed(1) + ' MB';
    } else {
      used = (totalBytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    }

    return NextResponse.json({ used });
  } catch (error) {
    console.error('Storage calculation failed:', error);
    return NextResponse.json({ error: 'Failed to calculate storage' }, { status: 500 });
  }
}
