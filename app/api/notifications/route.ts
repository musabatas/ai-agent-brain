import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { notificationService } from '@/lib/services/notification.service';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const isRead = searchParams.get('isRead') !== null ? searchParams.get('isRead') === 'true' : undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : undefined;

    const [result, unreadCount] = await Promise.all([
      notificationService.list(user.userId, { isRead, limit, offset }),
      notificationService.unreadCount(user.userId),
    ]);

    return NextResponse.json({ ...result, unreadCount });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });

    const body = await req.json();

    if (body.markAllRead) {
      await notificationService.markAllRead(user.userId);
      return NextResponse.json({ message: 'All notifications marked as read' });
    }

    if (body.id) {
      await notificationService.markRead(user.userId, body.id);
      return NextResponse.json({ message: 'Notification marked as read' });
    }

    return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
  } catch (error) {
    return handleApiError(error);
  }
}
