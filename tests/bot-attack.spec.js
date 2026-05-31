import { test, expect } from '@playwright/test';

const API = 'http://localhost:8080';

test.describe('Bot Attack Simulation', () => {

  test('mass deletion attack triggers detection', async ({ request }) => {
    test.setTimeout(60000);
    console.log('\n🤖 BOT ATTACK SIMULATION STARTING...\n');

    // Step 1: Login
    console.log('Step 1: Bot logging in...');
    const loginRes = await request.post(`${API}/api/auth/login`, {
      data: { username: 'admin', password: 'admin1234' }
    });
    expect(loginRes.ok()).toBeTruthy();
    const { token } = await loginRes.json();
    console.log('✅ Bot authenticated\n');

    // Step 2: Check observations before attack
    const beforeRes = await request.get(`${API}/api/events/observations`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const before = await beforeRes.json();
    console.log(`📊 Flagged users BEFORE attack: ${before.length}\n`);

    // Step 3: Fetch existing events to delete
    console.log('Step 2: Fetching existing events to target...');
    const eventsRes = await request.get(`${API}/api/events?page=0&size=8`);
    const events = await eventsRes.json();
    const ids = events.slice(0, 8).map(e => e.id).filter(Boolean);
    console.log(`✅ Found ${ids.length} events to delete: ${ids.join(', ')}\n`);

    if (ids.length === 0) {
      console.log('❌ No events found — seed the database first');
      expect(ids.length).toBeGreaterThan(0);
      return;
    }

    // Step 4: Rapidly delete all events using curl-style direct fetch
    console.log('Step 3: RAPID MASS DELETION in progress...');
    const deletePromises = ids.map(async (id) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        
        const delRes = await fetch(`${API}/api/events/${id}`, {
          method: 'DELETE',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });
        clearTimeout(timeout);
        console.log(`   🗑️  Deleted event ${id} - Status: ${delRes.status}`);
      } catch (err) {
        console.log(`   ⚠️  Event ${id} - ${err.message}`);
      }
    });

await Promise.all(deletePromises);
console.log(`✅ Deletion wave complete\n`);

    console.log('⏳ Waiting for detection system...');
    await new Promise(r => setTimeout(r, 2000));

    // Step 6: Check if flagged
    console.log('\nStep 4: Checking detection results...');
    const afterRes = await request.get(`${API}/api/events/observations`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const after = await afterRes.json();
    console.log(`📊 Flagged users AFTER attack: ${after.length}\n`);

    console.log('🚨 DETECTION REPORT:');
    console.log('====================');
    after.forEach(o => {
      console.log(`User ID:  ${o.userId}`);
      console.log(`Reason:   ${o.reason}`);
      console.log(`Severity: ${o.severity}`);
      console.log(`Time:     ${o.timestamp}`);
      console.log('--------------------');
    });

    expect(after.length).toBeGreaterThan(0);
    console.log(`\n✅ SUCCESS: ${after.length} suspicious behavior records detected!`);
  });

});