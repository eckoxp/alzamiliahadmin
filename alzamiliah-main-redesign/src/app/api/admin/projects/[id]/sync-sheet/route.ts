import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { SheetValidationError, syncProjectFromSheet,  } from "@/lib/sheetSync";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { id } = await params;
  const projectId = parseInt(id);
  if (isNaN(projectId)) {
    return NextResponse.json({ error: "معرّف مشروع غير صحيح" }, { status: 400 });
  }

  try {
    const summary = await syncProjectFromSheet(projectId);
    return NextResponse.json({ success: true, summary });
  } catch (err: unknown) {
    

    if (err instanceof SheetValidationError) {

      console.warn("Sheet sync validation issues:", err.issues);
      // خطأ تحقق من البيانات (مش خطأ تقني) - نرجّع القايمة كاملة
      // عشان الواجهة تعرض كل مشكلة لوحدها بدل رسالة واحدة عامة
      return NextResponse.json(
        {
          error: err.message,
          validationIssues: err.issues,
        },
        { status: 422 },
      );
    }
    console.error("Sheet sync error:", err);

    const message = err instanceof Error ? err.message : "فشلت المزامنة";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
