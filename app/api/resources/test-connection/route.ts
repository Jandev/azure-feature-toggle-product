import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { testAzureConnection } from '@/lib/azure';
import { prisma } from '@/lib/db';

// POST /api/resources/test-connection - Test Azure connection
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { connectionString, resourceId } = body;

    if (!connectionString) {
      return NextResponse.json(
        { error: 'Connection string is required' },
        { status: 400 }
      );
    }

    // Test the connection
    const result = await testAzureConnection(connectionString);

    // If testing an existing resource, update its status
    if (resourceId) {
      await prisma.appConfigResource.update({
        where: { id: resourceId },
        data: {
          connectionStatus: result.success ? 'CONNECTED' : 'ERROR',
          lastTested: new Date(),
        },
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Connection test failed:', error);
    return NextResponse.json(
      {
        success: false,
        message: `Connection test failed: ${error.message}`,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
