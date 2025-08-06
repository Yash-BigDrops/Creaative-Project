import { NextResponse } from "next/server";
import { del } from "@vercel/blob";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { fileUrl } = data;

    if (!fileUrl) {
      return NextResponse.json({ error: "No file URL provided" }, { status: 400 });
    }

    const url = new URL(fileUrl);
    const blobPath = url.pathname.substring(1);

    await del(blobPath);

    return NextResponse.json({ 
      success: true,
      message: "Creative deleted successfully"
    });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
} 