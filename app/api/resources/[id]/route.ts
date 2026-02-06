import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { maskConnectionString } from '@/lib/utils';

// PUT /api/resources/[id] - Update resource
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      displayName,
      environmentType,
      resourceName,
      resourceGroup,
      connectionString,
      subscriptionId,
    } = body;

    // Check if resource exists
    const existingResource = await prisma.appConfigResource.findUnique({
      where: { id },
    });

    if (!existingResource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // Update resource
    const resource = await prisma.appConfigResource.update({
      where: { id },
      data: {
        displayName,
        environmentType: environmentType.toUpperCase(),
        resourceName,
        resourceGroup,
        // Only update connection string if provided (not masked)
        ...(connectionString && !connectionString.includes('***') && {
          connectionString,
        }),
        subscriptionId: subscriptionId || existingResource.subscriptionId,
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
    console.error('Failed to update resource:', error);
    return NextResponse.json(
      { error: 'Failed to update resource' },
      { status: 500 }
    );
  }
}

// DELETE /api/resources/[id] - Delete resource
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if resource exists
    const existingResource = await prisma.appConfigResource.findUnique({
      where: { id },
    });

    if (!existingResource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // Delete resource (cascade will delete related toggles and audit logs)
    await prisma.appConfigResource.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Resource deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete resource:', error);
    return NextResponse.json(
      { error: 'Failed to delete resource' },
      { status: 500 }
    );
  }
}
