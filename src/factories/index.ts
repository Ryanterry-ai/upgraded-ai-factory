import { WebsiteFactory } from './website/factory.js';
import { EcommerceFactory } from './ecommerce/factory.js';
import { SaasFactory } from './saas/factory.js';
import { AdminFactory } from './admin/factory.js';
import { DashboardFactory } from './dashboard/factory.js';
import { AgentFactory } from './agent/factory.js';
import { ToolsFactory } from './tools/factory.js';

export const allFactories = [
  WebsiteFactory,
  EcommerceFactory,
  SaasFactory,
  AdminFactory,
  DashboardFactory,
  AgentFactory,
  ToolsFactory,
];

export function getFactoryClasses() {
  return allFactories;
}

export { WebsiteFactory } from './website/factory.js';
export { EcommerceFactory } from './ecommerce/factory.js';
export { SaasFactory } from './saas/factory.js';
export { AdminFactory } from './admin/factory.js';
export { DashboardFactory } from './dashboard/factory.js';
export { AgentFactory } from './agent/factory.js';
export { ToolsFactory } from './tools/factory.js';
