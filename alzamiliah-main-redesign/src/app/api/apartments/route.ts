import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthFromRequest } from '@/lib/auth';



const VALID_STATUSES = ['available', 'reserved', 'sold', 'محجوب'];

/* تحقق مشترك — يترجعله array فيه رسائل الخطأ (فاضية لو كل حاجة تمام) */
function validateApartment(body: any, isUpdate: boolean): string[] {
  const errors: string[] = [];

  if (!isUpdate || body.unitCode !== undefined) {
    if (!body.unitCode || !String(body.unitCode).trim()) {
      errors.push('كود الوحدة مطلوب');
    }
  }
  if (!isUpdate || body.price !== undefined) {
    if (body.price === null || body.price === '' || isNaN(Number(body.price))) {
      errors.push('السعر مطلوب ويجب أن يكون رقمًا');
    }
  }
  if (!isUpdate || body.type !== undefined) {
    if (!body.type || !String(body.type).trim()) {
      errors.push('نوع الوحدة مطلوب');
    }
  }
  if (
    body.status !== undefined &&
    body.status !== null &&
    !VALID_STATUSES.includes(body.status)
  ) {
    errors.push('حالة الوحدة غير صحيحة');
  }

  return errors;
}

export async function GET(request: NextRequest) {
    const auth = await getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: 'الرجاء تسجيل الدخول للمتابعة' }, { status: 401 });
  }


  const projectId = request.nextUrl.searchParams.get('projectId');

  try {
    const apartments = await prisma.apartment.findMany({
      where: projectId ? { projectId: parseInt(projectId) } : {},
      orderBy: [{ buildingName: 'asc' }, { unitCode: 'asc' }],
    });
    return NextResponse.json({ apartments });
  } catch (error) {
    console.error('Error fetching apartments:', error);
    return NextResponse.json({ apartments: [] });
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json(
      { error: 'الرجاء تسجيل الدخول للمتابعة' },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();

    const errors = validateApartment(body, false);
    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(' - ') }, { status: 400 });
    }

    const apartment = await prisma.apartment.create({
      data: {
        unitCode: body.unitCode,
        buildingName: body.buildingName || null,
        floor: body.floor || null,
        area: body.area ?? null,
        buildingArea: body.buildingArea ?? null,
        roofArea: body.roofArea ?? null,
        bedrooms:
          body.bedrooms === '' || body.bedrooms == null
            ? null
            : Number(body.bedrooms),
        bathrooms:
          body.bathrooms === '' || body.bathrooms == null
            ? null
            : Number(body.bathrooms),
        maidBathroom: body.maidBathroom ?? 0,
        price: Number(body.price),
        status: body.status || 'available',
        projectId: body.projectId,
        type: body.type,
        image: body.image || null,

        maidRoom: body.maidRoom ?? 0,
        balcony: body.balcony ?? 0,
        parking: body.parking ?? 0,

        storage: body.storage ?? 0,
        laundry: body.laundry ?? 0,
        direction: body.direction || null,
        view: body.view || null,
      },
    });
    return NextResponse.json({ apartment });
  } catch (error: any) {
    console.error('Error creating apartment:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'كود الوحدة ده مستخدم بالفعل في نفس المشروع' },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}