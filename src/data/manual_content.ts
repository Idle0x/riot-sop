export const MANUAL_CHAPTERS = [
  {
    id: 'manifesto',
    title: 'I. The Manifesto',
    icon: 'Anchor',
    content: [
      {
        type: 'header',
        text: 'The 4 Core Rules',
        description: 'My operating philosophy.'
      },
      {
        type: 'card_grid',
        items: [
          { title: 'Signal > Noise', body: 'I am a contributor, not a farmer. I add value, I do not just extract it.' },
          { title: 'Leverage > Loyalty', body: 'My work is a portable asset (my resume). I build my brand, not just their project.' },
          { title: 'PoW is Meta', body: 'I build provable assets (code, guides, dashboards) that bots cannot fake.' },
          { title: 'Skepticism is Filter', body: 'I cut losses immediately. Sunk cost is the enemy.' }
        ]
      },
      {
        type: 'callout',
        variant: 'success',
        text: 'Daily Affirmation: "I am building a portfolio, not chasing handouts. My consistency is my advantage. In six months, I will be undeniable."'
      },
      {
        type: 'section',
        title: 'The Sovereign Mindset',
        body: `
Why do we use "Burn Cap"? Because lifestyle creep kills freedom faster than market crashes.
Why "Ghost Mode"? Because silence is the best defense against social engineering.
This app is not a calculator. It is a behavior modification engine.
        `
      }
    ]
  },
  {
    id: 'engine',
    title: 'II. The Engine',
    icon: 'Activity',
    content: [
      {
        type: 'header',
        text: 'The Hunter-Creator Loop',
        description: 'The two-part engine my daily habits serve.'
      },
      {
        type: 'process_flow',
        steps: [
          { 
            title: '1. The Hunter (Find Alpha)', 
            desc: 'Goal: Find high-value projects before the crowd. Filter out 95% of noise.',
            tools: [
              { label: 'DefiLlama', url: 'https://defillama.com' },
              { label: 'Arkham', url: 'https://arkhamintelligence.com' },
              { label: 'Token Terminal', url: 'https://tokenterminal.com' }
            ]
          },
          { 
            title: '2. The Creator (Build Proof)', 
            desc: 'Goal: Turn activity into a public, portable asset.',
            tools: [
              { label: 'Mirror', url: 'https://mirror.xyz' },
              { label: 'GitHub', url: 'https://github.com' },
              { label: 'Dune', url: 'https://dune.com' }
            ]
          }
        ]
      },
      {
        type: 'section',
        title: 'AI Leverage (2026)',
        body: 'Do not read whitepapers raw. Use LLMs to "Roast this tokenomics model looking for inflation cliffs." Use Perplexity to "Find the VC backing for [Project]."'
      }
    ]
  },
  {
    id: 'gym',
    title: 'III. The Gym',
    icon: 'Dumbbell',
    content: [
      {
        type: 'header',
        text: 'The 10 Skills',
        description: 'Menu for "Block 3: Skill Grind". Pick one to build your weekly asset.'
      },
      // NEW: INTERACTIVE ACTION
      {
        type: 'action',
        actionId: 'open_drill', // This signals the app to open the modal
        label: '⚡ Initiate New Drill Sequence',
        variant: 'primary'
      },
      {
        type: 'accordion',
        items: [
          { title: '1. Mastering Research (Hunter)', content: 'Action: Track 5 VC wallets on Arkham. Set alerts for new seed investments.' },
          { title: '2. On-Chain Investigation', content: 'Action: Fork a Dune dashboard. Change one parameter (e.g., 30d to 90d view).' },
          { title: '3. Technical Writing', content: 'Action: Write a "Micro-Guide" for a node error you just solved. Post on X.' },
          { title: '4. Social Reputation', content: 'Action: The "Sniper Rifle" DM. Send a polite correction (typo/broken link) to a founder.' },
          { title: '5. Development', content: 'Action: The "Doc Fix" PR. Fix a typo in a project repo. You are now a contributor.' },
          { title: '6. Node Management', content: 'Action: Set up UptimeRobot for your node. Write a guide on "24/7 Monitoring".' },
          { title: '7. Skin-in-the-Game', content: 'Action: The $200 Rule. Never work on a project without risking capital (stake/LP).' },
          { title: '8. The Permissionless Project', content: 'Action: Fix a broken page for a company you want to work for. Send it to the CEO.' },
          { title: '9. The Spec Audit', content: 'Action: Find a slow Shopify store. Record a Loom video explaining why. Email owner.' },
          { title: '10. Automation Asset', content: 'Action: Write a python script for a task you did twice today. Open source it.' }
        ]
      }
    ]
  },
  {
    id: 'filters',
    title: 'IV. The Filters',
    icon: 'ShieldAlert',
    content: [
      {
        type: 'header',
        text: 'Red Flag Library',
        description: 'If you see these, RUN. Do not "fix" them.'
      },
      // NEW: INTERACTIVE LINK
      {
        type: 'action',
        actionId: 'open_triage',
        label: '💸 Go to Triage (Secure Funds)',
        variant: 'secondary'
      },
      {
        type: 'card_grid',
        variant: 'danger',
        items: [
          { title: 'The Hypocrite', body: 'Complains about "farmers" but only offers Galxe/Zealy quests.' },
          { title: 'No Product', body: 'Roadmap is all "Community" and "TBD". No testnet, no mainnet.' },
          { title: 'Vague Promises', body: 'Constant "Soon™". Zero concrete dates or tech details.' },
          { title: 'Censorship', body: 'Deletes polite questions about tokenomics/unlocks in Discord.' }
        ]
      },
      {
        type: 'section',
        title: 'Security 2.0 (AI Defense)',
        body: `
**The Discord Clone:** AI bots now clone entire servers. Always verify the "Mutual Servers" or use the official website link every time.
**The Deepfake Call:** Never trust a video call for money transfers. Voice/Video can be faked in real-time.
**Browser Hygiene:** Use a dedicated browser profile (Brave/Chrome) for crypto. No extensions allowed except Wallet & Revoke.cash.
        `
      }
    ]
  },
  {
    id: 'toolkit',
    title: 'V. The Toolkit',
    icon: 'Wrench',
    content: [
      {
        type: 'header',
        text: 'Communication Templates',
        description: 'Copy, paste, edit. Don\'t start from blank.'
      },
      {
        type: 'code_block',
        label: 'Discovery Post (X/Twitter)',
        code: `Looked at [Project] today.\n\nInitial checks:\n- GitHub: [Active/Dead]\n- Product: [Working/Vaporware]\n- Backing: [VC names]\n\nResult: [Pass/Reject] because [reason].\n\nNext: Digging into docs + Discord.`
      },
      {
        type: 'code_block',
        label: 'The "Sniper" DM (Founders)',
        code: `Hey [Name], huge fan of [Project].\n\nI was going through your docs and noticed a broken link in Step 3 (gives a 404).\n\nJust a heads up. Happy to hop on a 5-min call if you ever need user feedback. Keep building!`
      }
    ]
  },
  {
    id: 'protocol_z',
    title: 'VII. Protocol Z',
    icon: 'Archive', // Using Archive icon for maintenance
    content: [
      {
        type: 'header',
        text: 'Maintenance & Compliance',
        description: 'How to survive the game (Burnout & Taxes).'
      },
      {
        type: 'section',
        title: 'The Burnout Protocol',
        body: `
1. **Liquidate:** Close high-maintenance positions (yield farms that need daily checks).
2. **Disconnect:** Unfollow all "News" accounts. Keep only "Builders."
3. **Touch Grass:** 3 days minimum. No screens. The market will be there when you back.
        `
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'NTA 2026 Tax Doctrine (Nigeria Context)',
      },
      {
        type: 'table',
        headers: ['Income Band', 'Tax Rate'],
        rows: [
          ['First ₦800,000', '0% (Exempt)'],
          ['Next ₦2.2 Million', '15%'],
          ['Next ₦9.0 Million', '18%'],
          ['Next ₦13.0 Million', '21%'],
          ['Next ₦25.0 Million', '23%'],
          ['Above ₦50 Million', '25%']
        ]
      },
      {
        type: 'section',
        title: 'Compliance Rule',
        body: 'Freelance foreign earnings must be declared in Naira at official CBN rates. Use the "Tax Shield" slider in Triage to auto-save these percentages.'
      }
    ]
  }
];
