import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const execPromise = promisify(exec);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const targetFormat = formData.get('format') as string;

    if (!file || !targetFormat) {
      return NextResponse.json({ error: 'Missing file or format' }, { status: 400 });
    }

    // Create temp files directory
    const tempDir = path.join(process.cwd(), 'data', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const outputDir = path.join(process.cwd(), 'public', 'downloads');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileId = crypto.randomUUID();
    const originalName = file.name;
    const fileExt = path.extname(originalName);
    const inputPath = path.join(tempDir, `${fileId}${fileExt}`);
    
    // Save uploaded file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.promises.writeFile(inputPath, buffer);

    const outputFileName = `${fileId}.${targetFormat}`;
    const outputPath = path.join(outputDir, outputFileName);

    // Build FFmpeg command
    let ffmpegCmd = '';
    if (targetFormat === 'mp3') {
      ffmpegCmd = `ffmpeg -y -i "${inputPath}" -vn -acodec libmp3lame -q:a 2 "${outputPath}"`;
    } else if (targetFormat === 'mp4') {
      ffmpegCmd = `ffmpeg -y -i "${inputPath}" -c:v libx264 -c:a aac -strict experimental -pix_fmt yuv420p "${outputPath}"`;
    } else if (targetFormat === 'webm') {
      ffmpegCmd = `ffmpeg -y -i "${inputPath}" -c:v libvpx-vp9 -b:v 1M -c:a libopus "${outputPath}"`;
    } else if (targetFormat === 'wav') {
      ffmpegCmd = `ffmpeg -y -i "${inputPath}" -vn -acodec pcm_s16le "${outputPath}"`;
    } else if (targetFormat === 'gif') {
      ffmpegCmd = `ffmpeg -y -i "${inputPath}" -vf "fps=10,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 "${outputPath}"`;
    } else {
      // Clean up input file
      try { await fs.promises.unlink(inputPath); } catch {}
      return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
    }

    // Execute FFmpeg
    await execPromise(ffmpegCmd);

    // Clean up input file
    try { await fs.promises.unlink(inputPath); } catch {}

    // Calculate converted file size
    const stats = await fs.promises.stat(outputPath);
    const fileSize = (stats.size / (1024 * 1024)).toFixed(2) + ' MB';

    // Save this to our downloads list in db so it appears in the library!
    const { db } = await import('@/lib/db');
    const baseName = path.basename(originalName, fileExt);
    const convertedTitle = `${baseName} (Converted to ${targetFormat.toUpperCase()})`;

    const newRecord = await db.download.create({
      data: {
        url: `file://${outputFileName}`,
        format: targetFormat,
        status: 'PENDING',
      }
    });

    await db.download.update({
      where: { id: newRecord.id },
      data: {
        title: convertedTitle,
        fileSize,
        filePath: `/downloads/${outputFileName}`,
        status: 'COMPLETED',
      }
    });

    return NextResponse.json({
      success: true,
      filePath: `/downloads/${outputFileName}`,
      title: convertedTitle,
      fileSize,
      id: newRecord.id
    });

  } catch (error: any) {
    console.error('File conversion failed:', error);
    return NextResponse.json({ error: 'Conversion failed', details: error.message }, { status: 500 });
  }
}
