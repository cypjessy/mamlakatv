/**
 * POST /api/releases/create
 *
 * Called by the build script (scripts/build-and-publish.sh → scripts/version.mjs record)
 * to record a new Android APK release in Firestore.
 *
 * Authentication: Bearer token matching BUILD_SECRET_TOKEN env var (shared build secret).
 *
 * Firestore writes: The API route signs in as a dedicated admin account so the write
 * passes Firestore security rules (isAdmin() requires an authenticated user with role == 'admin').
 */
import { NextRequest, NextResponse } from "next/server";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, collection, serverTimestamp } from "firebase/firestore";

const BUILD_SECRET = process.env.BUILD_SECRET_TOKEN || "";
const ADMIN_EMAIL = process.env.RELEASE_ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.RELEASE_ADMIN_PASSWORD || "";

export async function POST(request: NextRequest) {
  // ── Verify build secret ──
  const authHeader = request.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = authHeader.slice(7);
  if (!BUILD_SECRET || token !== BUILD_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse body ──
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { versionCode, versionName, downloadUrl, fileSize, releaseNotes } = body;

  if (!versionCode || !versionName || !downloadUrl) {
    return NextResponse.json(
      { error: "Missing required fields: versionCode, versionName, downloadUrl" },
      { status: 400 },
    );
  }

  // ── Sign in as admin so Firestore security rules allow the write ──
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "RELEASE_ADMIN_EMAIL / RELEASE_ADMIN_PASSWORD not configured" },
      { status: 500 },
    );
  }

  try {
    await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
  } catch (err: any) {
    console.error("[Releases API] Auth sign-in failed:", err);
    return NextResponse.json({ error: "Auth failed", details: err?.message }, { status: 500 });
  }

  // ── Write to Firestore ──
  try {
    const ref = doc(collection(db, "app_releases"));
    await setDoc(ref, {
      versionCode,
      versionName,
      downloadUrl,
      fileSize: fileSize || 0,
      releaseNotes: releaseNotes || "",
      createdAt: serverTimestamp(),
    });

    await signOut(auth);

    return NextResponse.json({ id: ref.id, success: true }, { status: 201 });
  } catch (err: any) {
    await signOut(auth).catch(() => {});
    console.error("[Releases API] Failed to create release:", err);
    return NextResponse.json(
      { error: "Failed to create release", details: err?.message },
      { status: 500 },
    );
  }
}
