"use client";

import { useRef } from "react";
import { Maximize2, X } from "lucide-react";

export default function EntryMode({ qr, eventName, dateText, timeText, holderName, shortCode }: {
  qr: string; eventName: string; dateText: string; timeText: string; holderName: string; shortCode: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  return <>
    <button type="button" className="admission-qr-button" onClick={() => dialog.current?.showModal()} aria-label="Open full-screen QR code for entry">
      <img src={qr} alt="Ticket QR code for scanning at entry" />
      <span><Maximize2 size={14}/> Tap to enlarge for scanning</span>
    </button>
    <dialog ref={dialog} className="entry-dialog" onClick={(event) => { if (event.target === dialog.current) dialog.current?.close(); }}>
      <div className="entry-dialog-content">
        <header><span>ENTRY MODE</span><button type="button" onClick={() => dialog.current?.close()} aria-label="Close entry mode"><X size={22}/></button></header>
        <div className="entry-dialog-main"><p>Show this at the gate</p><h2>{eventName}</h2><div className="entry-dialog-qr"><img src={qr} alt="Full-screen ticket QR code" /></div><strong>ET · {shortCode}</strong><span>{dateText} · {timeText}</span><span>{holderName}</span></div>
        <p className="entry-dialog-tip">Keep this screen steady while staff scan your ticket.</p>
      </div>
    </dialog>
  </>;
}
