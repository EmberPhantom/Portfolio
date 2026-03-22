import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, MapPin, Github, Linkedin, Send, Loader2, CheckCircle } from 'lucide-react'
import { sendEmail } from '../../lib/emailjs'

const socialLinks = [
  { icon: Github, href: 'https://github.com/EmberPhantom', label: 'GitHub' },
  { icon: Linkedin, href: 'https://www.linkedin.com/in/pranay-chandra-wdp', label: 'LinkedIn' },
  { icon: Mail, href: 'mailto:pranaychandra751@gmail.com', label: 'Email' },
]

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [status, setStatus] = useState('idle')
  const [errors, setErrors] = useState({})

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email'
    if (!formData.message.trim()) newErrors.message = 'Message is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate() || status === 'sending') return

    setStatus('sending')
    
    try {
      await sendEmail(formData)
      setStatus('success')
      setFormData({ name: '', email: '', subject: '', message: '' })
      setTimeout(() => setStatus('idle'), 3000)
    } catch (error) {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  return (
    <section id="contact" className="py-24 bg-forge-surface">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h2 className="font-display text-4xl font-bold text-white mb-4">
            Get In <span className="text-orange-500">Touch</span>
          </h2>
          <div className="w-20 h-1 bg-orange-500" />
          <p className="text-gray-400 mt-4 max-w-2xl">
            Have a project in mind or just want to chat? Feel free to reach out!
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-500/10 rounded-lg">
                  <Mail className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Email</h3>
                  <a href="mailto:pranaychandra751@gmail.com" className="text-gray-400 hover:text-orange-500">
                    pranaychandra751@gmail.com
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-500/10 rounded-lg">
                  <MapPin className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Location</h3>
                  <p className="text-gray-400">India</p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Connect</h3>
                <div className="flex gap-4">
                  {socialLinks.map((link) => (
                    <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
                      className="p-3 bg-forge-black rounded-lg hover:bg-orange-500/20 transition-colors group">
                      <link.icon className="w-5 h-5 text-gray-400 group-hover:text-orange-500" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <input type="text" name="name" value={formData.name} onChange={handleChange}
                    placeholder="Your Name"
                    className={`w-full px-4 py-3 bg-forge-black rounded-lg text-white placeholder-gray-500 border ${errors.name ? 'border-red-500' : 'border-forge-muted/20'} focus:border-orange-500 focus:outline-none`} />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>
                <div>
                  <input type="email" name="email" value={formData.email} onChange={handleChange}
                    placeholder="Your Email"
                    className={`w-full px-4 py-3 bg-forge-black rounded-lg text-white placeholder-gray-500 border ${errors.email ? 'border-red-500' : 'border-forge-muted/20'} focus:border-orange-500 focus:outline-none`} />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>
              </div>
              <div>
                <input type="text" name="subject" value={formData.subject} onChange={handleChange}
                  placeholder="Subject (optional)"
                  className="w-full px-4 py-3 bg-forge-black rounded-lg text-white placeholder-gray-500 border border-forge-muted/20 focus:border-orange-500 focus:outline-none" />
              </div>
              <div>
                <textarea name="message" value={formData.message} onChange={handleChange}
                  placeholder="Your Message" rows={5}
                  className={`w-full px-4 py-3 bg-forge-black rounded-lg text-white placeholder-gray-500 border ${errors.message ? 'border-red-500' : 'border-forge-muted/20'} focus:border-orange-500 focus:outline-none resize-none`} />
                {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message}</p>}
              </div>
              <button type="submit" disabled={status === 'sending' || status === 'success'}
                className="w-full py-3 bg-orange-500 text-forge-black font-semibold rounded-lg hover:bg-orange-400 disabled:opacity-50 flex items-center justify-center gap-2">
                {status === 'sending' && <Loader2 className="w-5 h-5 animate-spin" />}
                {status === 'success' && <CheckCircle className="w-5 h-5" />}
                {status === 'sending' ? 'Sending...' : status === 'success' ? 'Sent!' : 'Send Message'}
                {!['sending', 'success'].includes(status) && <Send className="w-5 h-5" />}
              </button>
              {status === 'error' && <p className="text-red-500 text-center">Failed to send. Try again.</p>}
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
