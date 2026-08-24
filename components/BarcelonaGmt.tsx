"use client";

import { useEffect, useState } from "react";
import { formatBarcelonaGmt } from "@/components/LocalTimeStatus";

export function BarcelonaGmt() {
  const [label, setLabel] = useState("GMT");

  useEffect(() => {
    setLabel(formatBarcelonaGmt(new Date()));
  }, []);

  return <>{label}</>;
}
