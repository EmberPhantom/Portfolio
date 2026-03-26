/**
 * Provides high-fidelity mock data for the EmberOS dashboard
 * used when Supabase is disconnected or empty.
 */
export const getMockIntelligence = () => ({
  current_focus: "Architecting Neural Interfaces for Autonomous Digital Environments",
  recent_milestones: [
    "Core Neural Hub Optimized (v2.5)",
    "Distributed Intelligence Syncing",
    "Identity Hub Calibration Complete"
  ],
  suggested_actions: [
    "Review Neural Weights",
    "Calibrate Identity Sync",
    "Monitor Command Telemetry"
  ],
  life_mood: "CALIBRATED / SYNCHRONIZED"
});

export const getMockVisitorStats = () => {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return {
    total: 1284,
    unique: 842,
    avgDepth: 4.2,
    devices: { desktop: 65, mobile: 28, tablet: 7 },
    countries: { 'United States': 450, 'India': 320, 'Germany': 120, 'Japan': 85, 'United Kingdom': 65 },
    traffic: labels.map(() => Math.floor(Math.random() * 50) + 100)
  };
};

export const getMockMessages = () => [
  { id: 1, sender: "Satoshi G.", email: "sg@neural.link", subject: "Collaboration Proposal", status: "unread", date: new Date().toISOString() },
  { id: 2, sender: "Ember Intelligence", email: "system@ember.os", subject: "Weekly Pulse Report", status: "read", date: new Date(Date.now() - 86400000).toISOString() },
];
