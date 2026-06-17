import { NextRequest, NextResponse } from "next/server";
import { getAsset } from "@/lib/clone-store";

export async function GET(
  _req: NextRequest,
  { params }: { params: { projectId: string; path: string[] } }
) {
  const projectId = params.projectId;
  const assetPath = "/" + (params.path?.join("/") || "");

  const asset = getAsset(projectId, assetPath);
  if (!asset) {
    return new NextResponse("Asset not found", { status: 404 });
  }

  return new NextResponse(Buffer.from(asset.buffer), {
    headers: {
      "Content-Type": asset.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
