import { useNotifications } from "../context/NotificationContext";

function NotificationsPage() {
  const { 
    notifications, 
    clearNotifications, 
    connected
  } = useNotifications();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-yellow-600">Notifications</h2>
          <div className="text-sm mt-1">
            Status: <span className={`font-medium ${connected ? 'text-green-600' : 'text-red-600'}`}>
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        <div>
          <button
            className="bg-gray-200 px-3 py-1 rounded text-gray-700 hover:bg-gray-300"
            onClick={clearNotifications}
          >
            Clear All
          </button>
        </div>
      </div>
      {notifications.length === 0 ? (
        <div className="text-gray-400 text-center mt-10">
          <p>No notifications yet!</p>
          <p className="text-sm mt-2">
            {connected 
              ? "Real-time notifications are enabled. You'll see task updates here." 
              : "Connecting to notification service..."
            }
          </p>
        </div>
      ) : (
        <ul className="divide-y">
          {notifications.map((n) => (
            <li key={n.id || n.timestamp} className="py-3">
              <div className={`p-3 rounded-lg ${
                n.type === 'error' ? 'bg-red-50 border-l-4 border-red-400' :
                n.type === 'success' ? 'bg-green-50 border-l-4 border-green-400' :
                n.type === 'warning' ? 'bg-yellow-50 border-l-4 border-yellow-400' :
                'bg-blue-50 border-l-4 border-blue-400'
              }`}>
                <div className="text-gray-800 font-medium">{n.message}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(n.timestamp).toLocaleString()}
                  {n.type && <span className="ml-2 px-2 py-1 bg-gray-200 rounded text-xs">{n.type}</span>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default NotificationsPage;
