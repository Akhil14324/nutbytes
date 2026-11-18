"use client";

import { useEffect, useState } from "react";
import { isDesktop, waLink } from "@/lib/site";

type Props = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "target" | "rel"> & {
  /** The message that is typed in for the customer. */
  text: string;
  /** Another WhatsApp number, in international format without "+". Defaults to the main shop number. */
  phone?: string;
};

/**
 * A link that opens a WhatsApp chat with NutBytes in a new tab:
 * WhatsApp Web on computers, the WhatsApp app on phones.
 */
export default function WhatsAppLink({ text, phone, children, ...rest }: Props) {
  // the server can't know the device, so start with wa.me and switch after mount
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDesktop(isDesktop());
  }, []);

  return (
    <a {...rest} href={waLink(text, { phone, desktop })} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}
