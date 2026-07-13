import { MODEL_PRICING } from '../config/modelPricing';

async function verifyModels() {
  console.log('Verifying modelPricing.ts against live endpoints...');
  const keys: Record<string, string | undefined> = {
    openai: process.env.OPENAI_API_KEY,
    claude: process.env.ANTHROPIC_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    deepseek: process.env.DEEPSEEK_API_KEY,
    mistral: process.env.MISTRAL_API_KEY
  };

  const modelIdsGrouped: Record<string, string[]> = {
    openai: [],
    claude: [],
    gemini: [],
    deepseek: [],
    mistral: []
  };

  MODEL_PRICING.forEach(m => {
    modelIdsGrouped[m.provider].push(m.modelId);
  });

  // Verify OpenAI
  if (keys.openai) {
    try {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${keys.openai}` }
      });
      if (res.ok) {
        const data = await res.json();
        const available = data.data.map((m: any) => m.id);
        console.log(`\n[OpenAI] Found ${available.length} models available.`);
        modelIdsGrouped.openai.forEach(id => {
          if (available.includes(id)) {
            console.log(`  ✓ ${id} is valid`);
          } else {
            console.warn(`  ✗ ${id} NOT found in OpenAI API models list!`);
          }
        });
      } else {
        console.error('[OpenAI] Failed to fetch models:', await res.text());
      }
    } catch (e: any) {
      console.error('[OpenAI] Error:', e.message);
    }
  } else {
    console.log('\n[OpenAI] Skipped: OPENAI_API_KEY not found in environment');
  }

  // Verify Claude
  if (keys.claude) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/models', {
        headers: {
          'x-api-key': keys.claude,
          'anthropic-version': '2023-06-01'
        }
      });
      if (res.ok) {
        const data = await res.json();
        const available = data.data.map((m: any) => m.id);
        console.log(`\n[Claude] Found ${available.length} models available.`);
        modelIdsGrouped.claude.forEach(id => {
          if (available.includes(id)) {
            console.log(`  ✓ ${id} is valid`);
          } else {
            console.warn(`  ✗ ${id} NOT found in Claude API models list!`);
          }
        });
      } else {
        console.error('[Claude] Failed to fetch models:', await res.text());
      }
    } catch (e: any) {
      console.error('[Claude] Error:', e.message);
    }
  } else {
    console.log('\n[Claude] Skipped: ANTHROPIC_API_KEY not found in environment');
  }

  // Verify Gemini
  if (keys.gemini) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${keys.gemini}`);
      if (res.ok) {
        const data = await res.json();
        const available = data.models.map((m: any) => m.name.replace('models/', ''));
        console.log(`\n[Gemini] Found ${available.length} models available.`);
        modelIdsGrouped.gemini.forEach(id => {
          if (available.includes(id)) {
            console.log(`  ✓ ${id} is valid`);
          } else {
            console.warn(`  ✗ ${id} NOT found in Gemini API models list!`);
          }
        });
      } else {
        console.error('[Gemini] Failed to fetch models:', await res.text());
      }
    } catch (e: any) {
      console.error('[Gemini] Error:', e.message);
    }
  } else {
    console.log('\n[Gemini] Skipped: GEMINI_API_KEY not found in environment');
  }

  // Verify DeepSeek
  if (keys.deepseek) {
    try {
      const res = await fetch('https://api.deepseek.com/models', {
        headers: { 'Authorization': `Bearer ${keys.deepseek}` }
      });
      if (res.ok) {
        const data = await res.json();
        const available = data.data.map((m: any) => m.id);
        console.log(`\n[DeepSeek] Found ${available.length} models available.`);
        modelIdsGrouped.deepseek.forEach(id => {
          if (available.includes(id)) {
            console.log(`  ✓ ${id} is valid`);
          } else {
            console.warn(`  ✗ ${id} NOT found in DeepSeek API models list!`);
          }
        });
      } else {
        console.error('[DeepSeek] Failed to fetch models:', await res.text());
      }
    } catch (e: any) {
      console.error('[DeepSeek] Error:', e.message);
    }
  } else {
    console.log('\n[DeepSeek] Skipped: DEEPSEEK_API_KEY not found in environment');
  }

  // Verify Mistral
  if (keys.mistral) {
    try {
      const res = await fetch('https://api.mistral.ai/v1/models', {
        headers: { 'Authorization': `Bearer ${keys.mistral}` }
      });
      if (res.ok) {
        const data = await res.json();
        const available = data.data.map((m: any) => m.id);
        console.log(`\n[Mistral] Found ${available.length} models available.`);
        modelIdsGrouped.mistral.forEach(id => {
          if (available.includes(id)) {
            console.log(`  ✓ ${id} is valid`);
          } else {
            console.warn(`  ✗ ${id} NOT found in Mistral API models list!`);
          }
        });
      } else {
        console.error('[Mistral] Failed to fetch models:', await res.text());
      }
    } catch (e: any) {
      console.error('[Mistral] Error:', e.message);
    }
  } else {
    console.log('\n[Mistral] Skipped: MISTRAL_API_KEY not found in environment');
  }
}

verifyModels();
