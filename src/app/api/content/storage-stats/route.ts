import { NextResponse } from "next/server";
import { getBunnyStorageStats, formatBytes } from "@/lib/bunny";

export async function GET() {
  try {
    const stats = await getBunnyStorageStats();

    const totalBytes = 10 * 1024 * 1024 * 1024; // 10 GB assumed limit
    const usedGB = stats.totalBytes / (1024 * 1024 * 1024);
    const totalGB = totalBytes / (1024 * 1024 * 1024);
    const percentUsed = Math.round((stats.totalBytes / totalBytes) * 100);

    return NextResponse.json({
      usedGB: parseFloat(usedGB.toFixed(1)),
      totalGB,
      percentUsed,
      formattedUsed: formatBytes(stats.totalBytes),
      formattedTotal: "10 GB",
      totalFiles: stats.totalFiles,
      totalDirectories: stats.totalDirectories,
    });
  } catch (err: any) {
    console.error("Storage stats error:", err);
    // Return fallback so the UI doesn't break
    return NextResponse.json({
      usedGB: 0,
      totalGB: 10,
      percentUsed: 0,
      formattedUsed: "0 B",
      formattedTotal: "10 GB",
      totalFiles: 0,
      totalDirectories: 0,
    });
  }
}
