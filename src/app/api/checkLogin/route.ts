import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch("http://127.0.0.1:6001/api/user/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    let message = "เกิดข้อผิดพลาดในการเชื่อมต่อ API";
    if (error instanceof Error) {
      message += `: ${error.message}`;
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}
