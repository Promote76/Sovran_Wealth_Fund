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

// Helper function to recursively scan directories
async function scanDirectory(dirPath, fileExtensions) {
  const results = [];
  
  async function walk(currentPath, relativePath = '') {
    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        const relPath = path.join(relativePath, entry.name);
        
        if (entry.isDirectory()) {
          // Skip node_modules, .git, build, dist directories
          if (!['node_modules', '.git', 'build', 'dist', '.next'].includes(entry.name)) {
            await walk(fullPath, relPath);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (fileExtensions.includes(ext)) {
            results.push({
              name: entry.name,
              path: relPath,
              fullPath: fullPath
            });
          }
        }
      }
    } catch (error) {
      // Silently skip directories that can't be read
      console.log(`Skipping directory ${currentPath}:`, error.message);
    }
  }
  
  await walk(dirPath);
  return results;
}

// Analyze the entire platform (contracts, components, pages) - with caching
let platformAnalysisCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

router.get('/platform-analysis', async (req, res) => {
  try {
    // Check cache
    const now = Date.now();
    if (platformAnalysisCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
      return res.json({
        success: true,
        analysis: platformAnalysisCache,
        summary: {
          totalContracts: platformAnalysisCache.contracts.length,
          totalComponents: platformAnalysisCache.components.length,
          totalPages: platformAnalysisCache.pages.length,
          totalFeatures: platformAnalysisCache.features.length
        },
        cached: true,
        cacheAge: Math.floor((now - cacheTimestamp) / 1000)
      });
    }

    const analysis = {
      contracts: [],
      components: [],
      pages: [],
      features: []
    };

    // Recursively scan contracts directory
    const contractsDir = path.join(process.cwd(), 'contracts');
    try {
      const contractFiles = await scanDirectory(contractsDir, ['.sol']);
      for (const file of contractFiles) {
        const content = await fs.readFile(file.fullPath, 'utf-8');
        const contractName = file.name.replace('.sol', '');
        
        // Extract basic info
        const comments = content.match(/\/\*\*([\s\S]*?)\*\//);
        const description = comments ? comments[1].trim() : '';
        
        // Extract contract type (is it interface, abstract, or normal contract?)
        const isInterface = content.includes('interface ');
        const isAbstract = content.includes('abstract contract');
        
        analysis.contracts.push({
          name: contractName,
          file: file.path,
          description: description.substring(0, 200),
          type: isInterface ? 'Interface' : isAbstract ? 'Abstract Contract' : 'Contract'
        });
      }
    } catch (e) {
      console.log('No contracts directory or error reading contracts:', e.message);
    }

    // Recursively scan React components
    const componentsDir = path.join(process.cwd(), 'client', 'src', 'components');
    try {
      const componentFiles = await scanDirectory(componentsDir, ['.tsx', '.jsx']);
      for (const file of componentFiles) {
        const componentName = file.name.replace(/\.(tsx|jsx)$/, '');
        analysis.components.push({
          name: componentName,
          file: file.path,
          type: 'React Component'
        });
      }
    } catch (e) {
      console.log('Error reading components:', e.message);
    }

    // Recursively scan React pages
    const pagesDir = path.join(process.cwd(), 'client', 'src', 'pages');
    try {
      const pageFiles = await scanDirectory(pagesDir, ['.tsx', '.jsx']);
      for (const file of pageFiles) {
        const pageName = file.name.replace(/Page\.(tsx|jsx)$/, '').replace(/\.(tsx|jsx)$/, '');
        analysis.pages.push({
          name: pageName,
          file: file.path,
          type: 'Page'
        });
      }
    } catch (e) {
      console.log('Error reading pages:', e.message);
    }

    // Add known features
    analysis.features = [
      {
        name: 'KeyGrow Rent-to-Own',
        description: '20% of platform revenue allocated to help renters become homeowners',
        contract: 'KeyGrowRentToOwn.sol',
        benefits: ['Down payment assistance', 'Tiered allocations', 'Time-weighted multipliers']
      },
      {
        name: 'Real Estate Investor',
        description: 'Fractional property investment starting at $30/share',
        contract: 'RealEstateInvestor.sol',
        benefits: ['Low barrier to entry', 'Rental income distribution', 'Property appreciation tracking', 'Dual payment options (Stripe/BNB)']
      },
      {
        name: 'AXM Token Staking',
        description: 'Proof of Contribution staking with dynamic APR rewards',
        contract: 'AdvancedStaking.sol',
        benefits: ['Dynamic APR adjustments', 'NFT staking support', 'Energy-based rewards']
      },
      {
        name: 'Liquidity Provision',
        description: 'Multi-vault system for LP token staking',
        contract: 'VaultFactory.sol',
        benefits: ['Isolated vaults per LP pair', 'Configurable reward rates', 'Flexible lock periods']
      },
      {
        name: 'Axiom Council Governance',
        description: 'Decentralized governance with quadratic voting',
        contract: 'AxiomCouncil.sol',
        benefits: ['Community-driven decisions', 'Quadratic voting system', 'Transparent proposal process']
      },
      {
        name: 'Unified Registration',
        description: 'Progressive onboarding with tiered KYC',
        benefits: ['5-step registration flow', 'Light & Full KYC tiers', 'Secure session management', 'Admin dashboard']
      }
    ];

    // Store in cache
    platformAnalysisCache = analysis;
    cacheTimestamp = Date.now();

    res.json({
      success: true,
      analysis,
      summary: {
        totalContracts: analysis.contracts.length,
        totalComponents: analysis.components.length,
        totalPages: analysis.pages.length,
        totalFeatures: analysis.features.length
      },
      cached: false
    });
  } catch (error) {
    console.error('Error analyzing platform:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze platform'
    });
  }
});

// Social media post templates
const SOCIAL_PLATFORMS = {
  twitter: {
    name: 'Twitter/X',
    maxLength: 280,
    style: 'Concise, engaging, hashtag-friendly',
    format: 'Short punchy statements with emojis and hashtags'
  },
  linkedin: {
    name: 'LinkedIn',
    maxLength: 3000,
    style: 'Professional, informative, thought-leadership',
    format: 'Professional narrative with industry insights'
  },
  facebook: {
    name: 'Facebook',
    maxLength: 63206,
    style: 'Conversational, community-focused',
    format: 'Engaging story with call-to-action'
  },
  instagram: {
    name: 'Instagram',
    maxLength: 2200,
    style: 'Visual-first, lifestyle-oriented',
    format: 'Caption with emojis, line breaks, hashtags at end'
  },
  telegram: {
    name: 'Telegram',
    maxLength: 4096,
    style: 'Community-focused, crypto-native',
    format: 'Informative with links and emojis'
  }
};

// Generate social media post
router.post('/social-media', async (req, res) => {
  try {
    const { 
      platform, 
      topic, 
      feature,
      tone,
      includeHashtags,
      includeEmojis,
      callToAction,
      customInstructions,
      length
    } = req.body;
    
    if (!platform || !topic) {
      return res.status(400).json({
        success: false,
        error: 'Platform and topic are required'
      });
    }
    
    const platformInfo = SOCIAL_PLATFORMS[platform];
    if (!platformInfo) {
      return res.status(400).json({
        success: false,
        error: 'Invalid platform'
      });
    }

    // Build comprehensive platform context
    const platformContext = `AXIOM DeFi Platform - Complete Overview:

CORE MISSION: Create a lawful digital economy through sovereign wealth building

KEY PROGRAMS:
1. KeyGrow Rent-to-Own
   - 20% of platform revenue → Real Estate Acquisition Fund
   - Helps renters transition to homeownership
   - Tiered allocations based on contribution and time

2. Real Estate Investor Platform
   - Fractional property investment from $30/share
   - Dual payment options: Stripe (credit card) OR BNB (crypto)
   - Automated rental income distribution
   - Real-time property appreciation tracking
   - Professional property management

3. AXM Token Staking
   - Proof of Contribution (PoC) rewards
   - Dynamic APR adjustments
   - NFT staking support
   - Energy-based circulation mechanics

4. Liquidity Provision
   - Multi-vault staking system
   - Configurable reward rates
   - Support for various LP token pairs

5. Governance System
   - Axiom Council with quadratic voting
   - Community-driven decision making
   - Transparent proposal process

6. Unified Progressive Registration
   - 5-step onboarding flow
   - Tiered KYC (Light & Full)
   - Comprehensive admin dashboard
   - Educational content integration

TECHNOLOGY STACK:
- Blockchain: BSC & Polygon Mainnets
- Smart Contracts: Solidity with OpenZeppelin
- Frontend: React + TypeScript
- Backend: Node.js + Express
- Database: PostgreSQL with Drizzle ORM
- Payments: Stripe + BNB integration
- Security: Role-based access, session management

UNIQUE VALUE PROPOSITIONS:
- Real-world asset integration (real estate)
- Multiple earning mechanisms
- Low barrier to entry ($30 minimum)
- Transparent revenue allocation
- Community-first governance
- Educational resources included

TARGET AUDIENCE:
- DeFi enthusiasts
- First-time crypto investors
- Renters aspiring to homeownership
- Real estate investors
- Passive income seekers`;

    const prompt = `You are a social media expert creating content for AXIOM, an innovative DeFi platform.

${platformContext}

Create a ${platformInfo.name} post about: ${topic}
${feature ? `Specific Feature: ${feature}` : ''}

Platform Specs:
- Max Length: ${platformInfo.maxLength} characters
- Style: ${platformInfo.style}
- Format: ${platformInfo.format}

Requirements:
- Tone: ${tone || 'Professional but approachable'}
- Target Length: ${length || 'Optimal for platform'}
- Include Hashtags: ${includeHashtags !== false ? 'Yes' : 'No'}
- Include Emojis: ${includeEmojis !== false ? 'Yes' : 'No'}
- Call to Action: ${callToAction || 'Visit AXIOM and connect your wallet'}

${customInstructions ? `\n🎯 CUSTOM INSTRUCTIONS & SPECIFIC DETAILS (PRIORITY - Follow these closely):
${customInstructions}
\nMake sure to incorporate all the above custom instructions and details into the post. These are the user's specific requirements and should take priority in the content creation.\n` : ''}

Guidelines:
1. Hook readers in the first line
2. Focus on specific benefits and data ($30 minimum, 20% revenue allocation, etc.)
3. Make it authentic - no hype, just real value
4. Use platform-appropriate formatting
5. Include relevant AXIOM features naturally
6. End with clear call-to-action
${platform === 'twitter' ? '7. Keep under 280 characters\n8. Use thread format if needed (mark as THREAD)' : ''}
${platform === 'instagram' ? '7. Use line breaks for readability\n8. Put hashtags at the end' : ''}
${platform === 'linkedin' ? '7. Start with a compelling question or statement\n8. Use professional insights' : ''}

Create an engaging, conversion-focused post that showcases AXIOM's unique value.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert social media marketer specializing in DeFi and fintech content. You create posts that educate, engage, and convert while maintaining authenticity.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 1000
    });
    
    const post = completion.choices[0].message.content;
    
    res.json({
      success: true,
      post,
      metadata: {
        platform: platformInfo.name,
        topic,
        maxLength: platformInfo.maxLength,
        actualLength: post.length,
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error generating social media post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate social media post',
      details: error.message
    });
  }
});

// Get social media platforms info
router.get('/social-platforms', async (req, res) => {
  try {
    res.json({
      success: true,
      platforms: SOCIAL_PLATFORMS
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch platforms'
    });
  }
});

module.exports = router;
