/**
 * Service Layer Generator
 * Generates business logic services
 */

import type { DataModelPlan } from "../architecture-engine";

export interface ServiceGeneratorConfig {
  dataModels: DataModelPlan[];
}

export interface GeneratedService {
  path: string;
  content: string;
}

export function generateServices(config: ServiceGeneratorConfig): GeneratedService[] {
  const { dataModels } = config;
  
  return dataModels.map(model => ({
    path: `src/services/${model.name.toLowerCase()}.service.ts`,
    content: generateService(model),
  }));
}

function generateService(model: DataModelPlan): string {
  const entityName = model.name;
  const serviceName = `${entityName}Service`;
  
  return `/**
 * ${entityName} Service
 * Business logic layer for ${entityName} operations
 */

import { prisma } from '@/lib/prisma';
import type { ${entityName} } from '@prisma/client';

export class ${serviceName} {
  async create(data: Omit<${entityName}, 'id' | 'createdAt' | 'updatedAt'>): Promise<${entityName}> {
    return await prisma.${entityName.toLowerCase()}.create({
      data,
    });
  }
  
  async update(id: string, data: Partial<${entityName}>): Promise<${entityName}> {
    const existing = await prisma.${entityName.toLowerCase()}.findUnique({
      where: { id },
    });
    
    if (!existing) {
      throw new Error('${entityName} not found');
    }
    
    return await prisma.${entityName.toLowerCase()}.update({
      where: { id },
      data,
    });
  }
  
  async delete(id: string): Promise<void> {
    await prisma.${entityName.toLowerCase()}.delete({
      where: { id },
    });
  }
  
  async findMany(filters?: Partial<${entityName}>): Promise<${entityName}[]> {
    return await prisma.${entityName.toLowerCase()}.findMany({
      where: filters,
      orderBy: { createdAt: 'desc' },
    });
  }
  
  async findById(id: string): Promise<${entityName} | null> {
    return await prisma.${entityName.toLowerCase()}.findUnique({
      where: { id },
    });
  }
  
  async count(filters?: Partial<${entityName}>): Promise<number> {
    return await prisma.${entityName.toLowerCase()}.count({
      where: filters,
    });
  }
}

export const ${entityName.toLowerCase()}Service = new ${serviceName}();
`;
}
