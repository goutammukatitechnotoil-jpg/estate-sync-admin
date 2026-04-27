import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const logPath = path.join(process.cwd(), 'storage', 'webhook_logs.json');
  
  let logs = [];
  if (fs.existsSync(logPath)) {
    logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
  }
  
  logs.push({
    timestamp: new Date().toISOString(),
    body
  });
  
  // Keep last 20
  if (logs.length > 20) logs = logs.slice(-20);
  
  fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
  
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const logPath = path.join(process.cwd(), 'storage', 'webhook_logs.json');
  if (fs.existsSync(logPath)) {
    return NextResponse.json(JSON.parse(fs.readFileSync(logPath, 'utf8')));
  }
  return NextResponse.json([]);
}
