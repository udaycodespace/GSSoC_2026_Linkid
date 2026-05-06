import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateUsername } from "@/lib/validations/username";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, userId, ...otherFields } = body;

    if (username !== undefined) {
      const validation = validateUsername(username);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      const existing = await prisma.user.findFirst({
        where: {
          username,
          NOT: { id: userId },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 409 }
        );
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { ...(username && { username }), ...otherFields },
    });

    return NextResponse.json({ success: true, user }, { status: 200 });

  } catch (error: unknown) {
    const err = error as { code?: string; meta?: { target?: string[] } };
    if (err.code === "P2002" && err.meta?.target?.includes("username")) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
