import { StudioEngine } from '../core/engine.js';
import { WebsiteFactory } from '../factories/website/factory.js';
import { EcommerceFactory } from '../factories/ecommerce/factory.js';
import { SaasFactory } from '../factories/saas/factory.js';
import { AdminFactory } from '../factories/admin/factory.js';
import { DashboardFactory } from '../factories/dashboard/factory.js';
import { AgentFactory } from '../factories/agent/factory.js';
import { ToolsFactory } from '../factories/tools/factory.js';

export function createEngine(): StudioEngine {
  const engine = new StudioEngine();

  engine.registerFactory(new WebsiteFactory());
  engine.registerFactory(new EcommerceFactory());
  engine.registerFactory(new SaasFactory());
  engine.registerFactory(new AdminFactory());
  engine.registerFactory(new DashboardFactory());
  engine.registerFactory(new AgentFactory());
  engine.registerFactory(new ToolsFactory());

  return engine;
}
