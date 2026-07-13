import { NextResponse } from 'next/server';
import { MODEL_PRICING } from '@/config/modelPricing';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(MODEL_PRICING);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
