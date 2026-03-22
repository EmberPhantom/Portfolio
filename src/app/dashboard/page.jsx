"use client";

import VisitorStats from '../../components/dashboard/VisitorStats';
import MessageInbox from '../../components/dashboard/MessageInbox';

export default function DashboardHome() {
  return (
    <div className="w-full space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section>
        <VisitorStats />
      </section>
      
      <section>
        <MessageInbox />
      </section>
    </div>
  );
}
