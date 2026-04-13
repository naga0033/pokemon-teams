"use client";

import { useEffect } from "react";

type Props = {
  teamId: string;
};

export function TeamViewTracker({ teamId }: Props) {
  useEffect(() => {
    void fetch(`/api/teams/${encodeURIComponent(teamId)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      keepalive: true,
      body: JSON.stringify({ action: "view" }),
    }).catch(() => {
      // 閲覧数計測の失敗でUIは止めない
    });
  }, [teamId]);

  return null;
}
