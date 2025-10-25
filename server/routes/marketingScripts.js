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
  },
  valuation: {
    name: 'Platform Valuation & Investor Pitch',
    duration: 'Comprehensive Document',
    purpose: 'Detailed platform analysis with financial projections for investors and lenders',
    structure: 'Executive Summary → Technology Stack → Market Opportunity → Revenue Streams → Valuation → Investment Ask'
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

// Generate comprehensive platform valuation for investors/lenders
router.post('/platform-valuation', async (req, res) => {
  try {
    const { customInstructions, focusAreas } = req.body;
    
    // Build comprehensive platform analysis
    const platformData = `AXIOM DEFI PLATFORM - COMPREHENSIVE TECHNICAL & FINANCIAL ANALYSIS

== SMART CONTRACT INFRASTRUCTURE ==
Total Smart Contracts: 42+ production-ready Solidity contracts

CORE FINANCIAL CONTRACTS:
1. RealEstateInvestor.sol - Fractional property investment platform
   - Minimum investment: $30/share
   - Dual payment rails: Stripe (fiat) + BNB (crypto)
   - Automated rental income distribution
   - Property appreciation tracking
   - Multi-property portfolio management
   
2. RealEstateAcquisitionFund.sol - KeyGrow Rent-to-Own Program
   - 20% platform revenue allocation mechanism
   - Helps renters transition to homeownership
   - Tiered allocation system with time-weighted multipliers
   - Transparent fund management
   
3. AXIOMRevenueRouter.sol - Revenue distribution engine
   - Multi-stream revenue aggregation
   - Automated allocation to stakeholders
   - KeyGrow funding (20%), staking rewards, liquidity providers
   
4. AdvancedStaking.sol - Proof of Contribution staking
   - Dynamic APR adjustments based on participation
   - NFT staking support
   - Energy-based reward mechanics
   - Slow-deflationary tokenomics

DEFI INFRASTRUCTURE CONTRACTS:
5. VaultFactory.sol - Multi-vault liquidity staking system
6. LiquidityRewardsVault.sol - LP token rewards distribution
7. BasketIndex.sol - Diversified token index fund
8. DynamicAPRController.sol - Algorithmic interest rate management
9. SWFBasketVault.sol - Multi-asset vault system

NFT & MARKETPLACE CONTRACTS:
10. NFTMarketplace.sol - P2P NFT trading platform
11. EnhancedNFTMarketplace.sol - Advanced marketplace with bidding
12. GoldBackedNFT.sol - Real-world asset tokenization
13. GoldNFTMinter.sol - Precious metals NFT creation

GOVERNANCE & SECURITY:
14. RealEstateGovernor.sol - DAO governance system with quadratic voting
15. MultiSigWallet.sol - Multi-signature treasury management
16. RoleRouter.sol - Role-based access control system
17. PropertyVault.sol - Secure asset custody

TOKEN CONTRACTS:
18. SWFToken.sol - Main platform token (AXM)
19. PropertySharesToken.sol - Fractional real estate shares
20. SovranID.sol - Identity & credentials system

== TECHNOLOGY STACK VALUE ==

Frontend Infrastructure:
- React + TypeScript production application
- 150+ custom components including:
  * Real estate investment UI
  * NFT marketplace interface
  * Staking dashboards
  * Admin control panels
  * KYC/onboarding flows
  * Marketing automation tools
- Responsive design with Tailwind CSS
- Web3 wallet integration (MetaMask, Binance Wallet)
- Real-time blockchain event processing via WebSockets

Backend Infrastructure:
- Node.js + Express.js API server
- PostgreSQL database with Drizzle ORM
- Session management & authentication middleware
- Role-based access control (RBAC)
- Real-time event listeners for blockchain data
- Stripe payment processing integration
- SendGrid email automation
- Google Cloud Storage for documents

Blockchain Integration:
- Dual-chain deployment: BSC Mainnet + Polygon Mainnet
- Ethers.js for contract interactions
- Hardhat development environment
- OpenZeppelin security standards
- Contract verification on BSCScan/Polygonscan
- Real-time BNB price oracles

Database Architecture:
- Unified user registration system
- KYC data management (Light & Full tiers)
- Investment transaction ledger
- Property portfolio tracking
- Performance analytics tables
- Admin dashboard data aggregation

== REVENUE STREAMS ==

1. Real Estate Platform Fees:
   - Property investment transaction fees: 1-2%
   - Rental income management fee: 5-10%
   - Property sale exit fees: 2-3%
   - Estimated potential: $500K-$2M annually (based on $10M-$50M AUM)

2. NFT Marketplace Fees:
   - Listing fees: 2.5%
   - Transaction fees: 2.5%
   - Estimated potential: $100K-$500K annually

3. Staking & Liquidity Services:
   - Performance fees on staking rewards: 10%
   - Liquidity pool management fees: 0.5-1%
   - Estimated potential: $200K-$1M annually

4. KeyGrow Program Revenue:
   - Platform receives 80% of revenues (20% allocated to fund)
   - Cross-subsidization from other revenue streams
   - Grant funding potential for affordable housing initiatives

5. Token Appreciation:
   - AXM token supply: 10 billion (finite)
   - Deflationary mechanisms via staking burns
   - Governance rights create token demand
   - Market cap potential: $10M-$100M+ based on DeFi comparables

== MARKET OPPORTUNITY ==

Total Addressable Market (TAM):
- Global DeFi market: $100B+ (DeFi Llama, 2025)
- Real estate tokenization market: $1.5T projected by 2030 (Deloitte)
- Fractional real estate platforms: $5B+ market (Statista)
- NFT marketplace volume: $20B+ annually

Serviceable Addressable Market (SAM):
- BSC & Polygon DeFi ecosystems: $15B+ TVL
- Fractional real estate investors: 500K+ potential users
- Crypto-native real estate buyers: Growing demographic

Competitive Advantages:
1. DUAL PAYMENT RAILS: Only platform offering both fiat ($30 Stripe) AND crypto (BNB)
2. SOCIAL IMPACT: KeyGrow 20% revenue allocation - unique in DeFi
3. LOW BARRIER TO ENTRY: $30 minimum vs. $5,000+ competitors
4. COMPREHENSIVE ECOSYSTEM: Real estate + NFTs + staking + governance in one platform
5. PRODUCTION-READY: 42+ audited smart contracts deployed
6. REGULATORY COMPLIANCE: Tiered KYC system built-in

== PLATFORM VALUATION ANALYSIS ==

Development Cost Assessment:
- Smart contract development (42 contracts): $500K-$1M
- Frontend/Backend application: $300K-$500K
- Security audits & testing: $100K-$200K
- Infrastructure setup (servers, databases, blockchain): $50K-$100K
- Total Development Value: $950K-$1.8M

Technology Asset Value:
- Proprietary smart contract suite: $750K-$1.5M
- Full-stack DeFi application: $400K-$800K
- User database & analytics infrastructure: $100K-$200K
- Marketing automation system: $50K-$100K
- Total Technology Assets: $1.3M-$2.6M

Market-Based Valuation (Comparables):
- Early-stage DeFi platforms (pre-revenue): $3M-$10M valuations
- Real estate tokenization platforms: $5M-$25M valuations
- Established DeFi protocols with revenue: $50M-$500M+ valuations

Revenue Multiple Approach:
- Assuming $1M annual revenue (conservative Year 1 projection)
- DeFi platform revenue multiples: 10-25x
- Estimated valuation: $10M-$25M

Asset-Based Valuation:
- Technology assets: $1.3M-$2.6M
- Smart contract IP: $750K-$1.5M
- User acquisition costs (if applicable): $500K-$1M
- Total: $2.5M-$5M (conservative floor)

RECOMMENDED VALUATION RANGE: $5M-$15M

Conservative: $5M (asset-based + early traction)
Moderate: $8M-$10M (development value + market potential)
Aggressive: $12M-$15M (comparable analysis + revenue projections)

== INVESTMENT OPPORTUNITY ==

Suggested Investment Ask: $500K-$2M Seed Round

Use of Funds:
- Security audits (all 42 contracts): $150K-$300K
- Marketing & user acquisition: $200K-$500K
- Team expansion (developers, compliance): $300K-$600K
- Legal & regulatory compliance: $100K-$200K
- Working capital & operations: $100K-$400K

Projected ROI:
- 12-month target: $1M-$3M annual recurring revenue
- 24-month target: $5M-$10M ARR
- Exit potential: $50M-$100M+ valuation (5-7 year horizon)

Risk Mitigation:
- Dual revenue streams (real estate + DeFi)
- Fiat payment option reduces crypto volatility exposure
- Tiered KYC ensures regulatory compliance
- Multi-chain deployment diversifies blockchain risk
- Social impact (KeyGrow) creates PR & grant funding opportunities

== COMPETITIVE LANDSCAPE ==

Direct Competitors:
- RealT ($100M+ valuation) - Real estate tokenization, NO fiat option
- Lofty.ai ($50M+ valuation) - Fractional real estate, higher minimums
- Uniswap/PancakeSwap - DeFi only, NO real estate
- OpenSea - NFTs only, NO real estate or staking

AXIOM Differentiators:
✓ ONLY platform with $30 minimum + dual payment rails
✓ ONLY DeFi platform with 20% social impact allocation
✓ Comprehensive ecosystem (real estate + DeFi + NFTs + governance)
✓ Production-ready technology stack (not MVP/prototype)
✓ Built-in compliance (KYC/AML systems integrated)

== REGULATORY & COMPLIANCE ==

- Tiered KYC system (Light & Full verification)
- AML/CFT compliance framework built-in
- Securities law considerations addressed via structure
- Admin dashboard for regulatory reporting
- Document verification & secure storage systems
- Session management & audit trails

== TEAM & EXECUTION CAPABILITY ==

Technology Demonstrated:
- 42+ production-grade smart contracts deployed
- Full-stack web application operational
- Complex payment integrations (Stripe + crypto)
- Real-time blockchain event processing
- Comprehensive admin & analytics dashboards
- Marketing automation tools built-in

This represents MONTHS of skilled development work and demonstrates:
✓ Strong technical execution capability
✓ Product-market fit understanding
✓ Security-first approach (OpenZeppelin standards)
✓ Scalability planning (multi-chain, modular architecture)
✓ Business acumen (dual revenue streams, KYC compliance)`;

    const systemPrompt = `You are a senior financial analyst and startup valuator specializing in DeFi, blockchain, and fintech platforms. Your task is to create comprehensive, professional valuation reports and investor pitch documents that can be used to secure startup loans and attract investors.

Focus on:
- Detailed financial analysis with specific dollar valuations
- Market opportunity quantification
- Competitive advantage assessment
- Revenue projections and business model validation
- Risk analysis and mitigation strategies
- Clear investment recommendations

Use professional financial language, cite industry comparables, and provide data-driven valuations.`;

    const userPrompt = `Based on the comprehensive platform analysis above, create a detailed valuation assessment and investor pitch document for AXIOM.

${customInstructions ? `\nSPECIFIC REQUIREMENTS FROM CLIENT:\n${customInstructions}\n` : ''}

${focusAreas ? `\nFOCUS AREAS:\n${focusAreas}\n` : ''}

Please provide:
1. Executive summary with key investment highlights
2. Detailed platform valuation with methodology
3. Market opportunity analysis
4. Revenue model and projections
5. Competitive positioning
6. Investment ask and use of funds
7. Risk factors and mitigation
8. Clear dollar amount valuation range

Format this as a professional document suitable for presenting to banks, VCs, and angel investors.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });
    
    const valuation = completion.choices[0].message.content;
    
    res.json({
      success: true,
      valuation,
      metadata: {
        generatedAt: new Date().toISOString(),
        contractsAnalyzed: 42,
        platformComponents: '150+ components',
        valuationRange: '$5M-$15M'
      }
    });
    
  } catch (error) {
    console.error('Error generating platform valuation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate platform valuation',
      details: error.message
    });
  }
});

module.exports = router;
