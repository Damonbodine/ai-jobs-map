import Link from 'next/link';
import { TrendingUp, Clock, CheckCircle2, ArrowRight, Quote, Sparkles, Zap } from 'lucide-react';

const caseStudies = [
  {
    id: 1,
    company: "Acme Corp",
    industry: "Professional Services",
    size: "25-50 employees",
    role: "Accounts Payable Manager",
    slug: "acme-corp-ap",
    summary: "How automated invoice processing saved 12 hours/week",
    coverage: 89,
    hoursSaved: 12,
    weeklyValue: 900,
    paybackDays: 18,
    thumbnail: "💰",
    tags: ["Finance", "Invoice Processing", "OCR"],
    challenge: "The AP team was spending 15+ hours per week manually processing invoices - data entry, matching to POs, and routing for approval. Errors were costing $2,000/month in duplicate payments.",
    solution: "Implemented Invoice Processing Pipeline with OCR extraction, automatic PO matching, and intelligent approval routing. The AI learns from corrections and gets smarter over time.",
    results: [
      { metric: "Hours saved/week", value: "12", change: "-75%" },
      { metric: "Error rate", value: "0.3%", change: "-95%" },
      { metric: "Processing time/invoice", value: "2 min", change: "-96%" },
      { metric: "Monthly cost savings", value: "$3,600", change: "" },
    ],
    testimonial: "I went from drowning in invoices to having time to actually analyze our spending. The system even caught a $15,000 duplicate payment in the first month.",
    testimonialAuthor: "Sarah J., AP Manager",
  },
  {
    id: 2,
    company: "TechStart Inc",
    industry: "Software",
    size: "10-25 employees",
    role: "Sales Operations",
    slug: "techstart-sales-ops",
    summary: "Automated lead follow-up increased conversion by 34%",
    coverage: 76,
    hoursSaved: 8,
    weeklyValue: 600,
    paybackDays: 24,
    thumbnail: "📈",
    tags: ["Sales", "CRM", "Lead Management"],
    challenge: "Sales team was spending 70% of time on administrative tasks - logging calls, sending follow-ups, updating CRM. Leads were falling through the cracks and conversion was suffering.",
    solution: "Deployed Lead Generation & Follow-up Automation with AI-powered call logging, automated follow-up sequences, and intelligent lead scoring. Integrates with Salesforce and Slack.",
    results: [
      { metric: "Leads followed up/day", value: "45", change: "+340%" },
      { metric: "Conversion rate", value: "12%", change: "+34%" },
      { metric: "Sales cycle length", value: "18 days", change: "-28%" },
      { metric: "Revenue impact", value: "+$18K/mo", change: "" },
    ],
    testimonial: "We nearly doubled our conversion rate without adding headcount. The automated follow-ups feel personal and the AI actually sounds better than I do.",
    testimonialAuthor: "Mike T., VP Sales",
  },
  {
    id: 3,
    company: "Regional Medical Group",
    industry: "Healthcare",
    size: "50-100 employees",
    role: "Medical Records",
    slug: "regional-medical-records",
    summary: "Streamlined patient intake and records management",
    coverage: 82,
    hoursSaved: 15,
    weeklyValue: 1125,
    paybackDays: 14,
    thumbnail: "🏥",
    tags: ["Healthcare", "Compliance", "Document Processing"],
    challenge: "Patient intake was paper-based with 3-day average processing time. Staff spent 4+ hours daily scanning, indexing, and filing medical records. HIPAA compliance was a constant concern.",
    solution: "Built Patient Intake Automation with digital forms, automatic indexing via OCR, intelligent categorization, and HIPAA-compliant storage. Includes audit trails and access controls.",
    results: [
      { metric: "Processing time", value: "4 hours", change: "-87%" },
      { metric: "Chart pull time", value: "< 30 sec", change: "-95%" },
      { metric: "Compliance score", value: "98%", change: "+12%" },
      { metric: "Patient satisfaction", value: "4.8/5", change: "+40%" },
    ],
    testimonial: "Our front desk staff can actually focus on patients instead of paperwork. The compliance features give us peace of mind during audits.",
    testimonialAuthor: "Dr. Patricia L., Practice Administrator",
  },
  {
    id: 4,
    company: "Momentum Marketing",
    industry: "Marketing Agency",
    size: "5-10 employees",
    role: "Content Manager",
    slug: "momentum-marketing",
    summary: "AI-powered content creation scaled blog output 5x",
    coverage: 71,
    hoursSaved: 10,
    weeklyValue: 750,
    paybackDays: 20,
    thumbnail: "✍️",
    tags: ["Marketing", "Content", "SEO"],
    challenge: "Content team was creating 2 blog posts/week due to research and writing time. Competitors were publishing 10+/week and dominating SEO. Needed to scale without adding writers.",
    solution: "Implemented Content Creation Engine with AI research, outline generation, first-draft writing, SEO optimization, and scheduling. Human writers focus on editing and final polish.",
    results: [
      { metric: "Blog posts/week", value: "10", change: "+400%" },
      { metric: "SEO traffic", value: "+180%", change: "" },
      { metric: "Cost per article", value: "$45", change: "-70%" },
      { metric: "Time per article", value: "45 min", change: "-85%" },
    ],
    testimonial: "We're outranking competitors who have 5x our budget. The AI doesn't replace our writers - it makes them 5x more productive.",
    testimonialAuthor: "Jessica R., Content Director",
  },
  {
    id: 5,
    company: "Summit Financial",
    industry: "Financial Services",
    size: "25-50 employees",
    role: "Compliance Officer",
    slug: "summit-financial",
    summary: "Automated regulatory compliance saved 20 hours/week",
    coverage: 94,
    hoursSaved: 20,
    weeklyValue: 2000,
    paybackDays: 10,
    thumbnail: "⚖️",
    tags: ["Finance", "Compliance", "Reporting"],
    challenge: "Compliance team was buried in manual reporting - quarterly filings, client disclosures, regulatory updates. One missed deadline could result in major fines.",
    solution: "Deployed Compliance Automation Suite with automatic report generation, deadline tracking, regulatory update monitoring, and audit trail documentation.",
    results: [
      { metric: "Compliance hours/week", value: "5", change: "-80%" },
      { metric: "Report accuracy", value: "100%", change: "" },
      { metric: "Audit prep time", value: "2 days", change: "-90%" },
      { metric: "Risk events", value: "0", change: "-100%" },
    ],
    testimonial: "I sleep better at night knowing the system is watching deadlines. Our last audit took 2 days instead of 2 weeks.",
    testimonialAuthor: "Robert M., Compliance Officer",
  },
];

export default function CaseStudies() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 relative selection:bg-cyan-500/30 overflow-x-hidden">
      {/* Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[140px] rounded-full pointer-events-none animate-pulse-glow" style={{ animationDuration: '7s' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-cyan-600/10 blur-[140px] rounded-full pointer-events-none animate-pulse-glow" style={{ animationDuration: '9s' }} />

      <main className="px-4 py-8 max-w-7xl mx-auto relative z-10">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 text-emerald-400 text-sm font-medium mb-6 backdrop-blur-md">
            <CheckCircle2 className="w-4 h-4" />
            <span>Verified Results</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Real Results from{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Real Businesses</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            See how companies like yours are saving 10+ hours per week with AI automation.
            All numbers are verified and updated monthly.
          </p>
        </div>

        {/* Stats Banner */}
        <div className="bg-gradient-to-r from-emerald-900/30 via-slate-900/60 to-cyan-900/30 border border-slate-800 rounded-2xl p-6 mb-12 backdrop-blur-xl">
          <div className="grid md:grid-cols-4 gap-6 text-center">
            {[
              { value: '$2.4M+', label: 'Annual Savings Generated', icon: <TrendingUp className="w-5 h-5" />, color: 'text-emerald-400' },
              { value: '12,400h', label: 'Hours Saved Per Year', icon: <Clock className="w-5 h-5" />, color: 'text-cyan-400' },
              { value: '98.7%', label: 'Success Rate', icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-purple-400' },
              { value: '18 days', label: 'Avg. Payback Period', icon: <Zap className="w-5 h-5" />, color: 'text-orange-400' },
            ].map((stat, i) => (
              <div key={i}>
                <div className={`${stat.color} mx-auto mb-2 flex justify-center`}>{stat.icon}</div>
                <div className={`text-3xl font-black ${stat.color}`}>{stat.value}</div>
                <div className="text-slate-400 text-sm font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Case Studies Grid */}
        <div className="space-y-8">
          {caseStudies.map((study) => (
            <article 
              key={study.id}
              className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-colors"
            >
              <div className="md:flex">
                {/* Sidebar */}
                <div className="md:w-64 bg-slate-950/50 p-6 border-r border-slate-800/50">
                  <div className="text-4xl mb-4">{study.thumbnail}</div>
                  <h3 className="text-white font-bold text-lg mb-1">{study.company}</h3>
                  <p className="text-slate-400 text-sm mb-4">{study.industry}</p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {study.tags.map(tag => (
                      <span key={tag} className="inline-block px-2.5 py-1 bg-slate-800/80 text-slate-300 text-xs rounded-lg border border-slate-700/50 font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      { label: 'Job Coverage', value: `${study.coverage}%`, color: 'text-emerald-400' },
                      { label: 'Hours Saved', value: `${study.hoursSaved}h/week`, color: 'text-white' },
                      { label: 'Weekly Value', value: `$${study.weeklyValue}`, color: 'text-emerald-400' },
                      { label: 'Payback', value: `${study.paybackDays} days`, color: 'text-white' },
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-slate-400">{item.label}</span>
                        <span className={`${item.color} font-medium`}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6">
                  <div className="mb-6">
                    <div className="text-emerald-400 text-sm font-medium mb-1">{study.role}</div>
                    <h2 className="text-2xl font-bold text-white mb-2">{study.summary}</h2>
                    <p className="text-slate-300">{study.challenge}</p>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      Solution
                    </h3>
                    <p className="text-slate-300">{study.solution}</p>
                  </div>

                  {/* Results */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {study.results.map((result, i) => (
                      <div key={i} className="bg-slate-950/50 rounded-xl p-4 text-center border border-slate-800">
                        <div className="text-xl font-bold text-white">{result.value}</div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">{result.metric}</div>
                        {result.change && (
                          <div className="text-emerald-400 text-xs font-semibold mt-1">{result.change}</div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Testimonial */}
                  <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-xl p-5">
                    <Quote className="w-5 h-5 text-emerald-500/40 mb-2" />
                    <div className="text-slate-300 italic mb-3">&quot;{study.testimonial}&quot;</div>
                    <div className="text-emerald-400 text-sm font-semibold">— {study.testimonialAuthor}</div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-br from-emerald-900/30 via-slate-900/60 to-cyan-900/30 rounded-2xl p-8 text-center border border-slate-800 backdrop-blur-xl">
          <h2 className="text-2xl font-bold text-white mb-4">Get Similar Results for Your Business</h2>
          <p className="text-slate-300 mb-6 max-w-lg mx-auto">
            Start with a free audit to see exactly how much time and money you could save.
          </p>
          <Link 
            href="/factory"
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-emerald-400 hover:to-cyan-400 transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40"
          >
            Start Your Free Audit
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 px-4 py-12 mt-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-500" />
            <span className="font-semibold text-slate-300">AI Jobs Factory</span>
          </div>
          <p>Real results from real businesses</p>
        </div>
      </footer>
    </div>
  );
}
