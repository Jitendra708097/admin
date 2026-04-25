/**
 * @module NotificationsPage
 * @description Notification center with list and read-state management.
 */
import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from '../../store/api/notificationApi.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import { Card, List, Button, Space, Empty } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { resolveNotificationTarget } from '../../utils/notificationNavigation.js';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useGetNotificationsQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: markAllLoading }] = useMarkAllNotificationsReadMutation();

  const notifications = data?.notifications || [];

  const openNotification = async (notification) => {
    if (!notification?.isRead) {
      await markRead([notification.id]).unwrap().catch(() => {});
    }

    navigate(resolveNotificationTarget(notification?.actionUrl));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Notifications" subtitle="View and manage notifications" />

      <Card className="m-6">
        <div className="flex justify-end mb-4">
          <Button
            type="default"
            onClick={() => markAllRead()}
            disabled={notifications.length === 0}
            loading={markAllLoading}
          >
            Mark all read
          </Button>
        </div>
        {notifications.length === 0 ? (
          <Empty description="No notifications" />
        ) : (
          <List
            loading={isLoading}
            dataSource={notifications}
            renderItem={(notification) => (
              <List.Item 
                className="py-4 cursor-pointer"
                onClick={() => openNotification(notification)}
                extra={
                  <Space>
                    {!notification.isRead && (
                      <Button
                        type="text"
                        size="small"
                        icon={<CheckOutlined />}
                        onClick={(event) => {
                          event.stopPropagation();
                          markRead([notification.id]);
                        }}
                      />
                    )}
                  </Space>
                }
              >
                <List.Item.Meta
                  title={
                    <span>
                      {notification.title}
                      {!notification.isRead && <div className="inline-block w-2 h-2 bg-blue-500 rounded-full ml-2" />}
                    </span>
                  }
                  description={notification.body}
                />
                <div>{notification.createdAt}</div>
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}
