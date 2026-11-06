import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthFromRequest } from '@/lib/auth';


const VALID_STATUSES = ['available', 'reserved', 'sold', 'محجوب'];

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: 'الرجاء تسجيل الدخول للمتابعة' }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = await request.json();

    const errors = validateApartment(body, true);
    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(' - ') }, { status: 400 });
    }

    const apartment = await prisma.apartment.update({
      where: { id: parseInt(id) },
      data: {
        unitCode: body.unitCode || undefined,
        buildingName: body.buildingName ?? undefined,
        floor: body.floor ?? undefined,
        area: body.area ?? undefined,
        buildingArea: body.buildingArea ?? undefined,
        roofArea: body.roofArea ?? undefined,
        bedrooms: body.bedrooms === '' ? null : (body.bedrooms ?? undefined),
        bathrooms: body.bathrooms === '' ? null : (body.bathrooms ?? undefined),
        maidBathroom: body.maidBathroom ?? undefined,
        price: body.price !== undefined ? Number(body.price) : undefined,
        status: body.status || undefined,
        type: body.type || undefined,
        image: body.image ?? undefined,
        maidRoom: body.maidRoom ?? undefined,
        balcony: body.balcony ?? undefined,
        parking: body.parking ?? undefined,
        storage: body.storage ?? undefined,
        laundry: body.laundry ?? undefined,
        direction: body.direction ?? undefined,
        view: body.view ?? undefined,
      },
    });
    return NextResponse.json({ apartment });
  } catch (error: any) {
    console.error('Error updating apartment:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'كود الوحدة ده مستخدم بالفعل في نفس المشروع' },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: 'الرجاء تسجيل الدخول للمتابعة' }, { status: 401 });
  }

  const { id } = await params;
  try {
    await prisma.apartment.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting apartment:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}