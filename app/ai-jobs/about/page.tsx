import Link from 'next/link';

export const metadata = {
  title: 'About - AI Jobs Map',
  description: 'Learn about AI Jobs Map - mapping AI opportunities to 800+ occupations from the Bureau of Labor Statistics.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/ai-jobs" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">AI</span>
            </div>
            <span className="text-white font-semibold text-lg">AI Jobs Map</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/ai-jobs/browse" className="text-slate-300 hover:text-white transition-colors">
              Browse
            </Link>
            <Link href="/ai-jobs/about" className="text-emerald-400 font-medium">
              About
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-white mb-8">About AI Jobs Map</h1>
        
        <div className="prose prose-invert prose-slate max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">What is AI Jobs Map?</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              AI Jobs Map is a comprehensive resource that maps artificial intelligence opportunities 
              to over 800 occupations from the U.S. Bureau of Labor Statistics. Our mission is to 
              help professionals understand how AI can enhance their work, automate routine tasks, 
              and create new opportunities for career growth.
            </p>
            <p className="text-slate-300 leading-relaxed">
              Whether you're a software developer looking to leverage AI tools, a healthcare 
              professional exploring AI-assisted diagnostics, or a creative professional curious 
              about AI-generated content, AI Jobs Map provides personalized insights for your career.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">Key Features</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">🔍</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Comprehensive Database</h3>
                <p className="text-slate-400 text-sm">
                  826 occupations across 22 major categories, each with detailed micro-tasks and 
                  AI opportunity mappings.
                </p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">AI-Generated Insights</h3>
                <p className="text-slate-400 text-sm">
                  Powered by AI to generate specific, actionable insights about how artificial 
                  intelligence can be applied to your occupation.
                </p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Impact & Effort Ratings</h3>
                <p className="text-slate-400 text-sm">
                  Each AI opportunity includes impact level and effort ratings to help you 
                  prioritize which AI applications to explore first.
                </p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Task-Level Breakdown</h3>
                <p className="text-slate-400 text-sm">
                  Micro-task analysis breaks down occupations into specific activities, showing 
                  exactly where AI can help in your daily work.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">How We Classify AI Opportunities</h2>
            <p className="text-slate-300 leading-relaxed mb-6">
              AI opportunities are categorized into seven key areas to help you understand 
              the type of AI application:
            </p>
            <div className="space-y-3">
              {[
                { name: 'Task Automation', desc: 'Automating repetitive manual tasks' },
                { name: 'Decision Support', desc: 'AI helping make better decisions' },
                { name: 'Research & Discovery', desc: 'Finding insights in data or research' },
                { name: 'Communication', desc: 'Improving communication and messaging' },
                { name: 'Creative Assistance', desc: 'Helping with creative tasks' },
                { name: 'Data Analysis', desc: 'Analyzing data and trends' },
                { name: 'Learning & Education', desc: 'Learning and skill development' },
              ].map((cat) => (
                <div key={cat.name} className="flex items-start gap-4 bg-slate-800/30 rounded-lg p-4">
                  <div className="w-2 h-2 mt-2 rounded-full bg-emerald-400" />
                  <div>
                    <h4 className="font-medium text-white">{cat.name}</h4>
                    <p className="text-sm text-slate-400">{cat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">Data Sources</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              Our occupation data comes from the U.S. Bureau of Labor Statistics (BLS) 
              Standard Occupational Classification (SOC) system. This comprehensive taxonomy 
              covers all major occupational categories in the United States.
            </p>
            <p className="text-slate-300 leading-relaxed">
              AI opportunities and micro-tasks are generated using advanced language models, 
              trained on industry knowledge and current AI capabilities. While AI-generated, 
              these insights are designed to be practical and actionable for professionals 
              in each field.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">Technology Stack</h2>
            <div className="flex flex-wrap gap-3">
              {['Next.js', 'TypeScript', 'Tailwind CSS', 'Supabase', 'PostgreSQL', 'Vercel', 'Drizzle ORM'].map((tech) => (
                <span key={tech} className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-sm text-slate-300">
                  {tech}
                </span>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Get Started</h2>
            <p className="text-slate-300 leading-relaxed mb-6">
              Ready to explore AI opportunities in your field? Search for your occupation 
              to discover specific ways AI can enhance your work.
            </p>
            <Link 
              href="/ai-jobs"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
            >
              Explore Occupations
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-4 py-12 mt-16">
        <div className="max-w-7xl mx-auto text-center text-slate-500">
          <p>Built with Next.js, Supabase & Vercel</p>
          <p className="mt-2 text-sm">Data sourced from U.S. Bureau of Labor Statistics</p>
        </div>
      </footer>
    </div>
  );
}
