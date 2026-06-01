import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const scheduleSchema = z.object({
  url: z.string().url(),
  format: z.enum(['mp3', 'mp4']),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format'),
  frequency: z.enum(['hourly', 'daily', 'weekly']),
});

export async function GET() {
  try {
    const schedules = await db.schedule.findMany();
    return NextResponse.json(schedules);
  } catch (error: any) {
    console.error('API schedules GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch schedules', details: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = scheduleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid scheduling data', details: validation.error.format() }, { status: 400 });
    }

    const { url, format, time, frequency } = validation.data;

    const schedule = await db.schedule.create({
      data: {
        url,
        format,
        time,
        frequency,
        status: 'ACTIVE',
      },
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch (error: any) {
    console.error('API schedules POST error:', error);
    return NextResponse.json({ error: 'Failed to create schedule', details: error.message }, { status: 500 });
  }
}
