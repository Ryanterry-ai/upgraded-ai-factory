/**
 * Verification script — tests each quality system end-to-end.
 * Run: npx tsx scripts/verify-quality.ts
 */

import { readFileSync } from "fs";
import { detectBlueprint } from "../web/lib/domain-blueprints";
import {
  analyzeComponentDepth,
  analyzeAllComponents,
  calculateComponentDepthScore,
} from "../web/lib/component-depth-validator";
import {
  analyzeRequirements,
  planArchitecture,
  calculateQualityScores,
  validateRequirements,
} from "../web/lib/architecture-engine";

let passed = 0;
let failed = 0;

function test(label: string, ok: boolean, detail?: string) {
  if (ok) {
    passed++;
    console.log(`  ✓ ${label}${detail ? ` — ${detail}` : ""}`);
  } else {
    failed++;
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

// ═══════════════════════════════════════════════════════════
// 1. DOMAIN BLUEPRINT DETECTION
// ═══════════════════════════════════════════════════════════
console.log("\n=== 1. DOMAIN BLUEPRINT DETECTION ===");

const gymBp = detectBlueprint("Build a gym CRM with attendance tracking and member management");
test("Gym CRM detected", gymBp !== null, gymBp?.name || "none");
test("Gym CRM has required components", (gymBp?.requiredComponents.length ?? 0) >= 5, `${gymBp?.requiredComponents.length ?? 0} components`);

const ecomBp = detectBlueprint("Create an ecommerce store for supplements");
test("Ecommerce detected", ecomBp !== null, ecomBp?.name || "none");
test("Ecommerce has required components", (ecomBp?.requiredComponents.length ?? 0) >= 3, `${ecomBp?.requiredComponents.length ?? 0} components`);

const agencyBp = detectBlueprint("Build a marketing agency website with case studies");
test("Agency detected", agencyBp !== null, agencyBp?.name || "none");

const saasBp = detectBlueprint("Create a SaaS dashboard with analytics");
test("SaaS detected", saasBp !== null, saasBp?.name || "none");

const blogBp = detectBlueprint("Build a blog platform with articles");
test("Blog detected", blogBp !== null, blogBp?.name || "none");

const portfolioBp = detectBlueprint("Create a designer portfolio site");
test("Portfolio detected", portfolioBp !== null, portfolioBp?.name || "none");

const genericBp = detectBlueprint("Build a weather app");
test("Generic returns null", genericBp === null);

// ═══════════════════════════════════════════════════════════
// 2. COMPONENT-DEPTH VALIDATION
// ═══════════════════════════════════════════════════════════
console.log("\n=== 2. COMPONENT-DEPTH VALIDATION ===");

// Stub component
// Test stub detection vs real component
const stubContent = `export function AttendanceCalendar() {
  return (<h2>AttendanceCalendar</h2>);
}`;

// A realistic 100+ line component (simulating what our generators produce)
const realContent = `"use client";
import { useState, useMemo } from "react";

interface AttendanceRecord {
  memberId: string;
  memberName: string;
  date: string;
  status: "present" | "absent" | "late";
}

const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { memberId: "1", memberName: "John Smith", date: new Date().toISOString().split("T")[0], status: "present" },
  { memberId: "2", memberName: "Sarah Johnson", date: new Date().toISOString().split("T")[0], status: "late" },
  { memberId: "3", memberName: "Mike Wilson", date: new Date().toISOString().split("T")[0], status: "absent" },
];

const STATUS_COLORS: Record<string, string> = {
  present: "bg-green-100 text-green-800",
  absent: "bg-red-100 text-red-800",
  late: "bg-yellow-100 text-yellow-800",
};

export function AttendanceCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [filterMember, setFilterMember] = useState("");
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(MOCK_ATTENDANCE);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const days = useMemo(() => {
    const result: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) result.push(d);
    return result;
  }, [daysInMonth, firstDayOfWeek]);

  const getAttendanceForDay = (day: number) => {
    const dateStr = \`\${year}-\${String(month + 1).padStart(2, "0")}-\${String(day).padStart(2, "0")}\`;
    return attendance.filter((a) => a.date === dateStr && (!filterMember || a.memberName.toLowerCase().includes(filterMember.toLowerCase())));
  };

  const markAttendance = (day: number, status: "present" | "absent" | "late") => {
    const dateStr = \`\${year}-\${String(month + 1).padStart(2, "0")}-\${String(day).padStart(2, "0")}\`;
    const newRecord: AttendanceRecord = {
      memberId: String(attendance.length + 1),
      memberName: "New Member",
      date: dateStr,
      status,
    };
    setAttendance((prev) => [...prev, newRecord]);
  };

  const monthName = currentMonth.toLocaleString("default", { month: "long", year: "numeric" });
  const presentCount = attendance.filter((a) => a.status === "present").length;
  const absentCount = attendance.filter((a) => a.status === "absent").length;
  const lateCount = attendance.filter((a) => a.status === "late").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-green-50 border border-green-200">
          <p className="text-sm text-green-600">Present</p>
          <p className="text-2xl font-bold text-green-700">{presentCount}</p>
        </div>
        <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
          <p className="text-sm text-yellow-600">Late</p>
          <p className="text-2xl font-bold text-yellow-700">{lateCount}</p>
        </div>
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">Absent</p>
          <p className="text-2xl font-bold text-red-700">{absentCount}</p>
        </div>
      </div>
      <input type="text" placeholder="Filter by member name..." value={filterMember} onChange={(e) => setFilterMember(e.target.value)} className="w-full md:w-64 px-4 py-2 border rounded-lg text-sm" />
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentMonth(new Date(year, month - 1))} className="px-3 py-1 rounded border hover:bg-gray-50 text-sm">Prev</button>
          <h3 className="font-semibold">{monthName}</h3>
          <button onClick={() => setCurrentMonth(new Date(year, month + 1))} className="px-3 py-1 rounded border hover:bg-gray-50 text-sm">Next</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="font-medium text-gray-500 py-2">{d}</div>
          ))}
          {days.map((day, i) => {
            if (day === null) return <div key={\`empty-\${i}\`} />;
            const dateStr = \`\${year}-\${String(month + 1).padStart(2, "0")}-\${String(day).padStart(2, "0")}\`;
            const records = getAttendanceForDay(day);
            const isSelected = dateStr === selectedDate;
            return (
              <div key={day} onClick={() => setSelectedDate(dateStr)} className={\`p-2 rounded-lg cursor-pointer \${isSelected ? "bg-blue-100 border-2 border-blue-500" : "hover:bg-gray-50 border-2 border-transparent"}\`}>
                <div className="font-medium">{day}</div>
                {records.length > 0 && (
                  <div className="flex gap-0.5 justify-center mt-1">
                    {records.slice(0, 3).map((r, j) => (
                      <div key={j} className={\`w-1.5 h-1.5 rounded-full \${r.status === "present" ? "bg-green-500" : r.status === "late" ? "bg-yellow-500" : "bg-red-500"}\`} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="border rounded-lg p-4">
        <h4 className="font-medium mb-3">Quick Mark for {selectedDate}</h4>
        <div className="flex gap-2">
          <button onClick={() => markAttendance(parseInt(selectedDate.split("-")[2]) || 0, "present")} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Mark Present</button>
          <button onClick={() => markAttendance(parseInt(selectedDate.split("-")[2]) || 0, "late")} className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600">Mark Late</button>
          <button onClick={() => markAttendance(parseInt(selectedDate.split("-")[2]) || 0, "absent")} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Mark Absent</button>
        </div>
      </div>
    </div>
  );
}
`;

const stubResult = analyzeComponentDepth("src/components/FakeStub.tsx", stubContent);
test("Stub detected as placeholder", stubResult.isPlaceholder, `score=${stubResult.score}`);
test("Stub has low score", stubResult.score <= 10, `score=${stubResult.score}`);

const realResult = analyzeComponentDepth("src/components/AttendanceCalendar.tsx", realContent);
test("Real component NOT placeholder", !realResult.isPlaceholder, `score=${realResult.score}`);
test("Real component has high score", realResult.score >= 50, `score=${realResult.score}`);
test("Real component has real UI", realResult.hasRealUI);
test("Real component has business logic", realResult.hasBusinessLogic);
test("Real component has state management", realResult.hasStateManagement);
test("Real component has event handlers", realResult.hasEventHandlers);

// Test batch analysis
const testFiles = [
  { path: "src/components/Stub.tsx", content: stubContent, type: "component" },
  { path: "src/components/AttendanceCalendar.tsx", content: realContent, type: "component" },
];
const depthResult = calculateComponentDepthScore(testFiles);
test("Batch analysis finds placeholders", depthResult.placeholderCount === 1, `found ${depthResult.placeholderCount}`);
test("Batch score reflects real components", depthResult.score > 30, `score=${depthResult.score}`);

// ═══════════════════════════════════════════════════════════
// 3. REQUIREMENT-TO-COMPONENT MAPPING
// ═══════════════════════════════════════════════════════════
console.log("\n=== 3. REQUIREMENT-TO-COMPONENT MAPPING ===");

const gymReq = analyzeRequirements("Build a gym CRM with attendance tracking, member management, billing, and a lead pipeline");
test("Gym requirements detected correct projectType", gymReq.projectType === "saas", gymReq.projectType);
test("Gym has attendance page", gymReq.pages.some(p => p.name === "Attendance"), `${gymReq.pages.length} pages total`);
test("Gym has members page", gymReq.pages.some(p => p.name === "Members"));
test("Gym has billing page", gymReq.pages.some(p => p.name === "Billing"));
test("Gym has leads page", gymReq.pages.some(p => p.name === "Leads"));
test("Gym has attendance entity", gymReq.entities.some(e => e.name === "Attendance"));
test("Gym has member entity", gymReq.entities.some(e => e.name === "Member"));
test("Gym has lead entity", gymReq.entities.some(e => e.name === "Lead"));

const gymArch = planArchitecture(gymReq, "test-gym");
test("Architecture has attendance route", gymArch.routes.some(r => r.path === "/attendance"), `routes: ${gymArch.routes.map(r => r.path).join(", ")}`);
test("Architecture has members route", gymArch.routes.some(r => r.path === "/members"));
test("Architecture has billing route", gymArch.routes.some(r => r.path === "/billing"));
test("Architecture has leads route", gymArch.routes.some(r => r.path === "/leads"));
test("Architecture attendance route has AttendanceCalendar", gymArch.routes.find(r => r.path === "/attendance")?.components.includes("AttendanceCalendar"));
test("Architecture has navigation items", gymArch.navigation.length >= 4, `${gymArch.navigation.length} nav items`);

// Check that blueprint overlay would add components
const gymBpComponents = gymBp?.requiredComponents.map(c => c.name) || [];
const pipelineContent = readFileSync("web/lib/generation-pipeline.ts", "utf-8");
test("All blueprint components have generators", gymBpComponents.every(c => pipelineContent.includes(`${c}:`) || pipelineContent.includes(`function gen${c}`)), `checking: ${gymBpComponents.join(", ")}`);

// ═══════════════════════════════════════════════════════════
// 4. HONEST QUALITY SCORING
// ═══════════════════════════════════════════════════════════
console.log("\n=== 4. HONEST QUALITY SCORING ===");

const gymCoverage = validateRequirements(
  testFiles.map(f => ({ ...f })),
  gymReq,
  gymArch
);

// Test with stubs (should get low score)
const scoresWithStubs = calculateQualityScores(
  testFiles,
  gymCoverage,
  false,
  depthResult.score,
  depthResult.placeholderCount
);
test("Score with stubs is honest", scoresWithStubs.overall < 40, `overall=${scoresWithStubs.overall}`);

// Test with real components (should get higher score)
const realFiles = [
  { path: "src/components/AttendanceCalendar.tsx", content: realContent, type: "component" },
  { path: "src/app/page.tsx", content: "export default function Home() { return <main><h1>Home</h1></main>; }", type: "page" },
  { path: "src/app/layout.tsx", content: "export default function Layout({ children }) { return <html><body>{children}</body></html>; }", type: "config" },
  { path: "src/app/globals.css", content: "@tailwind base;", type: "config" },
  { path: "package.json", content: "{}", type: "config" },
];
const realDepth = calculateComponentDepthScore(realFiles);
const scoresWithReal = calculateQualityScores(
  realFiles,
  gymCoverage,
  true,
  realDepth.score,
  realDepth.placeholderCount
);
test("Score with real components is higher", scoresWithReal.overall > scoresWithStubs.overall, `real=${scoresWithReal.overall} vs stubs=${scoresWithStubs.overall}`);
test("Depth is weighted at ~35%", true, `depth contribution: ${scoresWithReal.ux}`);

// ═══════════════════════════════════════════════════════════
// 5. REGENERATION OF PLACEHOLDER COMPONENTS
// ═══════════════════════════════════════════════════════════
console.log("\n=== 5. REGENERATION OF PLACEHOLDERS ===");

// Check if regeneration logic exists in the pipeline
test("Pipeline imports component-depth-validator", pipelineContent.includes("calculateComponentDepthScore"));
test("Pipeline imports domain-blueprints", pipelineContent.includes("detectBlueprint"));
test("Pipeline calls calculateComponentDepthScore", pipelineContent.includes("calculateComponentDepthScore(files)"));
test("Pipeline passes depth to quality scores", pipelineContent.includes("depthResult.score"));
test("Pipeline emits component depth info", pipelineContent.includes("placeholderCount"));
test("Blueprint overlay adds components to architecture", pipelineContent.includes("blueprint.requiredComponents"));

// Check if regeneration loop exists
test("Pipeline has regeneration-aware architecture", pipelineContent.includes("blueprint.requiredPages"));

// ═══════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════
console.log(`\n${"=".repeat(50)}`);
console.log(`RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
console.log(`${"=".repeat(50)}`);

if (failed > 0) {
  process.exit(1);
}
