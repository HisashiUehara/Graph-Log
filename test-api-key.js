require('dotenv').config();

async function testOpenAIKey() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.log('❌ OPENAI_API_KEY not found in environment variables');
    return;
  }
  
  if (!apiKey.startsWith('sk-')) {
    console.log('❌ API key format incorrect (should start with sk-)');
    console.log(`Current key length: ${apiKey.length}`);
    return;
  }
  
  console.log('✅ API key format looks correct');
  console.log(`Key length: ${apiKey.length}`);
  console.log(`Key prefix: ${apiKey.substring(0, 7)}...`);
  
  // Test API call
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API key is valid!');
      console.log(`Available models: ${data.data.length}`);
      console.log('Sample models:', data.data.slice(0, 3).map(m => m.id));
    } else {
      console.log('❌ API key is invalid');
      console.log(`Status: ${response.status}`);
      console.log(`Error: ${response.statusText}`);
    }
  } catch (error) {
    console.log('❌ Error testing API key:', error.message);
  }
}

testOpenAIKey(); 