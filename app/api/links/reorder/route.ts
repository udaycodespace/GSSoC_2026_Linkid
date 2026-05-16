import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

type Body = { orderedIds?: unknown };

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    let body: Body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const orderedIds = Array.isArray((body as Body).orderedIds)
      ? (body as Body).orderedIds
      : undefined;

    if (!orderedIds || !Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json({ error: "orderedIds is required" }, { status: 400 });
    }

    if (orderedIds.length > 500) {
      return NextResponse.json({ error: "Too many ids" }, { status: 400 });
    }

    // Convert to string ids and validate
    const ids = orderedIds.map((id) => String(id));

    // Verify ownership: fetch user's link ids
    const existingLinks = await prisma.link.findMany({ where: { userId: user.id }, select: { id: true } });
    const existingIds = new Set(existingLinks.map((l) => l.id));
    const invalid = ids.filter((id) => !existingIds.has(id));
    if (invalid.length > 0) {
      console.warn("[SECURITY] Unauthorized reorder attempt", { invalidCount: invalid.length });
      return NextResponse.json({ error: "Invalid link IDs" }, { status: 403 });
    }

    // Check duplicates
    const uniq = new Set(ids);
    if (uniq.size !== ids.length) {
      return NextResponse.json({ error: "Duplicate IDs in request" }, { status: 400 });
    }

    // Fetch current positions
    const current = await prisma.link.findMany({ where: { userId: user.id }, select: { id: true, position: true } });
    const currentMap = new Map(current.map((c) => [c.id, c.position]));

    const updates = ids
      .map((id, idx) => ({ id, newPosition: idx }))
      .filter(({ id, newPosition }) => currentMap.get(id) !== newPosition);

    if (updates.length === 0) return NextResponse.json({ ok: true, changed: 0 });

    // Atomic update
    await prisma.$transaction(
      updates.map((u) => prisma.link.update({ where: { id: u.id }, data: { position: u.newPosition } }))
    );

    return NextResponse.json({ ok: true, changed: updates.length });
  } catch (err) {
    console.error("/api/links/reorder error", err);
    return NextResponse.json({ error: "Failed to reorder" }, { status: 500 });
  }
}
