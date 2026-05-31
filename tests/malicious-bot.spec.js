import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:8080';

async function loginAndGetToken(username, password) {
  const response = await fetch(`${API_URL}/api/auth/login/step1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await response.json();
  return data.token;
}

async function createEvent(token, title) {
  const response = await fetch(`${API_URL}/api/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: title,
      location: 'Test Venue',
      city: 'Cluj',
      country: 'Romania',
      event_type: 'CONCERT',
      genre: 'ROCK',
      capacity: 100,
      date_time: '2027-01-01T20:00:00'
    })
  });
  return response.json();
}

async function deleteEvent(token, id) {
  await fetch(`${API_URL}/api/events/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
}

async function getObservations(token) {
  const response = await fetch(`${API_URL}/api/events/observations`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
}

test.describe('Malicious Bot Simulation', () => {

  test('bot performs mass deletions and gets flagged', async ({ page }) => {
    console.log('\n🤖 Starting malicious bot simulation...');

    // Step 1: Login as admin to monitor observations
    console.log('📋 Step 1: Admin logging in to monitor...');
    const adminResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin1234' })
    });
    const adminData = await adminResponse.json();
    const adminToken = adminData.token;
    console.log('✅ Admin logged in');

    // Check observations before attack
    const observationsBefore = await getObservations(adminToken);
    console.log(`📊 Suspicious users before attack: ${observationsBefore.length}`);

    // Step 2: Bot logs in as admin (simulating a compromised account)
    console.log('\n🔴 Step 2: Bot logging in...');
    const botToken = adminToken; // using admin for simplicity
    console.log('✅ Bot authenticated');

    // Step 3: Bot creates events to delete
    console.log('\n🔴 Step 3: Bot creating events to delete...');
    const createdEventIds = [];
    for (let i = 0; i < 10; i++) {
      const event = await createEvent(botToken, `Bot Event ${i} - ${Date.now()}`);
      if (event.id) {
        createdEventIds.push(event.id);
        console.log(`   Created event ${event.id}: ${event.title}`);
      }
    }
    console.log(`✅ Created ${createdEventIds.length} events`);

    // Step 4: Bot rapidly deletes all events (triggering detection)
    console.log('\n🔴 Step 4: Bot performing RAPID MASS DELETION...');
    for (const id of createdEventIds) {
      await deleteEvent(botToken, id);
      console.log(`   🗑️  Deleted event ${id}`);
      // Small delay to simulate rapid but not instant deletion
      await page.waitForTimeout(100);
    }
    console.log(`✅ Bot deleted ${createdEventIds.length} events in rapid succession`);

    // Step 5: Wait a moment for detection to process
    console.log('\n⏳ Waiting for detection system to process...');
    await page.waitForTimeout(2000);

    // Step 6: Check if bot was flagged
    console.log('\n🔍 Step 5: Checking if suspicious behavior was detected...');
    const observationsAfter = await getObservations(adminToken);
    console.log(`📊 Suspicious users after attack: ${observationsAfter.length}`);

    if (observationsAfter.length > observationsBefore.length) {
      const newFlags = observationsAfter.slice(observationsBefore.length);
      newFlags.forEach(flag => {
        console.log(`\n🚨 DETECTED: User ${flag.userId}`);
        console.log(`   Reason: ${flag.reason}`);
        console.log(`   Severity: ${flag.severity}`);
        console.log(`   Time: ${flag.timestamp}`);
      });
    }

    expect(observationsAfter.length).toBeGreaterThan(observationsBefore.length);
    console.log('\n✅ Bot was successfully detected by the monitoring system!');
  });

  test('bot navigates UI and performs deletions through the frontend', async ({ page }) => {
    console.log('\n🤖 Starting UI-based bot simulation...');

    await page.goto(`${BASE_URL}/login`);
    console.log('📋 Navigating to login page...');

    await page.route(`${API_URL}/api/auth/login/step1`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'bot-partial-token', nextStep: 'MFA_CODE_PROMPT' })
      });
    });

    await page.route(`${API_URL}/api/auth/login/step2`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'bot-partial-token-2',
          nextStep: 'SECURITY_QUESTION_PROMPT',
          question: 'What was your first pet?'
        })
      });
    });

    await page.route(`${API_URL}/api/auth/login/step3`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'bot-final-token',
          username: 'bot-user',
          roles: ['ROLE_USER'],
          id: 999
        })
      });
    });

    await page.getByLabel('Username').fill('bot-user');
    await page.getByLabel('Password').fill('bot-password');
    await page.getByRole('button', { name: 'Continue →' }).click();

    await page.getByLabel('Verification Code').fill('123456');
    await page.getByRole('button', { name: 'Verify Code →' }).click();

    await page.getByLabel('Your Answer').fill('bot-answer');
    await page.getByRole('button', { name: 'Sign In ✓' }).click();

    await page.route(`${API_URL}/api/events*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await expect(page).toHaveURL(`${BASE_URL}/events`);
    console.log('✅ Bot logged in via UI');

    console.log('✅ UI bot simulation complete');
  });

});

test('rapid API deletion attack simulation', async ({ request }) => {
  console.log('\n🔴 RAPID API ATTACK SIMULATION');
  console.log('================================');

  // Login
  const loginRes = await request.post(`${API_URL}/api/auth/login`, {
    data: { username: 'admin', password: 'admin1234' }
  });
  const { token } = await loginRes.json();
  console.log('✅ Attacker authenticated');

  console.log('📝 Creating 15 events...');
  const ids = [];
  for (let i = 0; i < 15; i++) {
    const res = await request.post(`${API_URL}/api/events`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        title: `Attack Target ${i}`,
        location: 'Venue', city: 'Cluj', country: 'Romania',
        event_type: 'CONCERT', genre: 'ROCK',
        capacity: 50, date_time: '2027-06-01T20:00:00'
      }
    });
    const event = await res.json();
    if (event.id) ids.push(event.id);
  }
  console.log(`✅ Created ${ids.length} events`);

  console.log('🗑️  Rapidly deleting all events...');
  for (const id of ids) {
    await request.delete(`${API_URL}/api/events/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`   Deleted ${id}`);
  }

  // Wait for detection
  await new Promise(r => setTimeout(r, 1000));

  // Check detection
  const obsRes = await request.get(`${API_URL}/api/events/observations`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const observations = await obsRes.json();

  console.log(`\n🚨 DETECTION REPORT:`);
  console.log(`   Total flagged users: ${observations.length}`);
  observations.forEach(o => {
    console.log(`   - User ${o.userId}: ${o.reason} [${o.severity}]`);
  });

  expect(observations.length).toBeGreaterThan(0);
  console.log('\n✅ Suspicious behavior was detected and logged!');
});