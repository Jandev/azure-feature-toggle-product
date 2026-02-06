import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { updateFeatureFlag } from '@/lib/azure';

// PUT /api/resources/[resourceId]/toggles/[toggleId] - Update feature toggle state
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string; toggleId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required to modify toggles' },
        { status: 403 }
      );
    }

    const { resourceId, toggleId } = await params;
    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid enabled value' }, { status: 400 });
    }

    // Get the toggle
    const toggle = await prisma.featureToggle.findUnique({
      where: { id: toggleId },
      include: { resource: true },
    });

    if (!toggle) {
      return NextResponse.json({ error: 'Toggle not found' }, { status: 404 });
    }

    if (toggle.resourceId !== resourceId) {
      return NextResponse.json({ error: 'Toggle does not belong to this resource' }, { status: 400 });
    }

    const previousState = toggle.enabled;

    // Update in Azure
    await updateFeatureFlag(
      toggle.resource.connectionString,
      toggle.name,
      enabled
    );

    // Update in database
    const updatedToggle = await prisma.featureToggle.update({
      where: { id: toggleId },
      data: {
        enabled,
        lastModifiedBy: user.name || user.email,
        lastModifiedAt: new Date(),
      },
    });

    // Create audit log entry
    await prisma.auditLogEntry.create({
      data: {
        userId: user.id,
        userName: user.name || user.email,
        userEmail: user.email,
        action: enabled ? 'ENABLED' : 'DISABLED',
        toggleId: toggle.id,
        toggleName: toggle.name,
        resourceId: toggle.resource.id,
        resourceName: toggle.resource.displayName,
        environmentType: toggle.resource.environmentType,
        previousState,
        newState: enabled,
      },
    });

    return NextResponse.json({
      id: updatedToggle.id,
      name: updatedToggle.name,
      description: updatedToggle.description,
      enabled: updatedToggle.enabled,
      lastModifiedBy: updatedToggle.lastModifiedBy,
      lastModifiedAt: updatedToggle.lastModifiedAt?.toISOString(),
      createdAt: updatedToggle.createdAt.toISOString(),
      updatedAt: updatedToggle.updatedAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to update toggle:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update feature toggle' },
      { status: 500 }
    );
  }
}
