"use client";

import { useEffect, useRef } from "react";
import { useToken } from "../../context/TokenContext";
import { useToast } from "./Notify";

export default function NotificationListener() {
  const token = useToken();
  const { showToast } = useToast();
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // ไม่มี token หรือรันฝั่ง server ไม่ต้องทำอะไร
    if (typeof window === "undefined") return;

    // ถ้ามี socket เดิมอยู่ ให้ปิดก่อน
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    if (!token) return;

    const base = process.env.NEXT_PUBLIC_ROOT_PATH_NOTIFICATION_SERVICE || "";
    const wsBase = base.replace(/^http/, "ws");
    const wsUrl = `${wsBase}/ws?token=${token}`;

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("[NotificationListener] WebSocket connected");
    };

    socket.onerror = (event) => {
      console.error("[NotificationListener] WebSocket error", event);
    };

    socket.onclose = (event) => {
      console.log("[NotificationListener] WebSocket closed", event.code, event.reason);
      socketRef.current = null;
    };

    socket.onmessage = (event) => {
      console.log("[NotificationListener] message:", event.data);
      try {
        const payload = JSON.parse(event.data as string);
        const title = payload?.title ?? "Notification";
        const message = payload?.message ?? "";
        const related_type = payload?.related_type ?? "";
        if (message) {
          showToast(title, message, related_type);
        }
      } catch (err) {
        console.error("[NotificationListener] Failed to parse message", err);
      }
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [token, showToast]);

  // component นี้ไม่ render UI อะไรเลย
  return null;
}
