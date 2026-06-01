import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

export async function DELETE(
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

    // 1. Delete physical file if it exists and is completed
    if (download.filePath && download.status === 'COMPLETED') {
      const fullPath = path.join(process.cwd(), 'public', download.filePath);
      
      // Basic security check: ensure the path is within the downloads folder
      const downloadsDir = path.join(process.cwd(), 'public', 'downloads');
      if (fullPath.startsWith(downloadsDir)) {
        try {
          await fs.unlink(fullPath);
        } catch (err: any) {
          if (err.code !== 'ENOENT') {
            console.error('Error deleting file:', err);
          }
        }
      }
    }

    // 2. Delete DB record
    await db.download.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE route:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
