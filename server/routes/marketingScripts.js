const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
});

const SCRIPT_TEMPLATES = {
  explainer: {
    name: 'Explainer Video',
    duration: '60-90 seconds',
    purpose: 'Educate viewers about a specific feature or concept',
    structure: 'Problem → Solution → How it Works → Benefits → CTA'
  },
  testimonial: {
    name: 'User Testimonial',
    duration: '30-45 seconds',
    purpose: 'Build trust through real user stories',
    structure: 'Introduction → Problem → Discovery → Impact → Recommendation'
  },
  social: {
    name: 'Social Media Short',
    duration: '15-30 seconds',
    purpose: 'Quick, engaging content for TikTok, Instagram, Twitter',
    structure: 'Hook → Key Message → CTA'
  },
  product_demo: {
    name: 'Product Demo',
    duration: '45-60 seconds',
    purpose: 'Show platform features in action',
    structure: 'Feature Intro → Demo → Benefits → Next Steps'
  },
  comparison: {
    name: 'Comparison Video',
    duration: '60 seconds',
    purpose: 'Compare AXIOM to traditional alternatives',
    structure: 'Traditional Way → AXIOM Way → Key Differences → CTA'
  }
};

router.get('/templates', async (req, res) => {
  try {
    res.json({
      success: true,
      templates: SCRIPT_TEMPLATES
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch templates'
    });
  }
});

router.get('/library', async (req, res) => {
  try {
    const scriptsDir = path.join(process.cwd(), 'marketing-scripts');
    const files = await fs.readdir(scriptsDir);
    
    const scripts = await Promise.all(
      files
        .filter(file => file.endsWith('.md'))
        .map(async (file) => {
          const content = await fs.readFile(path.join(scriptsDir, file), 'utf-8');
          const lines = content.split('\n');
          const title = lines[0].replace('# ', '').replace(' - Video Script', '');
          
          const durationMatch = content.match(/\*\*Duration:\*\* (.+)/);
          const audienceMatch = content.match(/\*\*Target Audience:\*\* (.+)/);
          const styleMatch = content.match(/\*\*Style:\*\* (.+)/);
          
          return {
            id: file.replace('.md', ''),
            title,
            filename: file,
            duration: durationMatch ? durationMatch[1] : 'Unknown',
            audience: audienceMatch ? audienceMatch[1] : 'General',
            style: styleMatch ? styleMatch[1] : 'Professional',
            preview: lines.slice(0, 10).join('\n')
          };
        })
    );
    
    res.json({
      success: true,
      scripts
    });
  } catch (error) {
    console.error('Error fetching script library:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch script library'
    });
  }
});

router.get('/library/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const scriptsDir = path.join(process.cwd(), 'marketing-scripts');
    const filePath = path.join(scriptsDir, filename);
    
    if (!filePath.startsWith(scriptsDir)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filename'
      });
    }
    
    const content = await fs.readFile(filePath, 'utf-8');
    
    res.json({
      success: true,
      content
    });
  } catch (error) {
    console.error('Error fetching script:', error);
    res.status(404).json({
      success: false,
      error: 'Script not found'
    });
  }
});

router.post('/generate', async (req, res) => {
  try {
    const { 
      template, 
      topic, 
      feature, 
      duration, 
      audience, 
      tone,
      keyPoints,
      callToAction
    } = req.body;
    
    if (!template || !topic) {
      return res.status(400).json({
        success: false,
        error: 'Template and topic are required'
      });
    }
    
    const templateInfo = SCRIPT_TEMPLATES[template];
    if (!templateInfo) {
      return res.status(400).json({
        success: false,
        error: 'Invalid template'
      });
    }
    
    const prompt = `You are a professional marketing video scriptwriter for AXIOM, a DeFi platform on Binance Smart Chain and Polygon.

AXIOM Platform Overview:
- KeyGrow Rent-to-Own: Helps renters become homeowners by allocating 20% of platform revenue to a Real Estate Acquisition Fund
- Real Estate Investor: Fractional property investment starting at $30/share with Stripe or BNB payments
- AXM Token Staking: Proof of Contribution staking with dynamic APR rewards
- Liquidity Provision: Multi-vault system for LP token staking
- Governance: Axiom Council with quadratic voting
- Core Values: Transparency, accessibility, sovereign wealth, community-driven

Write a ${templateInfo.name} video script for AXIOM with the following specifications:

Topic: ${topic}
${feature ? `Feature Focus: ${feature}` : ''}
Duration: ${duration || templateInfo.duration}
Target Audience: ${audience || 'DeFi enthusiasts and new investors'}
Tone: ${tone || 'Professional and empowering'}
${keyPoints ? `Key Points to Include: ${keyPoints}` : ''}
${callToAction ? `Call to Action: ${callToAction}` : 'Visit AXIOM.finance and connect your wallet'}

Structure: ${templateInfo.structure}

Format the script as a professional video production document with:
1. Clear sections with timestamps
2. Voiceover dialogue
3. Visual direction notes in [brackets]
4. Production notes at the end (music, visuals, pacing)
5. Specific numbers and data points where relevant ($30 minimum, 20% revenue allocation, etc.)

Make it compelling, authentic, and action-oriented. Use AXIOM's brand voice: empowering but not hype-driven, technical but accessible.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert marketing scriptwriter specializing in fintech and DeFi video content. You create compelling, professional scripts that educate and inspire action.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 2000
    });
    
    const script = completion.choices[0].message.content;
    
    res.json({
      success: true,
      script,
      metadata: {
        template: templateInfo.name,
        topic,
        duration: duration || templateInfo.duration,
        audience: audience || 'DeFi enthusiasts and new investors',
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error generating script:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate script',
      details: error.message
    });
  }
});

router.post('/save', async (req, res) => {
  try {
    const { filename, content } = req.body;
    
    if (!filename || !content) {
      return res.status(400).json({
        success: false,
        error: 'Filename and content are required'
      });
    }
    
    const safeFilename = filename.replace(/[^a-z0-9-_]/gi, '-').toLowerCase();
    const scriptsDir = path.join(process.cwd(), 'marketing-scripts');
    const filePath = path.join(scriptsDir, `${safeFilename}.md`);
    
    await fs.writeFile(filePath, content, 'utf-8');
    
    res.json({
      success: true,
      filename: `${safeFilename}.md`,
      message: 'Script saved successfully'
    });
    
  } catch (error) {
    console.error('Error saving script:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save script'
    });
  }
});

module.exports = router;
