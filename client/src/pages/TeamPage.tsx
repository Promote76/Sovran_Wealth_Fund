import React, { useState } from 'react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  expertise: string[];
  education?: string;
  achievements?: string[];
}

const TeamPage: React.FC = () => {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const teamMember: TeamMember = {
    id: 'clarence-fuqua-bey',
    name: 'Clarence Fuqua Bey',
    role: 'Founder, CEO and Acting Executive Team',
    bio: 'Visionary entrepreneur and blockchain architect with deep experience across finance, real estate, and decentralized technology. As founder and interim executive, Clarence oversees all operational, technical, financial, and strategic functions until permanent leaders are appointed.',
    expertise: [
      'Strategic Leadership',
      'Financial Markets',
      'Blockchain Strategy',
      'Solidity',
      'Web3 Integration',
      'DeFi Protocols',
      'Smart Contract Security',
      'Operations Management',
      'Process Optimization',
      'Regulatory Compliance',
      'Team Scaling'
    ],
    education: 'Advanced studies in Blockchain, Economics, and Operations.',
    achievements: [
      'Created and launched a multi-layer blockchain and real estate tokenization ecosystem.',
      'Built and scaled Web3 infrastructure for community-based investing and asset tokenization.',
      'Established a multi-chain liquidity framework and staking system used across Axiom and Sovran initiatives.',
      'Integrated decentralized governance with real-world asset models and compliance workflows.'
    ]
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-blue-800 mb-6">
              👥 Leadership
            </h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Meet the visionary founder building the future of decentralized wealth management and real estate tokenization.
            </p>
          </div>

          {/* Team Member Profile */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-shadow">
              {/* Avatar Placeholder */}
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-6 mx-auto">
                CFB
              </div>
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">{teamMember.name}</h3>
                <p className="text-blue-600 font-medium mt-2">{teamMember.role}</p>
                <p className="text-sm text-gray-600 mt-2 italic">
                  (Currently serving as CEO, Lead Blockchain Developer, Director of Operations, and DeFi Strategy Advisor)
                </p>
              </div>

              <p className="text-base text-gray-700 leading-relaxed mb-6 text-center">
                {teamMember.bio}
              </p>

              <div className="flex flex-wrap gap-2 mb-6 justify-center">
                {teamMember.expertise.slice(0, 4).map((skill, idx) => (
                  <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-3 py-1.5 rounded-full">
                    {skill}
                  </span>
                ))}
                {teamMember.expertise.length > 4 && (
                  <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-full">
                    +{teamMember.expertise.length - 4} more
                  </span>
                )}
              </div>

              <button
                onClick={() => setSelectedMember(selectedMember === teamMember.id ? null : teamMember.id)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors text-sm font-medium"
              >
                {selectedMember === teamMember.id ? 'Show Less' : 'View Full Profile'}
              </button>

              {/* Expanded Profile */}
              {selectedMember === teamMember.id && (
                <div className="mt-6 p-6 bg-gray-50 rounded-lg space-y-4">
                  {teamMember.education && (
                    <div>
                      <h4 className="font-semibold text-gray-800 text-base mb-2">🎓 Education</h4>
                      <p className="text-sm text-gray-700">{teamMember.education}</p>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-semibold text-gray-800 text-base mb-2">🛠️ Expertise</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {teamMember.expertise.map((skill, idx) => (
                        <span key={idx} className="bg-white border border-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {teamMember.achievements && (
                    <div>
                      <h4 className="font-semibold text-gray-800 text-base mb-2">🏆 Key Achievements</h4>
                      <ul className="text-sm text-gray-700 mt-2 space-y-2">
                        {teamMember.achievements.map((achievement, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            {achievement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Company Vision */}
          <div className="bg-white border border-gray-200 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-blue-800 mb-6 text-center">🌟 Our Vision & Values</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl mb-4">🚀</div>
                <h3 className="font-bold text-gray-800 mb-2">Innovation First</h3>
                <p className="text-sm text-gray-700">We push boundaries and embrace cutting-edge technology to solve real financial challenges.</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">🤝</div>
                <h3 className="font-bold text-gray-800 mb-2">Community Driven</h3>
                <p className="text-sm text-gray-700">Our decisions are guided by community input and transparent governance processes.</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="font-bold text-gray-800 mb-2">Results Focused</h3>
                <p className="text-sm text-gray-700">We measure success by the real impact we create for our users and the broader DeFi ecosystem.</p>
              </div>
            </div>
          </div>

          {/* Join Our Team */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-blue-800 mb-4">💼 Join Our Team</h2>
            <p className="text-gray-700 mb-6">
              We're building a world-class team to democratize wealth management through blockchain technology. 
              Positions in development, operations, and strategy will be opening soon.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium">
                🚀 View Open Positions
              </button>
              <button className="bg-white hover:bg-gray-50 text-blue-600 border border-blue-200 px-6 py-3 rounded-lg transition-colors font-medium">
                📧 Get In Touch
              </button>
            </div>
          </div>

        </div>
      </div>
  );
};

export default TeamPage;
