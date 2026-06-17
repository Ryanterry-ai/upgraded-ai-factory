import { getSupabase } from "./supabase";

export interface FeedbackInsight {
  factory: string;
  avgRating: number;
  totalFeedback: number;
  topCategories: Array<{ category: string; avgRating: number; count: number }>;
  commonIssues: string[];
}

export interface OptimizedBlueprint {
  pages: Array<{ path: string; name: string; components: string[] }>;
  components: string[];
  optimizations: string[];
}

export async function getFeedbackInsights(
  factory: string
): Promise<FeedbackInsight> {
  const supabase = getSupabase();

  const { data: projects } = await supabase
    .from("projects")
    .select("id")
    .eq("factory", factory);

  if (!projects || projects.length === 0) {
    return {
      factory,
      avgRating: 0,
      totalFeedback: 0,
      topCategories: [],
      commonIssues: [],
    };
  }

  const projectIds = projects.map((p) => p.id);

  const { data: feedback } = await supabase
    .from("feedback_entries")
    .select("rating, comment, category")
    .in("project_id", projectIds);

  if (!feedback || feedback.length === 0) {
    return {
      factory,
      avgRating: 0,
      totalFeedback: 0,
      topCategories: [],
      commonIssues: [],
    };
  }

  const avgRating =
    feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.length;

  const categoryMap: Record<
    string,
    { total: number; count: number }
  > = {};
  for (const f of feedback) {
    const cat = f.category || "general";
    if (!categoryMap[cat]) categoryMap[cat] = { total: 0, count: 0 };
    categoryMap[cat].total += f.rating || 0;
    categoryMap[cat].count++;
  }

  const topCategories = Object.entries(categoryMap)
    .map(([category, data]) => ({
      category,
      avgRating: data.total / data.count,
      count: data.count,
    }))
    .sort((a, b) => b.avgRating - a.avgRating);

  const commonIssues: string[] = [];
  for (const f of feedback) {
    if (f.rating <= 2 && f.comment) {
      commonIssues.push(f.comment);
    }
  }

  return {
    factory,
    avgRating,
    totalFeedback: feedback.length,
    topCategories,
    commonIssues: commonIssues.slice(0, 5),
  };
}

export function optimizeBlueprint(
  baseBlueprint: {
    pages: Array<{ path: string; name: string; components: string[] }>;
    components: string[];
  },
  insights: FeedbackInsight
): OptimizedBlueprint {
  const optimizations: string[] = [];
  const pages = [...baseBlueprint.pages];
  const components = [...baseBlueprint.components];

  if (insights.avgRating > 0 && insights.avgRating < 3) {
    optimizations.push(
      "Low feedback rating — adding more components for richer UI"
    );

    const homePage = pages.find((p) => p.path === "/");
    if (homePage) {
      if (!homePage.components.includes("Features")) {
        homePage.components.push("Features");
        components.push("Features");
        optimizations.push("Added Features section to home page");
      }
      if (!homePage.components.includes("Testimonials")) {
        homePage.components.push("Testimonials");
        components.push("Testimonials");
        optimizations.push("Added Testimonials section to home page");
      }
    }
  }

  const designFeedback = insights.topCategories.find(
    (c) => c.category === "design" && c.avgRating < 3
  );
  if (designFeedback) {
    optimizations.push(
      "Low design ratings — adding CTA and Newsletter for better UX"
    );
    const homePage = pages.find((p) => p.path === "/");
    if (homePage) {
      if (!homePage.components.includes("CTA")) {
        homePage.components.push("CTA");
        components.push("CTA");
      }
      if (!homePage.components.includes("Newsletter")) {
        homePage.components.push("Newsletter");
        components.push("Newsletter");
      }
    }
  }

  const contentFeedback = insights.topCategories.find(
    (c) => c.category === "content" && c.avgRating < 3
  );
  if (contentFeedback) {
    optimizations.push(
      "Low content ratings — ensuring About page has rich content"
    );
    const aboutPage = pages.find((p) => p.path === "/about");
    if (aboutPage && !aboutPage.components.includes("AboutContent")) {
      aboutPage.components.push("AboutContent");
      components.push("AboutContent");
    }
  }

  if (insights.commonIssues.length > 0) {
    optimizations.push(
      `Found ${insights.commonIssues.length} common issues in feedback`
    );
  }

  return {
    pages,
    components: [...new Set(components)],
    optimizations,
  };
}

export async function getOptimizedBlueprintForFactory(
  factory: string,
  baseBlueprint: {
    pages: Array<{ path: string; name: string; components: string[] }>;
    components: string[];
  }
): Promise<OptimizedBlueprint> {
  const insights = await getFeedbackInsights(factory);
  return optimizeBlueprint(baseBlueprint, insights);
}
