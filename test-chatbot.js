/**
 * Chatbot Stateful Flow Simulator
 * 
 * This script automates a step-by-step chatbot conversation simulation
 * by hitting the local server webhook endpoint.
 * 
 * Usage:
 * 1. Start the server: npm run dev
 * 2. Run this script in another terminal: node test-chatbot.js
 */

const http = require('http');

const PORT = 5000;
const TEST_PHONE = '+919999900000';

const conversationSteps = [
  { message: 'Hello' },                                              // START -> Welcome, ask name
  { message: 'Alice Smith' },                                         // AWAITING_NAME -> Ask department
  { message: 'Cardiology' },                                         // AWAITING_DEPARTMENT -> Ask reason
  { message: 'Experiencing mild palpitations after running.' },       // AWAITING_REASON -> Ask date
  { message: '2026-08-20' },                                         // AWAITING_DATE -> Ask time
  { message: '10:30 AM' },                                           // AWAITING_TIME -> Ask address
  { message: 'Sector 23, Gurugram, Haryana' },                       // AWAITING_ADDRESS -> Ask location
  { message: 'skip' }                                                // AWAITING_LOCATION -> Save & Reset
];

function sendWebhookMessage(payload) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      phone: TEST_PHONE,
      ...payload
    });

    const options = {
      hostname: 'localhost',
      port: PORT,
      path: '/api/webhook/whatsapp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

async function runSimulation() {
  console.log(`===================================================`);
  console.log(`🤖 Starting Chatbot Flow Simulation`);
  console.log(`📱 Simulating phone number: ${TEST_PHONE}`);
  console.log(`===================================================\n`);

  for (let i = 0; i < conversationSteps.length; i++) {
    const step = conversationSteps[i];
    console.log(`👤 Patient: "${step.message}"`);
    
    try {
      const response = await sendWebhookMessage(step);
      const botResponse = response.data?.botResponse;
      console.log(`🤖 Bot:\n---------------------------------------------------`);
      console.log(botResponse);
      console.log(`---------------------------------------------------\n`);
      
      // Delay slightly for natural feel
      await new Promise(r => setTimeout(r, 800));
    } catch (error) {
      console.error(`❌ Error in step ${i + 1}:`, error.message);
      console.log('Ensure your backend server is running on port 5000 (npm run dev)');
      return;
    }
  }

  console.log(`===================================================`);
  console.log(`🎉 Simulation Completed!`);
  console.log(`Check your database or run Prisma Studio: npx prisma studio`);
  console.log(`===================================================`);
}

runSimulation();
