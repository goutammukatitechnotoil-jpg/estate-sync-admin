import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import Admin from '@/lib/models/Admin';

const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT Secret key is not matched');
  }
  return new TextEncoder().encode(secret);
};

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
      const secret = getJwtSecretKey();
      const { payload } = await jwtVerify(token, secret);
      console.log('JWT payload:', payload);

      // Handle various payload.id formats
      let adminId = '';
      
      if (typeof payload.id === 'string') {
        adminId = payload.id;
      } else if (payload.id && typeof payload.id === 'object') {
        // Check if it's a buffer/Uint8Array
        const idObj = payload.id as any;
        if (idObj.buffer && typeof idObj.buffer === 'object') {
          // Convert buffer array to hex string
          const bytes = Object.values(idObj.buffer) as number[];
          adminId = bytes.map(b => b.toString(16).padStart(2, '0')).join('');
        } else if (idObj._id) {
          // If it has an _id property
          adminId = idObj._id.toString();
        } else if (Array.isArray(idObj)) {
          // If it's an array
          adminId = Buffer.from(idObj).toString('hex');
        } else {
          adminId = idObj.toString();
        }
      } else if (payload.id) {
        adminId = payload.id.toString();
      }
      
      console.log('Extracted adminId:', adminId, 'Type:', typeof adminId);

      // Get fresh user data from database
      await connectDB();
      const admin = await Admin.findById(adminId).select('name email');

      if (!admin) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json({
        user: {
          id: admin._id,
          name: admin.name || 'Admin',
          email: admin.email
        }
      });
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}