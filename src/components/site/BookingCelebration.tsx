export default function BookingCelebration({ eventName, count }: { eventName: string; count: number }) {
  return (
    <div className="ticket-ceremony" aria-hidden="true">
      <span className="ticket-ceremony-light" />
      <span className="ticket-ceremony-trail" />
      <div className="ticket-ceremony-card">
        <div className="ticket-ceremony-main">
          <span className="ticket-ceremony-label">EASY TICKETS / NAMIBIA</span>
          <strong>{eventName}</strong>
          <span className="ticket-ceremony-admit">{count === 1 ? "ONE TICKET" : `${count} TICKETS`} ISSUED</span>
        </div>
        <span className="ticket-ceremony-perforation" />
        <div className="ticket-ceremony-stub"><img src="/brand/easy-tickets-symbol.png" alt="" /><span>ET</span></div>
        <span className="ticket-ceremony-seal">READY<br />FOR ENTRY</span>
      </div>
    </div>
  );
}
