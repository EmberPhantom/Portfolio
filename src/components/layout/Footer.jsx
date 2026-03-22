import { Github, Linkedin, Mail, ExternalLink } from 'lucide-react'

const socialLinks = [
  { icon: Github, href: 'https://github.com/EmberPhantom', label: 'GitHub' },
  { icon: Linkedin, href: 'https://www.linkedin.com/in/pranay-chandra-wdp', label: 'LinkedIn' },
  { icon: Mail, href: 'mailto:pranaychandra751@gmail.com', label: 'Email' },
]

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-forge-surface border-t border-forge-muted/20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8">
              <svg viewBox="0 0 40 40" className="w-full h-full">
                <polygon 
                  points="20,2 38,11 38,29 20,38 2,29 2,11" 
                  fill="#F97316"
                />
                <text 
                  x="20" 
                  y="26" 
                  textAnchor="middle" 
                  fill="#0A0A0A" 
                  fontSize="12" 
                  fontWeight="800"
                  fontFamily="Syne"
                >
                  PC
                </text>
              </svg>
            </div>
            <span className="font-display font-bold text-lg text-white">
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
                className="p-2 rounded-lg bg-forge-black/50 hover:bg-orange-500/20 transition-colors group"
              >
                <link.icon className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
              </a>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-forge-muted/20 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            © {currentYear} Pranay Chandra. Built with React + Tailwind.
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
