import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST /api/audit-logs/export - Export audit logs as CSV or JSON
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { format = 'csv', filters = {} } = body;

    // Build filter conditions (same as GET route)
    const where: any = {};

    if (filters.resourceId) {
      where.resourceId = filters.resourceId;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.environmentType && ['DEVELOPMENT', 'STAGING', 'PRODUCTION'].includes(filters.environmentType.toUpperCase())) {
      where.environmentType = filters.environmentType.toUpperCase();
    }

    if (filters.action && ['ENABLED', 'DISABLED'].includes(filters.action.toUpperCase())) {
      where.action = filters.action.toUpperCase();
    }

    if (filters.toggleName) {
      where.toggleName = {
        contains: filters.toggleName,
        mode: 'insensitive',
      };
    }

    // Date range filter
    const now = new Date();
    let startDate: Date;

    switch (filters.dateRange || 'last7days') {
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

    // Fetch all logs matching filters (no pagination for export)
    const logs = await prisma.auditLogEntry.findMany({
      where,
      orderBy: {
        timestamp: 'desc',
      },
    });

    if (format === 'json') {
      // JSON export
      const jsonData = logs.map((log) => ({
        timestamp: log.timestamp.toISOString(),
        user: log.userName,
        email: log.userEmail,
        action: log.action.toLowerCase(),
        toggleName: log.toggleName,
        resourceName: log.resourceName,
        environment: log.environmentType.toLowerCase(),
        previousState: log.previousState ? 'enabled' : 'disabled',
        newState: log.newState ? 'enabled' : 'disabled',
      }));

      return NextResponse.json(jsonData);
    } else {
      // CSV export
      const csvRows = [
        // Header
        ['Timestamp', 'User', 'Email', 'Action', 'Toggle Name', 'Resource', 'Environment', 'Previous State', 'New State'],
        // Data rows
        ...logs.map((log) => [
          log.timestamp.toISOString(),
          log.userName,
          log.userEmail,
          log.action.toLowerCase(),
          log.toggleName,
          log.resourceName,
          log.environmentType.toLowerCase(),
          log.previousState ? 'enabled' : 'disabled',
          log.newState ? 'enabled' : 'disabled',
        ]),
      ];

      const csvContent = csvRows
        .map((row) => row.map((cell) => `"${cell}"`).join(','))
        .join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-log-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }
  } catch (error: any) {
    console.error('Failed to export audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to export audit logs' },
      { status: 500 }
    );
  }
}
