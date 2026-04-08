import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getClientIP } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { systemLog } from '@/services/system-log';
import { NotificationSettingsSchema } from '@/app/(protected)/user-management/settings/forms/notification-settings-schema';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized request' },
        { status: 401 }, // Unauthorized
      );
    }

    const clientIp = getClientIP(request);
    const settings = await prisma.systemSetting.findFirst();
    if (!settings) {
      return NextResponse.json(
        { message: 'Settings not found.' },
        { status: 404 },
      );
    }

    // Parse the request body
    const body = await request.json();
    const parsedData = NotificationSettingsSchema.safeParse(body);
    if (!parsedData.success) {
      return NextResponse.json(
        { message: 'Invalid input. Please check your data and try again.' },
        { status: 400 }, // Bad Request
      );
    }

    // Update the settings in the database
    const updatedSettings = await prisma.systemSetting.update({
      where: { id: settings.id }, // Adjust based on your logic to fetch the correct setting
      data: parsedData.data,
    });

    // Log the event
    await systemLog({
      event: 'update',
      userId: session.user.id,
      entityId: session.user.id,
      entityType: 'system.settings',
      description: 'System notifications updated.',
      ipAddress: clientIp,
    });

    // Return success response
    return NextResponse.json(
      {
        message: 'Notification settings updated successfully',
        data: updatedSettings,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      {
        message: 'An error occurred while updating the notification settings.',
      },
      { status: 500 },
    );
  }
}
