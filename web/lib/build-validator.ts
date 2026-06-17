export interface ValidationResult {
  passed: boolean;
  score: number;
  checks: CheckResult[];
  buildSuccess: boolean;
}

export interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
  severity: "error" | "warning";
}

const REQUIRED_FILES = [
  "package.json",
  "tsconfig.json",
  "src/app/layout.tsx",
  "src/app/globals.css",
];

const REQUIRED_CONFIG_FIELDS = ["next", "react", "react-dom"];

export function validateBuild(
  files: Array<{ path: string; content: string; type: string }>
): ValidationResult {
  const checks: CheckResult[] = [];
  let hasErrors = false;

  // Detect if this is a static HTML site (scraped) vs React project
  const isStaticSite = files.some(f => f.path.endsWith(".html")) &&
    !files.some(f => f.path.endsWith(".tsx") || f.path.endsWith(".jsx"));

  if (isStaticSite) {
    // Static HTML site — only check for HTML files and an index
    const htmlFiles = files.filter(f => f.path.endsWith(".html"));
    checks.push({
      name: "html_files_exist",
      passed: htmlFiles.length > 0,
      message: htmlFiles.length > 0 ? `${htmlFiles.length} HTML files found` : "No HTML files found",
      severity: "error",
    });
    if (htmlFiles.length === 0) hasErrors = true;

    const hasIndex = htmlFiles.some(f => f.path === "index.html" || f.path.endsWith("/index.html"));
    checks.push({
      name: "index_html_exists",
      passed: hasIndex,
      message: hasIndex ? "index.html found" : "Missing index.html",
      severity: "error",
    });
    if (!hasIndex) hasErrors = true;

    // Check for linked assets (CSS, JS)
    const assetFiles = files.filter(f => f.path.endsWith(".css") || f.path.endsWith(".js"));
    checks.push({
      name: "assets_exist",
      passed: assetFiles.length > 0,
      message: assetFiles.length > 0 ? `${assetFiles.length} asset files found` : "No CSS/JS assets found",
      severity: "warning",
    });

    return {
      passed: !hasErrors,
      score: hasErrors ? 0 : 1,
      checks,
      buildSuccess: !hasErrors,
    };
  }

  // React/Next.js project — existing checks

  // Check required files exist
  for (const reqFile of REQUIRED_FILES) {
    const exists = files.some((f) => f.path === reqFile);
    checks.push({
      name: `required_file_${reqFile}`,
      passed: exists,
      message: exists ? `${reqFile} exists` : `Missing required file: ${reqFile}`,
      severity: "error",
    });
    if (!exists) hasErrors = true;
  }

  // Validate package.json
  const pkgFile = files.find((f) => f.path === "package.json");
  if (pkgFile) {
    try {
      const pkg = JSON.parse(pkgFile.content);
      for (const dep of REQUIRED_CONFIG_FIELDS) {
        const hasDep = pkg.dependencies?.[dep] || pkg.devDependencies?.[dep];
        checks.push({
          name: `dep_${dep}`,
          passed: !!hasDep,
          message: hasDep ? `${dep} in dependencies` : `Missing dependency: ${dep}`,
          severity: "error",
        });
        if (!hasDep) hasErrors = true;
      }
      if (!pkg.scripts?.build) {
        checks.push({
          name: "build_script",
          passed: false,
          message: "Missing build script in package.json",
          severity: "warning",
        });
      } else {
        checks.push({
          name: "build_script",
          passed: true,
          message: "Build script present",
          severity: "warning",
        });
      }
    } catch {
      checks.push({
        name: "package_json_parse",
        passed: false,
        message: "package.json is not valid JSON",
        severity: "error",
      });
      hasErrors = true;
    }
  }

  // Validate tsconfig.json
  const tsconfigFile = files.find((f) => f.path === "tsconfig.json");
  if (tsconfigFile) {
    try {
      const tsconfig = JSON.parse(tsconfigFile.content);
      const hasCompilerOptions = !!tsconfig.compilerOptions;
      checks.push({
        name: "tsconfig_options",
        passed: hasCompilerOptions,
        message: hasCompilerOptions
          ? "tsconfig.json has compilerOptions"
          : "tsconfig.json missing compilerOptions",
        severity: "error",
      });
      if (!hasCompilerOptions) hasErrors = true;
    } catch {
      checks.push({
        name: "tsconfig_parse",
        passed: false,
        message: "tsconfig.json is not valid JSON",
        severity: "error",
      });
      hasErrors = true;
    }
  }

  // Check component references in pages
  const pageFiles = files.filter((f) => f.type === "page");
  const componentFiles = files.filter((f) => f.type === "component");
  const componentNames = new Set(componentFiles.map((f) => {
    const match = f.path.match(/components\/(.+)\.tsx$/);
    return match?.[1];
  }));

  for (const page of pageFiles) {
    const importMatches = page.content.matchAll(
      /import\s*\{?\s*(\w+)\s*\}?\s*from\s*["']@\/components\/(\w+)["']/g
    );
    for (const match of importMatches) {
      const componentName = match[2];
      const exists = componentNames.has(componentName);
      checks.push({
        name: `import_${componentName}`,
        passed: exists,
        message: exists
          ? `Component ${componentName} exists`
          : `Missing component: ${componentName} (imported in ${page.path})`,
        severity: "error",
      });
      if (!exists) hasErrors = true;
    }
  }

  // Check for balanced braces in TSX files
  const tsxFiles = files.filter(
    (f) => f.path.endsWith(".tsx") || f.path.endsWith(".ts")
  );
  for (const file of tsxFiles) {
    const openBraces = (file.content.match(/{/g) || []).length;
    const closeBraces = (file.content.match(/}/g) || []).length;
    const balanced = Math.abs(openBraces - closeBraces) <= 1;
    checks.push({
      name: `braces_${file.path}`,
      passed: balanced,
      message: balanced
        ? `${file.path}: braces balanced`
        : `${file.path}: unbalanced braces (${openBraces} open, ${closeBraces} close)`,
      severity: "warning",
    });
  }

  // Check for "use client" where needed
  const interactiveComponents = ["ContactForm", "LoginForm", "RegisterForm", "Newsletter", "CartItems", "Sidebar"];
  for (const comp of componentFiles) {
    const compName = comp.path.match(/components\/(.+)\.tsx$/)?.[1];
    if (interactiveComponents.includes(compName || "")) {
      const hasUseClient = comp.content.includes('"use client"');
      checks.push({
        name: `use_client_${compName}`,
        passed: hasUseClient,
        message: hasUseClient
          ? `${compName} has "use client"`
          : `${compName} missing "use client" directive`,
        severity: "warning",
      });
    }
  }

  // Check layout.tsx has proper structure
  const layoutFile = files.find((f) => f.path === "src/app/layout.tsx");
  if (layoutFile) {
    const hasHtml = layoutFile.content.includes("<html");
    const hasBody = layoutFile.content.includes("<body");
    const hasMetadata = layoutFile.content.includes("Metadata");
    checks.push({
      name: "layout_structure",
      passed: hasHtml && hasBody,
      message:
        hasHtml && hasBody
          ? "Layout has html and body tags"
          : "Layout missing html or body tags",
      severity: "error",
    });
    if (!hasHtml || !hasBody) hasErrors = true;

    checks.push({
      name: "layout_metadata",
      passed: hasMetadata,
      message: hasMetadata
        ? "Layout exports Metadata"
        : "Layout missing Metadata export",
      severity: "warning",
    });
  }

  const errorCount = checks.filter(
    (c) => !c.passed && c.severity === "error"
  ).length;
  const warningCount = checks.filter(
    (c) => !c.passed && c.severity === "warning"
  ).length;
  const totalChecks = checks.length;
  const passedChecks = checks.filter((c) => c.passed).length;
  const score = totalChecks > 0 ? passedChecks / totalChecks : 0;

  return {
    passed: !hasErrors,
    score,
    checks,
    buildSuccess: !hasErrors && errorCount === 0,
  };
}
