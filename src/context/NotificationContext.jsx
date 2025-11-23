import React, { createContext, useContext, useEffect, useState } from "react";
import SockJS from "sockjs-client/dist/sockjs.min.js";
import { Client } from "@stomp/stompjs";

const NotificationContext = createContext();

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [stompClient, setStompClient] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {

    // Only connect if logged in
    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    const wsUrl = "https://taskmanagment-backend-1.onrender.com/ws";
    const sock = new SockJS(wsUrl);
    const client = new Client({
      webSocketFactory: () => sock,
      connectHeaders: {
        Authorization: "Bearer " + token,
      },
      reconnectDelay: 5000,
    });

    client.onConnect = (frame) => {
      setConnected(true);

      // Subscribe to user-specific notifications
      const subscription = client.subscribe(
        "/user/queue/notifications",
        (message) => {
          try {
            const data = JSON.parse(message.body);
            setNotifications((prev) => [
              { ...data, timestamp: new Date().toISOString(), id: Date.now() },
              ...prev,
            ]);
          } catch (e) {
            setNotifications((prev) => [
              {
                message: message.body,
                timestamp: new Date().toISOString(),
                id: Date.now(),
              },
              ...prev,
            ]);
          }
        }
      );

      // Send subscription confirmation
      client.publish({
        destination: '/app/subscribe',
        body: JSON.stringify({
          message: 'Frontend connected and ready for notifications'
        })
      });
    };

    client.onDisconnect = () => {
      setConnected(false);
    };

    client.onStompError = (frame) => {
      setConnected(false);
    };

    client.activate();
    setStompClient(client);

    // Disconnect when component unmounts
    return () => {
      if (client) {
        client.deactivate();
      }
    };
  }, []);

  // Clear all notifications
  function clearNotifications() {
    setNotifications([]);
  }

  // Add a test notification function for debugging
  function addTestNotification(customMessage = null) {
    const testNotification = {
      message: customMessage || "Test notification - " + new Date().toLocaleTimeString(),
      timestamp: new Date().toISOString(),
      id: Date.now(),
    };
    setNotifications((prev) => [testNotification, ...prev]);
  }

  // Add a custom notification
  function addNotification(message, type = "info") {
    const notification = {
      message,
      timestamp: new Date().toISOString(),
      id: Date.now(),
      type
    };
    setNotifications((prev) => [notification, ...prev]);
  }

  // Send test message to backend
  function sendTestMessage() {
    if (stompClient && connected) {
      stompClient.publish({
        destination: '/app/test',
        body: JSON.stringify({
          message: 'Test message from frontend - ' + new Date().toLocaleTimeString(),
          type: 'test'
        })
      });
      addNotification("Test message sent to backend", "info");
    } else {
      addNotification("Cannot send test message - WebSocket not connected", "error");
    }
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        clearNotifications,
        connected,
        addTestNotification,
        addNotification,
        sendTestMessage,
        stompClient,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
