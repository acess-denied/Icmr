/**
 * ICMR STS Research Study — Phase 1 Test & Verification Suite
 *
 * Runs 5 automated security & protocol verification tests against the Phase 1 Worker:
 * 1. Health check verification (GET /api/health)
 * 2. Authenticated valid Form Submission with Canonical HMAC-SHA256 (POST /api/form-submit)
 * 3. Invalid HMAC Signature Rejection (Expected 401)
 * 4. Expired Timestamp / Clock Skew Rejection (Expected 400)
 * 5. Replay Attack Prevention / Duplicate Request ID (Expected 409)
 */

import worker, { ExecutionContext } from './src/index';

const MOCK_ENV = {
  STS_WEBHOOK_SECRET: 'd8f2a93c4e7b1a0f6e5d8c2b4a9f1e3c5d7b9a1f3e5c7a9b1d3f5e7c9a1b3d5f',
  ENVIRONMENT: 'test',
  MAX_TIMESTAMP_SKEW_SEC: '300',
};

async function sha256Hex(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function computeHmacHex(canonicalString: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(canonicalString));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

const SAMPLE_PAYLOAD = {
  submission_id: 'SUB-20260523-001',
  participant_id: 'STS-2026-7F3A91',
  form_timestamp: '2026-05-23T10:27:00.000Z',
  raw_answers: {
    'I have read and understood the participant information sheet and agree to participate in this study.': 'Yes',
    'Are you having any chronic illness? Eg. Hypertension/diabetes/thyroid disease?': 'No',
    'Are you on any medications?': 'No',
    'Name (optional)': 'Dev Participant',
    'Age (years)': 21,
    'Gender': 'Female',
    'MBBS Professional Year': 'First MBBS',
    'Height (cm)': 162,
    'Weight (kg)': 54,
    'At what time do you usually eat breakfast?': '7:00–8:00 AM',
    'How many days per week do you skip breakfast?': 'Never',
    'At what time do you usually eat dinner?': '8:00–9:00 PM',
    'How often do you eat snacks after dinner/night-time?': 'Occasionally',
    'What is your usual daily eating duration (time between first and last meal)?': '10–12 hours',
    'Do you eat meals at regular timings daily?': 'Yes',
    'At approximately what time would you get up if you were entirely free to plan your day?': '6:30–7:45 AM',
    'During the first half hour after waking, how tired do you feel?': 4,
    'At what time in the evening do you usually feel tired and in need of sleep?': '10:15 PM–12:30 AM',
    'How easy do you find getting up in the morning?': 4,
    'At what time of day do you feel your best mentally and physically?': 'Late morning',
    'Average sleep duration per day': '6–7 hours',
    'How often do you consume caffeinated beverages (coffee/tea/energy drinks)?': 'Daily',
    'Physical activity level': 'Moderately active'
  },
  metadata: {
    row_number: 2,
    sheet_name: 'Form Responses 1',
    script_version: '1.0.0-phase1',
    environment: 'test'
  }
};

export async function runAllTests(): Promise<{ passed: number; failed: number; results: Array<{ test: string; status: 'PASS' | 'FAIL'; details: any }> }> {
  const results: Array<{ test: string; status: 'PASS' | 'FAIL'; details: any }> = [];
  let passed = 0;
  let failed = 0;

  const mockCtx = {
    waitUntil: () => {},
    passThroughOnException: () => {},
  } as unknown as ExecutionContext;

  // Test 1: Health check
  try {
    const req = new Request('https://worker.test/api/health', { method: 'GET' });
    const res = await worker.fetch(req, MOCK_ENV, mockCtx);
    const json = await res.json() as any;
    if (res.status === 200 && json.status === 'healthy') {
      results.push({ test: '1. GET /api/health (Health Endpoint)', status: 'PASS', details: json });
      passed++;
    } else {
      results.push({ test: '1. GET /api/health', status: 'FAIL', details: json });
      failed++;
    }
  } catch (e: any) {
    results.push({ test: '1. GET /api/health', status: 'FAIL', details: e.message });
    failed++;
  }

  // Test 2: Valid signed submission
  try {
    const bodyStr = JSON.stringify(SAMPLE_PAYLOAD);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const reqId = `test_req_${Date.now()}_1`;
    const bodyHash = await sha256Hex(bodyStr);
    const canonical = `${timestamp}\nPOST\n/api/form-submit\n${bodyHash}`;
    const sig = await computeHmacHex(canonical, MOCK_ENV.STS_WEBHOOK_SECRET);

    const req = new Request('https://worker.test/api/form-submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-STS-Timestamp': timestamp,
        'X-STS-Signature': sig,
        'X-STS-Request-ID': reqId,
      },
      body: bodyStr,
    });

    const res = await worker.fetch(req, MOCK_ENV, mockCtx);
    const json = await res.json() as any;
    if (res.status === 200 && json.success === true && json.participant_id === 'STS-2026-7F3A91') {
      results.push({ test: '2. POST /api/form-submit (Valid HMAC Signature & Ingestion)', status: 'PASS', details: json });
      passed++;
    } else {
      results.push({ test: '2. POST /api/form-submit', status: 'FAIL', details: json });
      failed++;
    }
  } catch (e: any) {
    results.push({ test: '2. POST /api/form-submit', status: 'FAIL', details: e.message });
    failed++;
  }

  // Test 3: Invalid HMAC signature
  try {
    const bodyStr = JSON.stringify(SAMPLE_PAYLOAD);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const reqId = `test_req_${Date.now()}_2`;
    const badSig = '0000000000000000000000000000000000000000000000000000000000000000';

    const req = new Request('https://worker.test/api/form-submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-STS-Timestamp': timestamp,
        'X-STS-Signature': badSig,
        'X-STS-Request-ID': reqId,
      },
      body: bodyStr,
    });

    const res = await worker.fetch(req, MOCK_ENV, mockCtx);
    const json = await res.json() as any;
    if (res.status === 401 && json.error === 'INVALID_SIGNATURE') {
      results.push({ test: '3. POST /api/form-submit (Tampered / Invalid Signature Rejected 401)', status: 'PASS', details: json });
      passed++;
    } else {
      results.push({ test: '3. POST /api/form-submit (Bad Sig)', status: 'FAIL', details: { status: res.status, json } });
      failed++;
    }
  } catch (e: any) {
    results.push({ test: '3. POST /api/form-submit (Bad Sig)', status: 'FAIL', details: e.message });
    failed++;
  }

  // Test 4: Expired Timestamp / Clock Skew
  try {
    const bodyStr = JSON.stringify(SAMPLE_PAYLOAD);
    const expiredTimestamp = (Math.floor(Date.now() / 1000) - 600).toString(); // 10 minutes ago
    const reqId = `test_req_${Date.now()}_3`;
    const bodyHash = await sha256Hex(bodyStr);
    const canonical = `${expiredTimestamp}\nPOST\n/api/form-submit\n${bodyHash}`;
    const sig = await computeHmacHex(canonical, MOCK_ENV.STS_WEBHOOK_SECRET);

    const req = new Request('https://worker.test/api/form-submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-STS-Timestamp': expiredTimestamp,
        'X-STS-Signature': sig,
        'X-STS-Request-ID': reqId,
      },
      body: bodyStr,
    });

    const res = await worker.fetch(req, MOCK_ENV, mockCtx);
    const json = await res.json() as any;
    if (res.status === 400 && json.error === 'REQUEST_EXPIRED_OR_CLOCK_SKEW') {
      results.push({ test: '4. POST /api/form-submit (Expired Timestamp > 300s Rejected 400)', status: 'PASS', details: json });
      passed++;
    } else {
      results.push({ test: '4. POST /api/form-submit (Expired)', status: 'FAIL', details: { status: res.status, json } });
      failed++;
    }
  } catch (e: any) {
    results.push({ test: '4. POST /api/form-submit (Expired)', status: 'FAIL', details: e.message });
    failed++;
  }

  // Test 5: Replay Attack (Reusing Request-ID)
  try {
    const bodyStr = JSON.stringify(SAMPLE_PAYLOAD);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const replayId = `replay_fixed_id_${Date.now()}`;
    const bodyHash = await sha256Hex(bodyStr);
    const canonical = `${timestamp}\nPOST\n/api/form-submit\n${bodyHash}`;
    const sig = await computeHmacHex(canonical, MOCK_ENV.STS_WEBHOOK_SECRET);

    // First call with replayId
    const req1 = new Request('https://worker.test/api/form-submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-STS-Timestamp': timestamp,
        'X-STS-Signature': sig,
        'X-STS-Request-ID': replayId,
      },
      body: bodyStr,
    });
    await worker.fetch(req1, MOCK_ENV, mockCtx);

    // Second call with same replayId
    const req2 = new Request('https://worker.test/api/form-submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-STS-Timestamp': timestamp,
        'X-STS-Signature': sig,
        'X-STS-Request-ID': replayId,
      },
      body: bodyStr,
    });
    const res2 = await worker.fetch(req2, MOCK_ENV, mockCtx);
    const json2 = await res2.json() as any;

    if (res2.status === 409 && json2.error === 'REPLAY_ATTACK_DETECTED') {
      results.push({ test: '5. POST /api/form-submit (Replay Attack Prevention Detected 409)', status: 'PASS', details: json2 });
      passed++;
    } else {
      results.push({ test: '5. POST /api/form-submit (Replay)', status: 'FAIL', details: { status: res2.status, json2 } });
      failed++;
    }
  } catch (e: any) {
    results.push({ test: '5. POST /api/form-submit (Replay)', status: 'FAIL', details: e.message });
    failed++;
  }

  return { passed, failed, results };
}
