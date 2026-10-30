import { NextRequest, NextResponse } from 'next/server';

interface CourierVerifyRequest {
  phone: string;
  customerName: string;
  address: string;
  city?: string;
  orderValue: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CourierVerifyRequest;
    const { phone = '', customerName = '', address = '', city = '', orderValue = 0 } = body;

    const cleanedPhone = phone.replace(/[\s\-\+]/g, '');
    const isBDPhone = /^(?:88)?01[3-9]\d{8}$/.test(cleanedPhone);

    // Operator detection
    let operator = 'Unknown';
    if (cleanedPhone.includes('017') || cleanedPhone.includes('013')) operator = 'Grameenphone';
    else if (cleanedPhone.includes('018')) operator = 'Robi';
    else if (cleanedPhone.includes('019') || cleanedPhone.includes('014')) operator = 'Banglalink';
    else if (cleanedPhone.includes('015')) operator = 'Teletalk';
    else if (cleanedPhone.includes('016')) operator = 'Airtel';

    // Address completeness analysis
    const hasThana = /(thana|upazila|থানা|উপজেলা|road|road|house|holding|sector|block|পোস্ট|post)/i.test(address);
    const addressLength = address.trim().length;

    let riskScore = 15; // Base low risk
    const flags: string[] = [];

    if (!isBDPhone) {
      riskScore += 50;
      flags.push('Invalid Bangladeshi phone number pattern');
    }

    if (addressLength < 12) {
      riskScore += 25;
      flags.push('Extremely short or vague delivery address');
    }

    if (!hasThana && addressLength < 25) {
      riskScore += 15;
      flags.push('Missing specific Thana / Road / House identifier');
    }

    if (orderValue > 4000) {
      riskScore += 10;
      flags.push('High COD ticket value (> ৳4,000) — advance courier fee recommended');
    }

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (riskScore >= 55) riskLevel = 'HIGH';
    else if (riskScore >= 30) riskLevel = 'MEDIUM';

    // Recommendation for merchant
    let recommendation = 'Safe to dispatch with standard COD (Pathao / Steadfast / RedX).';
    if (riskLevel === 'HIGH') {
      recommendation = 'DO NOT dispatch without collecting advance delivery fee (৳১০০–৳১৫০) via bKash/Nagad.';
    } else if (riskLevel === 'MEDIUM') {
      recommendation = 'Make a quick automated WhatsApp or phone confirmation before handing to courier.';
    }

    return NextResponse.json({
      success: true,
      data: {
        phone: cleanedPhone,
        operator,
        isBDPhone,
        addressQuality: addressLength > 25 ? 'High (Detailed)' : addressLength > 12 ? 'Moderate' : 'Low',
        riskLevel,
        riskScore: Math.min(100, riskScore),
        flags,
        recommendation,
        courierCompatibility: {
          steadfast: riskLevel !== 'HIGH',
          pathao: true,
          redx: true,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
