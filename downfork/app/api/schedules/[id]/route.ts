import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const patchSchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED']),
});

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const schedule = await db.schedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    await db.schedule.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Schedule deleted successfully' });
  } catch (error: any) {
    console.error('API schedules DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete schedule', details: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const validation = patchSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid patch data', details: validation.error.format() }, { status: 400 });
    }

    const { status } = validation.data;

    const schedule = await db.schedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    const updated = await db.schedule.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('API schedules PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update schedule', details: error.message }, { status: 500 });
  }
}
