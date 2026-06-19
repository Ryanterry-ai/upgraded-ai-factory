/**
 * Prisma Schema Generator
 * Generates production-ready Prisma schema from architecture data models
 */

import type { DataModelPlan } from "../architecture-engine";

export interface SchemaGeneratorConfig {
  dataModels: DataModelPlan[];
  databaseProvider?: "postgresql" | "mysql" | "sqlite";
  projectName: string;
}

export function generatePrismaSchema(config: SchemaGeneratorConfig): string {
  const { dataModels, databaseProvider = "postgresql" } = config;

  const header = `// Generated Prisma Schema
// Auto-generated - do not edit manually

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "${databaseProvider}"
  url      = env("DATABASE_URL")
}
`;

  const models = dataModels.map(model => generateModel(model, dataModels)).join('\n\n');

  return `${header}\n${models}`;
}

function generateModel(model: DataModelPlan, allModels: DataModelPlan[]): string {
  const modelName = model.name;
  const tableName = modelName.toLowerCase() + 's';
  
  // Generate fields
  const fields: string[] = [];
  
  // Add ID field
  fields.push('  id        String   @id @default(cuid())');
  
  // Add model fields
  model.fields.forEach(field => {
    if (field.name === 'id') return; // Skip, already added
    
    const prismaType = mapToPrismaType(field.type);
    const optional = field.required ? '' : '?';
    const unique = (field.name === 'email' || field.name === 'sku') ? ' @unique' : '';
    
    fields.push(`  ${field.name.padEnd(10)} ${prismaType}${optional}${unique}`);
  });
  
  // Add timestamps
  fields.push('  createdAt DateTime @default(now())');
  fields.push('  updatedAt DateTime @updatedAt');
  
  // Add relationships
  model.relationships.forEach(rel => {
    if (rel.type === 'belongsTo') {
      const fkField = rel.foreignKey || `${rel.target.toLowerCase()}Id`;
      const relationName = rel.target.toLowerCase();
      fields.push(`  ${fkField.padEnd(10)} String?`);
      fields.push(`  ${relationName.padEnd(10)} ${rel.target}? @relation(fields: [${fkField}], references: [id], onDelete: Cascade)`);
    } else if (rel.type === 'hasMany') {
      const relationName = rel.target.toLowerCase() + 's';
      fields.push(`  ${relationName.padEnd(10)} ${rel.target}[]`);
    }
  });
  
  // Generate indexes
  const indexes: string[] = [];
  model.relationships.forEach(rel => {
    if (rel.type === 'belongsTo' && rel.foreignKey) {
      indexes.push(`  @@index([${rel.foreignKey}])`);
    }
  });
  
  const indexableFields = ['email', 'status', 'createdAt'];
  model.fields.forEach(field => {
    if (indexableFields.includes(field.name)) {
      indexes.push(`  @@index([${field.name}])`);
    }
  });
  
  const allFields = [...fields, ...indexes, `  @@map("${tableName}")`].join('\n');
  
  return `model ${modelName} {\n${allFields}\n}`;
}

function mapToPrismaType(type: string): string {
  const typeMap: Record<string, string> = {
    'string': 'String',
    'number': 'Float',
    'integer': 'Int',
    'boolean': 'Boolean',
    'Date': 'DateTime',
    'date': 'DateTime',
    'enum': 'String',
    'array': 'Json',
    'object': 'Json',
  };
  
  return typeMap[type] || 'String';
}

export function generateSeedFile(config: SchemaGeneratorConfig): string {
  const { dataModels } = config;
  
  return `import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

${dataModels.map(model => generateSeedForModel(model)).join('\n\n')}

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`;
}

function generateSeedForModel(model: DataModelPlan): string {
  const entityName = model.name;
  const tableName = entityName.toLowerCase();
  
  return `  // Seed ${entityName}
  console.log('Seeding ${entityName}...');
  // Add seed data here`;
}

export function generatePrismaClient(): string {
  return `/**
 * Prisma Client Singleton
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
`;
}
