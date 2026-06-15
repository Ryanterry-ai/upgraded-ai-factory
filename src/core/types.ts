// ═══════════════════════════════════════════════════════════
// Upgraded AI Factory Studio — Core Types
// ═══════════════════════════════════════════════════════════

// ── Input Types ──────────────────────────────────────────
export type InputType = 'prompt' | 'url' | 'screenshot' | 'figma' | 'pdf' | 'codebase';

export interface StudioInput {
  type: InputType;
  prompt?: string;
  url?: string;
  screenshotPath?: string;
  figmaUrl?: string;
  figmaToken?: string;
  pdfPath?: string;
  codebasePath?: string;
  metadata?: Record<string, unknown>;
}

// ── Factory Types ────────────────────────────────────────
export type FactoryType =
  | 'website'
  | 'ecommerce'
  | 'saas'
  | 'admin'
  | 'dashboard'
  | 'agent'
  | 'tools';

export interface FactoryConfig {
  name: string;
  type: FactoryType;
  description: string;
  supportedInputs: InputType[];
  outputFormats: string[];
  version: string;
}

export interface FactoryResult {
  success: boolean;
  factory: FactoryType;
  outputDir: string;
  files: GeneratedFile[];
  blueprint: Blueprint;
  metadata: FactoryMetadata;
  errors?: string[];
}

export interface GeneratedFile {
  path: string;
  content: string;
  type: 'component' | 'page' | 'config' | 'style' | 'type' | 'util' | 'api' | 'schema' | 'doc';
}

export interface FactoryMetadata {
  startTime: number;
  endTime: number;
  duration: number;
  inputType: InputType;
  outputFormat: string;
  fileCount: number;
  totalSize: number;
}

// ── Blueprint Types ──────────────────────────────────────
export interface Blueprint {
  $schema: string;
  version: string;
  project: BlueprintProject;
  pages: BlueprintPage[];
  components: BlueprintComponent[];
  navigation: BlueprintNavigation;
  typography: BlueprintTypography;
  colors: BlueprintColors;
  spacing: BlueprintSpacing;
  animations: BlueprintAnimations;
  interactions: BlueprintInteractions;
  responsive: BlueprintResponsive;
  seo: BlueprintSEO;
  accessibility: BlueprintAccessibility;
  performance: BlueprintPerformance;
  dataModels: DataModel[];
  apiContracts: ApiContract[];
  deployment: BlueprintDeployment;
}

export interface BlueprintProject {
  name: string;
  description: string;
  framework: string;
  styling: string;
  language: string;
  url?: string;
  generatedAt: string;
  version: string;
}

export interface BlueprintPage {
  path: string;
  name: string;
  description: string;
  components: string[];
  isPrimary: boolean;
}

export interface BlueprintComponent {
  name: string;
  type: 'atomic' | 'molecular' | 'organism' | 'template';
  tag: string;
  classes: string[];
  props: ComponentProp[];
  variants: ComponentVariant[];
  children: string[];
  parent: string | null;
  selector: string;
}

export interface ComponentProp {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  description?: string;
}

export interface ComponentVariant {
  name: string;
  description: string;
}

export interface BlueprintNavigation {
  type: 'header' | 'sidebar' | 'footer' | 'mixed';
  items: NavItem[];
  isSticky: boolean;
  isResponsive: boolean;
}

export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
  isExternal: boolean;
}

export interface BlueprintTypography {
  fontFamilies: string[];
  fontSizes: FontSize[];
  fontWeights: number[];
  lineHeights: number[];
  headingStyles: HeadingStyle[];
}

export interface FontSize {
  name: string;
  value: string;
  usage: string;
}

export interface HeadingStyle {
  tag: string;
  fontSize: string;
  fontWeight: number;
  lineHeight: string;
  color: string;
}

export interface BlueprintColors {
  primary: ColorPalette;
  secondary: ColorPalette;
  accent: ColorPalette;
  neutral: ColorPalette;
  semantic: SemanticColors;
  background: string;
  foreground: string;
}

export interface ColorPalette {
  light: string;
  main: string;
  dark: string;
  contrast: string;
}

export interface SemanticColors {
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface BlueprintSpacing {
  gridSystem: '4px' | '8px';
  marginScale: string[];
  paddingScale: string[];
  gapScale: string[];
  sectionSpacing: string;
  containerMaxWidth: string;
  containerPadding: string;
}

export interface BlueprintAnimations {
  transitions: Transition[];
  hoverEffects: HoverEffect[];
  scrollEffects: string[];
}

export interface Transition {
  property: string;
  duration: string;
  easing: string;
}

export interface HoverEffect {
  selector: string;
  properties: Record<string, string>;
}

export interface BlueprintInteractions {
  buttons: ButtonInteraction[];
  forms: FormInteraction[];
  modals: ModalInteraction[];
}

export interface ButtonInteraction {
  selector: string;
  variants: string[];
  states: string[];
}

export interface FormInteraction {
  selector: string;
  fields: FormField[];
  validation: string[];
}

export interface FormField {
  name: string;
  type: string;
  required: boolean;
  placeholder?: string;
}

export interface ModalInteraction {
  selector: string;
  trigger: string;
}

export interface BlueprintResponsive {
  breakpoints: Breakpoints;
  mobile: ResponsiveRules;
  tablet: ResponsiveRules;
  desktop: ResponsiveRules;
}

export interface Breakpoints {
  mobile: string;
  tablet: string;
  desktop: string;
  wide: string;
}

export interface ResponsiveRules {
  layout: string;
  columns: number;
  gutter: string;
  fontSize: string;
}

export interface BlueprintSEO {
  title: string;
  description: string;
  keywords: string[];
  openGraph: OpenGraph;
  structuredData: string[];
  sitemap: boolean;
  robots: string;
}

export interface OpenGraph {
  title: string;
  description: string;
  image: string;
  type: string;
}

export interface BlueprintAccessibility {
  wcagLevel: string;
  skipLinks: boolean;
  ariaLabels: boolean;
  keyboardNavigation: boolean;
  colorContrast: boolean;
  focusStates: boolean;
}

export interface BlueprintPerformance {
  coreWebVitals: CoreWebVitals;
  bundleBudget: string;
  imageOptimization: boolean;
  codeSplitting: boolean;
  lazyLoading: boolean;
}

export interface CoreWebVitals {
  lcp: number;
  fid: number;
  cls: number;
}

export interface DataModel {
  name: string;
  fields: DataField[];
  relations: DataRelation[];
}

export interface DataField {
  name: string;
  type: string;
  required: boolean;
  unique: boolean;
  default?: string;
}

export interface DataRelation {
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  target: string;
  field: string;
}

export interface ApiContract {
  method: string;
  path: string;
  description: string;
  request: Record<string, unknown>;
  response: Record<string, unknown>;
}

export interface BlueprintDeployment {
  platform: string;
  environment: string;
  domain: string;
  ssl: boolean;
  cdn: boolean;
}

// ── Engine Types ─────────────────────────────────────────
export interface EngineConfig {
  outputDir: string;
  verbose: boolean;
  dryRun: boolean;
}

export interface EngineResult {
  success: boolean;
  results: FactoryResult[];
  totalDuration: number;
  totalFiles: number;
  totalSize: number;
}

// ── Event Types ──────────────────────────────────────────
export type StudioEvent =
  | { type: 'input:received'; input: StudioInput }
  | { type: 'factory:selected'; factory: FactoryType }
  | { type: 'factory:started'; factory: FactoryType }
  | { type: 'factory:progress'; factory: FactoryType; message: string; percent: number }
  | { type: 'factory:completed'; factory: FactoryType; result: FactoryResult }
  | { type: 'factory:failed'; factory: FactoryType; error: string }
  | { type: 'engine:completed'; result: EngineResult };

export type EventHandler = (event: StudioEvent) => void;
