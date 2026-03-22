import emailjs from '@emailjs/browser'

const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'service_xxxx'
const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 'template_xxxx'
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || 'xxxx'

export async function sendEmail(formData) {
  if (SERVICE_ID === 'service_xxxx' || PUBLIC_KEY === 'xxxx') {
    console.log('EmailJS not configured. Email would be sent with:', formData)
    await new Promise(resolve => setTimeout(resolve, 1000))
    return { success: true }
  }

  try {
    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        from_name: formData.name,
        from_email: formData.email,
        subject: formData.subject || 'Portfolio Contact',
        message: formData.message,
      },
      {
        publicKey: PUBLIC_KEY,
      }
    )
    return response
  } catch (error) {
    console.error('EmailJS Error:', error)
    throw error
  }
}
