import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { downloadProgress } from '@/lib/downloader';

export async function GET() {
  try {
    const downloads = await db.download.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    const enriched = downloads.map(dl => {
      if (dl.status === 'PENDING') {
        const progress = downloadProgress.get(dl.id);
        if (progress) {
          return {
            ...dl,
            progress: progress.percent,
            speed: progress.speed,
            eta: progress.eta,
          };
        }
      }
      return dl;
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Error fetching downloads:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
