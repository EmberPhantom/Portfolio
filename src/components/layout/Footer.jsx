import { Github, Linkedin, Mail, ExternalLink } from 'lucide-react'

const socialLinks = [
  { icon: Github, href: 'https://github.com/EmberPhantom', label: 'GitHub' },
  { icon: Linkedin, href: 'https://www.linkedin.com/in/pranay-chandra-wdp', label: 'LinkedIn' },
  { icon: Mail, href: 'mailto:pranaychandra751@gmail.com', label: 'Email' },
]

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-surface border-t border-muted/20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 border border-muted/30 rounded-lg flex items-center justify-center bg-bg shadow-sm">
              <svg width="24" height="24" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-text">
                <rect x="8" y="4" width="6" height="32" rx="1" fill="currentColor"/>
                <path d="M22 8C28.6274 8 34 13.3726 34 20C34 26.6274 28.6274 32 22 32" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>
                <circle cx="21" cy="20" r="3.5" fill="#F97316"/>
              </svg>
            </div>
            <span className="font-display font-bold text-lg text-text">
              Pranay Chandra
            </span>
          </div>

          <div className="flex items-center gap-6">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-bg/50 hover:bg-accent/20 transition-colors group border border-muted/10"
              >
                <link.icon className="w-5 h-5 text-text-muted group-hover:text-accent transition-colors" />
              </a>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-muted/20 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-text-muted">
            © {currentYear} Pranay Chandra. Built with Next.js + Tailwind.
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Engineering ideas into reality.</span>
            <ExternalLink className="w-4 h-4" />
          </div>
        </div>
      </div>
    </footer>
  )
}
