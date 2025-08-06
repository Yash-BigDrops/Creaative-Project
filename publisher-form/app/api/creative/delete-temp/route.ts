import { NextResponse } from "next/server";
import { del } from "@vercel/blob";

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fileUrl = searchParams.get("fileUrl");

    if (!fileUrl) {
      return NextResponse.json({ error: "No file URL provided" }, { status: 400 });
    }

    const url = new URL(fileUrl);
    const blobPath = url.pathname.substring(1);

    await del(blobPath);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
} 