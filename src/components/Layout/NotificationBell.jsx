/**
 * @module NotificationBell
 * @description Notification bell icon with dropdown and unread count.
 */
import { Badge, Dropdown, List, Empty, Button } from 'antd';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { useNotifications } from '../../hooks/useNotifications.js';
import { useMarkNotificationReadMutation } from '../../store/api/notificationApi.js';
import { resolveNotificationTarget } from '../../utils/notificationNavigation.js';

export default function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, bellOpen, setBellOpen } = useNotifications();
  const [markRead] = useMarkNotificationReadMutation();

  const openNotification = async (item) => {
    if (!item?.isRead) {
      await markRead([item.id]).unwrap().catch(() => {});
    }

    setBellOpen(false);
    navigate(resolveNotificationTarget(item));
  };

  const markNotificationRead = async (event, itemId) => {
    event.stopPropagation();
    await markRead([itemId]).unwrap().catch(() => {});
  };

  const notificationMenu = {
    items: [
      {
        key: 'notifications-dropdown',
        label: (
          <div className="w-80 max-h-96 overflow-auto">
            {notifications && notifications.length > 0 ? (
              <List
                dataSource={notifications}
                renderItem={(item) => (
                  <List.Item
                    className="py-2 cursor-pointer"
                    onClick={() => openNotification(item)}
                    extra={
                      !item.isRead ? (
                        <Button
                          type="text"
                          size="small"
                          icon={<CheckOutlined />}
                          onClick={(event) => markNotificationRead(event, item.id)}
                        />
                      ) : null
                    }
                  >
                    <List.Item.Meta
                      title={
                        <span className="inline-flex items-center gap-2">
                          <span>{item.title}</span>
                          {!item.isRead ? <span className="inline-block h-2 w-2 rounded-full bg-blue-500" /> : null}
                        </span>
                      }
                      description={item.body}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No notifications" />
            )}
            <div className="mt-3 border-t border-[#f0f0f0] pt-3">
              <Button
                type="link"
                className="px-0"
                onClick={() => {
                  setBellOpen(false);
                  navigate('/notifications');
                }}
              >
                View all notifications
              </Button>
            </div>
          </div>
        ),
      },
    ],
  };

  return (
    <Dropdown menu={notificationMenu} trigger={['click']} open={bellOpen} onOpenChange={setBellOpen}>
      <Badge count={unreadCount} color="#ff4d4f">
        <BellOutlined className="text-lg cursor-pointer" />
      </Badge>
    </Dropdown>
  );
}
