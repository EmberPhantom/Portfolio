import VisitorStats from '../../components/dashboard/VisitorStats';
import MessageInbox from '../../components/dashboard/MessageInbox';
import AIPersonalizedBriefing from '../../components/dashboard/AIPersonalizedBriefing';

export default function DashboardHome() {
  return (
    <div className="w-full space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section>
        <AIPersonalizedBriefing />
      </section>

      <section>
        <VisitorStats />
      </section>
      
      <section>
        <MessageInbox />
      </section>
    </div>
  );
}
