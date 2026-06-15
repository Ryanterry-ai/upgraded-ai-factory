export interface BlueprintProject {
  name: string;
  description: string;
  framework: string;
  styling: string;
  language: string;
  url: string;
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
  type: 'atomic' | 'molecular' | 'organism';
  tag: string;
  classes: string[];
  props: BlueprintProp[];
  variants: BlueprintVariant[];
  children: string[];
  parent: string | null;
  selector: string;
  text?: string;
  image?: BlueprintImage;
  link?: BlueprintLink;
}

export interface BlueprintProp {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  description?: string;
}

export interface BlueprintVariant {
  name: string;
  description: string;
  selector: string;
}

export interface BlueprintImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface BlueprintLink {
  href: string;
  text: string;
  isExternal: boolean;
}

export interface BlueprintNavigation {
  type: 'header' | 'sidebar' | 'footer' | 'mixed';
  items: BlueprintNavItem[];
  isSticky: boolean;
  isResponsive: boolean;
}

export interface BlueprintNavItem {
  label: string;
  href: string;
  children?: BlueprintNavItem[];
  isExternal: boolean;
}

export interface BlueprintTypography {
  fontFamilies: string[];
  fontSizes: BlueprintFontSize[];
  fontWeights: number[];
  lineHeights: number[];
  headingStyles: BlueprintHeadingStyle[];
}

export interface BlueprintFontSize {
  name: string;
  value: string;
  usage: string;
}

export interface BlueprintHeadingStyle {
  tag: string;
  fontSize: string;
  fontWeight: number;
  lineHeight: string;
  color: string;
}

export interface BlueprintColors {
  primary: BlueprintColorPalette;
  secondary: BlueprintColorPalette;
  accent: BlueprintColorPalette;
  neutral: BlueprintColorPalette;
  semantic: BlueprintSemanticColors;
  background: string;
  foreground: string;
}

export interface BlueprintColorPalette {
  light: string;
  main: string;
  dark: string;
  contrast: string;
}

export interface BlueprintSemanticColors {
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
  transitions: BlueprintTransition[];
  hoverEffects: BlueprintHoverEffect[];
  scrollEffects: string[];
}

export interface BlueprintTransition {
  property: string;
  duration: string;
  easing: string;
}

export interface BlueprintHoverEffect {
  selector: string;
  properties: Record<string, string>;
}

export interface BlueprintInteractions {
  buttons: BlueprintButtonInteraction[];
  forms: BlueprintFormInteraction[];
  modals: BlueprintModalInteraction[];
}

export interface BlueprintButtonInteraction {
  selector: string;
  variants: string[];
  states: string[];
}

export interface BlueprintFormInteraction {
  selector: string;
  fields: BlueprintFormField[];
  validation: string[];
}

export interface BlueprintFormField {
  name: string;
  type: string;
  required: boolean;
  placeholder?: string;
}

export interface BlueprintModalInteraction {
  selector: string;
  trigger: string;
  content: string;
}

export interface BlueprintResponsive {
  breakpoints: BlueprintBreakpoints;
  mobile: BlueprintResponsiveRules;
  tablet: BlueprintResponsiveRules;
  desktop: BlueprintResponsiveRules;
}

export interface BlueprintBreakpoints {
  mobile: string;
  tablet: string;
  desktop: string;
  wide: string;
}

export interface BlueprintResponsiveRules {
  layout: string;
  columns: number;
  gutter: string;
  fontSize: string;
}

export interface BlueprintSEO {
  title: string;
  description: string;
  keywords: string[];
  openGraph: BlueprintOpenGraph;
  structuredData: string[];
  sitemap: boolean;
  robots: string;
}

export interface BlueprintOpenGraph {
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
  coreWebVitals: BlueprintCoreWebVitals;
  bundleBudget: string;
  imageOptimization: boolean;
  codeSplitting: boolean;
  lazyLoading: boolean;
}

export interface BlueprintCoreWebVitals {
  lcp: number;
  fid: number;
  cls: number;
}

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
  designTokens: Record<string, unknown>;
  dataModels: string[];
  apiContracts: string[];
  deployment: BlueprintDeployment;
}

export interface BlueprintDeployment {
  platform: string;
  environment: string;
  domain: string;
  ssl: boolean;
  cdn: boolean;
}

export interface AnalysisInput {
  url: string;
  screenshotPath?: string;
  userPrompt?: string;
  html?: string;
}

export interface AnalysisResult {
  structure: StructureAnalysis;
  design: DesignAnalysis;
  components: ComponentAnalysis;
  metadata: MetadataAnalysis;
}

export interface StructureAnalysis {
  title: string;
  description: string;
  lang: string;
  favicon: string;
  metaTags: Record<string, string>;
  links: StructureLink[];
  images: StructureImage[];
  headings: StructureHeading[];
  forms: StructureForm[];
  scripts: string[];
  stylesheets: string[];
}

export interface StructureLink {
  href: string;
  text: string;
  isExternal: boolean;
  isNavigation: boolean;
}

export interface StructureImage {
  src: string;
  alt: string;
  width?: string;
  height?: string;
}

export interface StructureHeading {
  level: number;
  text: string;
  id?: string;
}

export interface StructureForm {
  action: string;
  method: string;
  fields: StructureFormField[];
}

export interface StructureFormField {
  name: string;
  type: string;
  required: boolean;
  placeholder?: string;
  label?: string;
}

export interface DesignAnalysis {
  colors: DesignColors;
  typography: DesignTypography;
  spacing: DesignSpacing;
  layout: DesignLayout;
}

export interface DesignColors {
  primary: string[];
  secondary: string[];
  accent: string[];
  neutral: string[];
  background: string[];
  text: string[];
}

export interface DesignTypography {
  families: string[];
  sizes: DesignFontSize[];
  weights: number[];
}

export interface DesignFontSize {
  size: string;
  usage: string;
}

export interface DesignSpacing {
  gaps: string[];
  paddings: string[];
  margins: string[];
}

export interface DesignLayout {
  hasHeader: boolean;
  hasFooter: boolean;
  hasSidebar: boolean;
  maxWidth: string;
  columns: number;
}

export interface ComponentAnalysis {
  components: IdentifiedComponent[];
  hierarchy: ComponentHierarchy;
}

export interface IdentifiedComponent {
  name: string;
  type: 'atomic' | 'molecular' | 'organism';
  selector: string;
  tag: string;
  classes: string[];
  description: string;
  confidence: number;
}

export interface ComponentHierarchy {
  root: string;
  children: ComponentTreeNode[];
}

export interface ComponentTreeNode {
  tag: string;
  classes: string[];
  children: ComponentTreeNode[];
}

export interface MetadataAnalysis {
  generator: string;
  viewport: string;
  charset: string;
  language: string;
  favicon: string;
  appleTouchIcon: string;
  themeColor: string;
}
