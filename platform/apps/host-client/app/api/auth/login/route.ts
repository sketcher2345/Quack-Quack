
import { NextRequest, NextResponse } from 'next/server';
import { prismaClient } from 'db/client'; 

import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken";



export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }
    const host = await prismaClient.host.findUnique({
      where: { email },
    });

    if (!host) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }
    const isPasswordValid = await bcrypt.compare(password, host.passwordHash);


    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }
    const token = jwt.sign(
      { hostId: host.id, email: host.email }, 
      process.env.JWT_SECRET!,
      { expiresIn: '24h' } 
    );

    return NextResponse.json({ message: 'Login successful', token });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}