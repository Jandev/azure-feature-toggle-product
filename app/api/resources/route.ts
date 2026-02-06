import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { maskConnectionString } from '@/lib/utils';

// GET /api/resources - List all resources for current user
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resources = await prisma.appConfigResource.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Mask connection strings before sending to client
    const maskedResources = resources.map((resource) => ({
      ...resource,
      connectionString: maskConnectionString(resource.connectionString),
      environmentType: resource.environmentType.toLowerCase(),
      connectionStatus: resource.connectionStatus.toLowerCase(),
      createdAt: resource.createdAt.toISOString(),
      updatedAt: resource.updatedAt.toISOString(),
      lastTested: resource.lastTested?.toISOString(),
    }));

    return NextResponse.json(maskedResources);
  } catch (error: any) {
    console.error('Failed to fetch resources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}

// POST /api/resources - Create new resource
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      displayName,
      environmentType,
      resourceName,
      resourceGroup,
      connectionString,
      subscriptionId,
    } = body;

    // Validate required fields
    if (!displayName || !environmentType || !resourceName || !resourceGroup || !connectionString) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create resource
    const resource = await prisma.appConfigResource.create({
      data: {
        displayName,
        environmentType: environmentType.toUpperCase(),
        resourceName,
        resourceGroup,
        connectionString, // TODO: Encrypt in production
        subscriptionId: subscriptionId || '',
        connectionStatus: 'UNKNOWN',
      },
    });

    return NextResponse.json({
      ...resource,
      connectionString: maskConnectionString(resource.connectionString),
      environmentType: resource.environmentType.toLowerCase(),
      connectionStatus: resource.connectionStatus.toLowerCase(),
      createdAt: resource.createdAt.toISOString(),
      updatedAt: resource.updatedAt.toISOString(),
      lastTested: resource.lastTested?.toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to create resource:', error);
    return NextResponse.json(
      { error: 'Failed to create resource' },
      { status: 500 }
    );
  }
}
