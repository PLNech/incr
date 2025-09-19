'use client';

import React, { useEffect, useState } from 'react';

interface Notification {
  id: string;
  message: string;
  type: 'xp' | 'levelup' | 'achievement' | 'info';
  duration?: number;
}

interface NotificationToastProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notifications,
  onRemove
}) => {
  useEffect(() => {
    notifications.forEach(notification => {
      const timer = setTimeout(() => {
        onRemove(notification.id);
      }, notification.duration || 3000);

      return () => clearTimeout(timer);
    });
  }, [notifications, onRemove]);

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'xp':
        return 'bg-blue-500 text-white';
      case 'levelup':
        return 'bg-gold-500 text-white';
      case 'achievement':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'xp':
        return '✨';
      case 'levelup':
        return '🎉';
      case 'achievement':
        return '🏆';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`
            ${getNotificationStyle(notification.type)}
            px-4 py-2 rounded-lg shadow-lg
            transform transition-all duration-500 ease-in-out
            animate-slide-in-right
          `}
        >
          <div className="flex items-center space-x-2">
            <span className="text-lg">
              {getNotificationIcon(notification.type)}
            </span>
            <span className="font-medium">
              {notification.message}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};