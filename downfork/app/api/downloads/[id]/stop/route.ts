import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stopDownload } from '@/lib/downloader';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const download = await db.download.findUnique({
      where: { id },
    });

    if (!download) {
      return NextResponse.json({ error: 'Download not found' }, { status: 404 });
    }

    if (download.status !== 'PENDING') {
      return NextResponse.json({ error: 'Download is not active' }, { status: 400 });
    }

    // Kill the process
    stopDownload(id);

    // Update DB status to CANCELLED
    await db.download.update({
      where: { id },
      data: { status: 'FAILED' },
    });

    return NextResponse.json({ message: 'Download stopped' });
  } catch (error) {
    console.error('Error stopping download:', error);
    return NextResponse.json({ error: 'Failed to stop download' }, { status: 500 });
  }
}
