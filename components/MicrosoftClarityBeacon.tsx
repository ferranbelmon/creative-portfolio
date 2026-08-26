"use client";

import { useEffect } from "react";
import Clarity from "@microsoft/clarity";

/** Public project id from Clarity → Settings (same as the snippet tag). */
const clarityId =
  process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || "y8iiaa51u0";

export function MicrosoftClarityBeacon() {
  useEffect(() => {
    Clarity.init(clarityId);
  }, []);

  return null;
}
