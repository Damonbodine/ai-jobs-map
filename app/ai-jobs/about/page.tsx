import Link from 'next/link';
import { Database, BrainCircuit, BarChart3, Target, Sparkles, ChevronRight, Zap, BookOpen } from 'lucide-react';

export const metadata = {
  title: 'About - AI Jobs Map',
  description: 'Learn about AI Jobs Map - mapping AI opportunities to 800+ occupations from the Bureau of Labor Statistics.',
};

export default function AboutPage() {
  const featureStyles: Record<string, string> = {
    emerald: 'bg-emerald-500/15 text-emerald-400',
    cyan: 'bg-cyan-500/15 text-cyan-400',
    purple: 'bg-purple-500/15 text-purple-400',
    orange: 'bg-orange-500/15 text-orange-400',
  };

  const categoryDotStyles: Record<string, string> = {
    emerald: 'bg-emerald-400',
    purple: 'bg-purple-400',
    green: 'bg-green-400',
    orange: 'bg-orange-400',
    pink: 'bg-pink-400',
    cyan: 'bg-cyan-400',
    yellow: 'bg-yellow-400',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 relative selection:bg-cyan-500/30 overflow-x-hidden">
      {/* Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[140px] rounded-full pointer-events-none animate-pulse-glow" style={{ animationDuration: '7s' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-cyan-600/10 blur-[140px] rounded-full pointer-events-none animate-pulse-glow" style={{ animationDuration: '9s' }} />

      <main className="max-w-4xl mx-auto px-4 py-16 relative z-10">
        <Link href="/ai-jobs" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-8 text-sm font-medium group">
          <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
          Back to Map
        </Link>

        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 tracking-tight">
          About <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">AI Jobs Map</span>
        </h1>
        <p className="text-lg text-slate-400 mb-12 max-w-2xl">
          Mapping artificial intelligence opportunities to over 800 occupations.
        </p>
        
        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-cyan-400" />
              What is AI Jobs Map?
            </h2>
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 space-y-4">
              <p className="text-slate-300 leading-relaxed">
                AI Jobs Map is a comprehensive resource that maps artificial intelligence opportunities 
                to over 800 occupations from the U.S. Bureau of Labor Statistics. Our mission is to 
                help professionals understand how AI can enhance their work, automate routine tasks, 
                and create new opportunities for career growth.
              </p>
              <p className="text-slate-300 leading-relaxed">
                Whether you&apos;re a software developer looking to leverage AI tools, a healthcare 
                professional exploring AI-assisted diagnostics, or a creative professional curious 
                about AI-generated content, AI Jobs Map provides personalized insights for your career.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Zap className="w-6 h-6 text-emerald-400" />
              Key Features
            </h2>
            <div className="grid md:grid-cols-2 gap-5">
              {[
                { icon: <Database className="w-6 h-6" />, title: 'Comprehensive Database', desc: '826 occupations across 22 major categories, each with detailed micro-tasks and AI opportunity mappings.', color: 'emerald' },
                { icon: <BrainCircuit className="w-6 h-6" />, title: 'AI-Generated Insights', desc: 'Powered by AI to generate specific, actionable insights about how artificial intelligence can be applied to your occupation.', color: 'cyan' },
                { icon: <BarChart3 className="w-6 h-6" />, title: 'Impact & Effort Ratings', desc: 'Each AI opportunity includes impact level and effort ratings to help you prioritize which AI applications to explore first.', color: 'purple' },
                { icon: <Target className="w-6 h-6" />, title: 'Task-Level Breakdown', desc: 'Micro-task analysis breaks down occupations into specific activities, showing exactly where AI can help in your daily work.', color: 'orange' },
              ].map((feature) => (
                <div key={feature.title} className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors group">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${featureStyles[feature.color]}`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-purple-400" />
              How We Classify AI Opportunities
            </h2>
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
              <p className="text-slate-300 leading-relaxed mb-6">
                AI opportunities are categorized into seven key areas to help you understand 
                the type of AI application:
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { name: 'Task Automation', desc: 'Automating repetitive manual tasks', color: 'emerald' },
                  { name: 'Decision Support', desc: 'AI helping make better decisions', color: 'purple' },
                  { name: 'Research & Discovery', desc: 'Finding insights in data or research', color: 'green' },
                  { name: 'Communication', desc: 'Improving communication and messaging', color: 'orange' },
                  { name: 'Creative Assistance', desc: 'Helping with creative tasks', color: 'pink' },
                  { name: 'Data Analysis', desc: 'Analyzing data and trends', color: 'cyan' },
                  { name: 'Learning & Education', desc: 'Learning and skill development', color: 'yellow' },
                ].map((cat) => (
                  <div key={cat.name} className="flex items-start gap-3 bg-slate-950/50 rounded-xl p-4 border border-slate-800 hover:border-slate-700 transition-colors">
                    <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${categoryDotStyles[cat.color]}`} />
                    <div>
                      <h4 className="font-medium text-white text-sm">{cat.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{cat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Database className="w-6 h-6 text-cyan-400" />
              Data Sources
            </h2>
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 space-y-4">
              <p className="text-slate-300 leading-relaxed">
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
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Technology Stack</h2>
            <div className="flex flex-wrap gap-3">
              {['Next.js', 'TypeScript', 'Tailwind CSS', 'Supabase', 'PostgreSQL', 'Vercel', 'Drizzle ORM'].map((tech) => (
                <span key={tech} className="px-4 py-2 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-xl text-sm text-slate-300 font-medium hover:border-cyan-500/30 hover:text-cyan-400 transition-all cursor-default">
                  {tech}
                </span>
              ))}
            </div>
          </section>

          <section className="bg-gradient-to-br from-emerald-900/30 via-slate-900/60 to-cyan-900/30 rounded-2xl p-8 text-center border border-slate-800 backdrop-blur-xl">
            <h2 className="text-2xl font-bold text-white mb-4">Get Started</h2>
            <p className="text-slate-300 leading-relaxed mb-6 max-w-lg mx-auto">
              Ready to explore AI opportunities in your field? Search for your occupation 
              to discover specific ways AI can enhance your work.
            </p>
            <Link 
              href="/ai-jobs"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-emerald-400 hover:to-cyan-400 transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40"
            >
              Explore Occupations
              <ChevronRight className="w-4 h-4" />
            </Link>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 px-4 py-12 mt-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500 text-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-500" />
            <span className="font-semibold text-slate-300">AI Jobs Map</span>
          </div>
          <p>Built with Next.js, Supabase & Vercel · Data from U.S. Bureau of Labor Statistics</p>
        </div>
      </footer>
    </div>
  );
}
