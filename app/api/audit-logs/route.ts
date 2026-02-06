import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/audit-logs - Fetch audit logs with filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const resourceId = searchParams.get('resourceId');
    const userId = searchParams.get('userId');
    const environmentType = searchParams.get('environmentType');
    const action = searchParams.get('action');
    const toggleName = searchParams.get('toggleName');
    const dateRange = searchParams.get('dateRange') || 'last7days';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build filter conditions
    const where: any = {};

    if (resourceId) {
      where.resourceId = resourceId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (environmentType && ['DEVELOPMENT', 'STAGING', 'PRODUCTION'].includes(environmentType.toUpperCase())) {
      where.environmentType = environmentType.toUpperCase();
    }

    if (action && ['ENABLED', 'DISABLED'].includes(action.toUpperCase())) {
      where.action = action.toUpperCase();
    }

    if (toggleName) {
      where.toggleName = {
        contains: toggleName,
        mode: 'insensitive',
      };
    }

    // Date range filter
    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case 'last7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'last90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    where.timestamp = {
      gte: startDate,
    };

    // Fetch logs with filters
    const [logs, totalCount] = await Promise.all([
      prisma.auditLogEntry.findMany({
        where,
        orderBy: {
          timestamp: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.auditLogEntry.count({ where }),
    ]);

    // Format response
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      timestamp: log.timestamp.toISOString(),
      userId: log.userId,
      userName: log.userName,
      userEmail: log.userEmail,
      action: log.action.toLowerCase(),
      toggleId: log.toggleId,
      toggleName: log.toggleName,
      resourceId: log.resourceId,
      resourceName: log.resourceName,
      environmentType: log.environmentType.toLowerCase(),
      previousState: log.previousState,
      newState: log.newState,
    }));

    return NextResponse.json({
      logs: formattedLogs,
      totalCount,
      hasMore: offset + logs.length < totalCount,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Failed to fetch audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
