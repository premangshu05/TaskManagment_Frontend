import { useNotifications } from "../context/NotificationContext";
import { useState } from "react";

export default function NotificationBell() {
  const { notifications, clearNotifications } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="relative">
      <button
        className="relative"
        onClick={() => setShowDropdown((v) => !v)}
        title="Notifications"
      >
        <span className="text-2xl">🔔</span>
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-1 rounded-full">
            {notifications.length}
          </span>
        )}
      </button>
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-72 bg-white shadow-lg rounded-xl p-3 z-20">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-gray-700">Notifications</span>
            <button
              onClick={clearNotifications}
              className="text-xs text-gray-500 hover:text-red-500"
            >
              Clear all
            </button>
          </div>
          {notifications.length === 0 ? (
            <div className="text-gray-400">No notifications</div>
          ) : (
            <ul className="max-h-60 overflow-y-auto">
              {notifications.map((n, i) => (
                <li
                  key={i}
                  className="border-b last:border-b-0 py-2 text-sm text-gray-700"
                >
                  {n.message}
                  <div className="text-xs text-gray-400">
                    {new Date(n.timestamp).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
