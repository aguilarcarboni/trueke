import { NextResponse } from "next/server";
import { APIResponse } from "@/lib/api";

export async function GET(): Promise<NextResponse<APIResponse>> {
  return NextResponse.json({
    message: "Successfully connected to the backend",
    error: null,
  });
}
