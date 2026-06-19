/**
 * API Route Generator
 * Generates Next.js App Router API routes with CRUD operations
 */

import type { DataModelPlan } from "../architecture-engine";

export interface APIGeneratorConfig {
  dataModels: DataModelPlan[];
}

export interface GeneratedAPIRoute {
  path: string;
  content: string;
}

export function generateAPIRoutes(config: APIGeneratorConfig): GeneratedAPIRoute[] {
  const { dataModels } = config;
  const routes: GeneratedAPIRoute[] = [];
  
  dataModels.forEach(model => {
    // Collection route
    routes.push({
      path: `src/app/api/${model.name.toLowerCase()}s/route.ts`,
      content: generateCollectionRoute(model),
    });
    
    // Item route
    routes.push({
      path: `src/app/api/${model.name.toLowerCase()}s/[id]/route.ts`,
      content: generateItemRoute(model),
    });
  });
  
  return routes;
}

function generateCollectionRoute(model: DataModelPlan): string {
  const entityName = model.name;
  const tableName = entityName.toLowerCase() + 's';
  const serviceName = entityName.toLowerCase() + 'Service';
  
  return `/**
 * ${entityName} Collection API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { ${serviceName} } from '@/services/${entityName.toLowerCase()}.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const items = await ${serviceName}.findMany({});
    const skip = (page - 1) * limit;
    const paginated = items.slice(skip, skip + limit);
    
    return NextResponse.json({
      data: paginated,
      pagination: {
        page,
        limit,
        total: items.length,
        totalPages: Math.ceil(items.length / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/${tableName} error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ${tableName}' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const item = await ${serviceName}.create(body);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('POST /api/${tableName} error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create ${entityName}' },
      { status: 500 }
    );
  }
}
`;
}

function generateItemRoute(model: DataModelPlan): string {
  const entityName = model.name;
  const tableName = entityName.toLowerCase() + 's';
  const serviceName = entityName.toLowerCase() + 'Service';
  
  return `/**
 * ${entityName} Item API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { ${serviceName} } from '@/services/${entityName.toLowerCase()}.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const item = await ${serviceName}.findById(params.id);
    if (!item) {
      return NextResponse.json(
        { error: '${entityName} not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(item);
  } catch (error) {
    console.error('GET /api/${tableName}/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ${entityName}' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const updated = await ${serviceName}.update(params.id, body);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT /api/${tableName}/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update ${entityName}' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ${serviceName}.delete(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/${tableName}/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete ${entityName}' },
      { status: 500 }
    );
  }
}
`;
}
