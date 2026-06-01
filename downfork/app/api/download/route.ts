import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { downloadMedia } from '@/lib/downloader';
import { z } from 'zod';

const downloadSchema = z.object({
  url: z.string().url(),
  format: z.enum(['mp3', 'mp4']),
});

export async function POST(request: Request) {
  console.log('API: Received download request');
  try {
    const body = await request.json();
    console.log('API: Request body:', body);
    
    const validation = downloadSchema.safeParse(body);

    if (!validation.success) {
      console.error('API: Validation failed:', validation.error.format());
      return NextResponse.json({ error: 'Invalid URL or format' }, { status: 400 });
    }

    const { url, format } = validation.data;
    console.log(`API: Validated URL: ${url}, format: ${format}`);

    // 1. Create PENDING record
    const download = await db.download.create({
      data: {
        url,
        format,
        status: 'PENDING',
      },
    });
    
    console.log(`API: Created record ${download.id}`);

    // 2. Start download process in background
    (async () => {
      try {
        console.log(`BG: Starting download for ${download.id}`);
        const info = await downloadMedia(url, format, download.id);
        console.log(`BG: Download success for ${download.id}:`, info);
        
        await db.download.update({
          where: { id: download.id },
          data: {
            title: info.title,
            fileSize: info.fileSize,
            filePath: info.filePath,
            thumbnailUrl: info.thumbnailUrl,
            status: 'COMPLETED',
          },
        });
      } catch (error) {
        console.error(`BG: Download failed for ${download.id}:`, error);
        await db.download.update({
          where: { id: download.id },
          data: { status: 'FAILED' },
        });
      }
    })();

    return NextResponse.json({ 
      message: 'Download started', 
      id: download.id 
    }, { status: 201 });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
