import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { fetchFeatureFlags } from '@/lib/azure';

// GET /api/resources/[resourceId]/toggles - Fetch feature toggles for a resource
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resourceId } = await params;

    // Get the resource
    const resource = await prisma.appConfigResource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // Fetch feature flags from Azure
    const azureFlags = await fetchFeatureFlags(resource.connectionString);

    // Sync with database - upsert all flags
    const togglePromises = azureFlags.map(async (flag) => {
      return prisma.featureToggle.upsert({
        where: {
          name_resourceId: {
            name: flag.key,
            resourceId: resource.id,
          },
        },
        update: {
          enabled: flag.enabled,
          description: flag.description,
          lastModifiedBy: flag.lastModifiedBy,
          lastModifiedAt: flag.lastModifiedAt ? new Date(flag.lastModifiedAt) : null,
        },
        create: {
          name: flag.key,
          description: flag.description,
          enabled: flag.enabled,
          lastModifiedBy: flag.lastModifiedBy,
          lastModifiedAt: flag.lastModifiedAt ? new Date(flag.lastModifiedAt) : null,
          resourceId: resource.id,
        },
      });
    });

    const toggles = await Promise.all(togglePromises);

    // Return toggles with formatted dates
    return NextResponse.json(
      toggles.map((toggle) => ({
        id: toggle.id,
        name: toggle.name,
        description: toggle.description,
        enabled: toggle.enabled,
        lastModifiedBy: toggle.lastModifiedBy,
        lastModifiedAt: toggle.lastModifiedAt?.toISOString(),
        createdAt: toggle.createdAt.toISOString(),
        updatedAt: toggle.updatedAt.toISOString(),
      }))
    );
  } catch (error: any) {
    console.error('Failed to fetch toggles:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch feature toggles' },
      { status: 500 }
    );
  }
}
