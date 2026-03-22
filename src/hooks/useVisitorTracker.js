import { useEffect } from "react"
import { supabase } from "../lib/supabase"

export function useVisitorTracker() {
  useEffect(() => {
    async function trackVisit() {
      const sessionId = sessionStorage.getItem("visitor_session") || crypto.randomUUID()
      sessionStorage.setItem("visitor_session", sessionId)

      try {
        const userAgent = navigator.userAgent
        const deviceType = /mobile/i.test(userAgent) ? "mobile" : /tablet/i.test(userAgent) ? "tablet" : "desktop"

        await supabase.from("visitor_logs").insert([{
          page: window.location.pathname,
          referrer: document.referrer,
          user_agent: userAgent,
          device_type: deviceType,
          session_id: sessionId,
        }])
      } catch (err) {
        console.log("Visitor tracking disabled (no Supabase)")
      }
    }

    trackVisit()
  }, [])
}
