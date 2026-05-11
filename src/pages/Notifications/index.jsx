/**
 * @module NotificationsPage
 * @description Admin notification center with filters, priority badges, and action routing.
 */
import { useMemo, useState } from 'react';
import {
  App,
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Input,
  List,
  Pagination,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Tag,
  Typography,
} from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
  ExclamationCircleOutlined,
  FileDoneOutlined,
  ReadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useNavigate } from 'react-router';
import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from '../../store/api/notificationApi.js';
import {
  getNotificationActionLabel,
  getNotificationCategory,
  getNotificationPriority,
  getNotificationStatus,
  resolveNotificationTarget,
} from '../../utils/notificationNavigation.js';
import { useApproveDeviceExceptionMutation, useRejectDeviceExceptionMutation } from '../../store/api/deviceExceptionApi.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { parseApiError } from '../../utils/errorHandler.js';
import PageHeader from '../../components/common/PageHeader.jsx';

dayjs.extend(relativeTime);

const { RangePicker } = DatePicker;

const CATEGORY_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Unread', value: 'unread' },
  { label: 'Leaves', value: 'leave' },
  { label: 'Regularisations', value: 'regularisation' },
  { label: 'Device exceptions', value: 'device_exception' },
  { label: 'Attendance alerts', value: 'attendance' },
  { label: 'Billing/System', value: 'billing_system' },
];

const PRIORITY_COLORS = {
  critical: 'red',
  high: 'orange',
  normal: 'blue',
  low: 'default',
};

const STATUS_COLORS = {
  action_needed: 'gold',
  approved: 'green',
  rejected: 'red',
  cancelled: 'default',
  failed: 'red',
  completed: 'green',
  info: 'blue',
};

const CATEGORY_META = {
  leave: { label: 'Leave', icon: <FileDoneOutlined />, color: 'green' },
  regularisation: { label: 'Regularisation', icon: <ClockCircleOutlined />, color: 'purple' },
  device_exception: { label: 'Device exception', icon: <SafetyCertificateOutlined />, color: 'red' },
  attendance: { label: 'Attendance', icon: <ExclamationCircleOutlined />, color: 'orange' },
  billing: { label: 'Billing', icon: <CreditCardOutlined />, color: 'blue' },
  report: { label: 'Report', icon: <ReadOutlined />, color: 'cyan' },
  employee: { label: 'Employee', icon: <UserOutlined />, color: 'geekblue' },
  system: { label: 'System', icon: <BellOutlined />, color: 'default' },
};

function humanize(value) {
  return String(value || 'info')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getRequestId(notification) {
  const data = notification?.data || {};
  return (
    data.exception_id ||
    data.exceptionId ||
    data.leave_id ||
    data.leaveId ||
    data.regularisation_id ||
    data.regularisationId ||
    data.attendance_id ||
    data.attendanceId ||
    data.report_id ||
    data.reportId ||
    data.requestId
  );
}

export default function NotificationsPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [category, setCategory] = useState('all');
  const [readState, setReadState] = useState();
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const queryParams = useMemo(() => {
    const params = {
      page,
      limit: 12,
      search: debouncedSearch || undefined,
      isRead: readState,
      dateFrom: dateRange?.[0] ? dayjs(dateRange[0]).format('YYYY-MM-DD') : undefined,
      dateTo: dateRange?.[1] ? dayjs(dateRange[1]).format('YYYY-MM-DD') : undefined,
    };

    if (category === 'unread') {
      params.isRead = false;
    } else if (category === 'billing_system') {
      params.type = 'billing_alert,general,report_generated,report_failed';
    } else if (category !== 'all') {
      params.category = category;
    }

    return params;
  }, [category, dateRange, debouncedSearch, page, readState]);

  const { data, isLoading, isFetching } = useGetNotificationsQuery(queryParams);
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: markAllLoading }] = useMarkAllNotificationsReadMutation();
  const [approveDeviceException, { isLoading: approvingDevice }] = useApproveDeviceExceptionMutation();
  const [rejectDeviceException, { isLoading: rejectingDevice }] = useRejectDeviceExceptionMutation();

  const notifications = data?.notifications || [];
  const total = data?.total || 0;
  const unreadCount = data?.unreadCount || data?.count || 0;
  const actionNeededCount = notifications.filter((item) => getNotificationStatus(item) === 'action_needed').length;
  const criticalCount = notifications.filter((item) => getNotificationPriority(item) === 'critical').length;

  const resetToFirstPage = (callback) => {
    setPage(1);
    callback();
  };

  const openNotification = async (notification) => {
    if (!notification?.isRead) {
      await markRead([notification.id]).unwrap().catch(() => {});
    }

    navigate(resolveNotificationTarget(notification));
  };

  const markOneRead = async (event, notification) => {
    event.stopPropagation();
    await markRead([notification.id]).unwrap().catch(() => {});
  };

  const handleDeviceAction = async (event, notification, action) => {
    event?.stopPropagation?.();
    const exceptionId = notification?.data?.exception_id || notification?.data?.exceptionId || notification?.data?.requestId;

    if (!exceptionId) {
      message.warning('Device exception id is missing in this notification.');
      return;
    }

    try {
      if (action === 'approve') {
        await approveDeviceException({ id: exceptionId }).unwrap();
        message.success('Device exception approved');
      } else {
        await rejectDeviceException({ id: exceptionId }).unwrap();
        message.success('Device exception rejected');
      }

      if (!notification.isRead) {
        await markRead([notification.id]).unwrap().catch(() => {});
      }
    } catch (error) {
      message.error(parseApiError(error));
    }
  };

  const renderActions = (notification) => {
    const categoryName = getNotificationCategory(notification);
    const status = getNotificationStatus(notification);

    if (categoryName === 'device_exception' && status === 'action_needed') {
      return (
        <Space onClick={(event) => event.stopPropagation()}>
          <Popconfirm
            title="Approve this device exception?"
            onConfirm={(event) => handleDeviceAction(event, notification, 'approve')}
          >
            <Button size="small" type="primary" loading={approvingDevice}>
              Approve
            </Button>
          </Popconfirm>
          <Popconfirm
            title="Reject this device exception?"
            onConfirm={(event) => handleDeviceAction(event, notification, 'reject')}
          >
            <Button size="small" danger loading={rejectingDevice}>
              Reject
            </Button>
          </Popconfirm>
        </Space>
      );
    }

    return (
      <Button
        size="small"
        type={status === 'action_needed' ? 'primary' : 'default'}
        onClick={(event) => {
          event.stopPropagation();
          openNotification(notification);
        }}
      >
        {getNotificationActionLabel(notification)}
      </Button>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" subtitle="Review admin alerts, requests, and system updates" />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Unread" value={unreadCount} prefix={<BellOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Action needed" value={actionNeededCount} prefix={<ExclamationCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Critical visible" value={criticalCount} valueStyle={{ color: criticalCount ? '#dc2626' : undefined }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Current results" value={total} prefix={<ReadOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Space wrap>
            {CATEGORY_FILTERS.map((item) => (
              <Button
                key={item.value}
                type={category === item.value ? 'primary' : 'default'}
                onClick={() => resetToFirstPage(() => setCategory(item.value))}
              >
                {item.label}
              </Button>
            ))}
          </Space>

          <Row gutter={[12, 12]}>
            <Col xs={24} md={9}>
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="Search title, message, or type"
                value={search}
                onChange={(event) => resetToFirstPage(() => setSearch(event.target.value))}
              />
            </Col>
            <Col xs={24} md={5}>
              <Select
                allowClear
                placeholder="Read state"
                style={{ width: '100%' }}
                value={readState}
                onChange={(value) => resetToFirstPage(() => setReadState(value))}
                disabled={category === 'unread'}
                options={[
                  { label: 'Unread only', value: false },
                  { label: 'Read only', value: true },
                ]}
              />
            </Col>
            <Col xs={24} md={7}>
              <RangePicker style={{ width: '100%' }} value={dateRange} onChange={(value) => resetToFirstPage(() => setDateRange(value))} />
            </Col>
            <Col xs={24} md={3}>
              <Button
                block
                onClick={() => markAllRead()}
                disabled={unreadCount === 0}
                loading={markAllLoading}
                icon={<CheckOutlined />}
              >
                Mark all
              </Button>
            </Col>
          </Row>
        </Space>
      </Card>

      <Card>
        {notifications.length === 0 && !isLoading ? (
          <Empty description="No notifications match these filters" />
        ) : (
          <List
            loading={isLoading || isFetching}
            dataSource={notifications}
            renderItem={(notification) => {
              const categoryName = getNotificationCategory(notification);
              const categoryMeta = CATEGORY_META[categoryName] || CATEGORY_META.system;
              const priority = getNotificationPriority(notification);
              const status = getNotificationStatus(notification);
              const requestId = getRequestId(notification);

              return (
                <List.Item
                  className="cursor-pointer rounded-md px-3"
                  style={{
                    background: notification.isRead ? '#ffffff' : '#f8fbff',
                    border: notification.isRead ? '1px solid #f0f0f0' : '1px solid #bfdbfe',
                    marginBottom: 12,
                  }}
                  onClick={() => openNotification(notification)}
                  actions={[
                    !notification.isRead ? (
                      <Button
                        key="read"
                        type="text"
                        size="small"
                        icon={<CheckOutlined />}
                        onClick={(event) => markOneRead(event, notification)}
                      />
                    ) : null,
                    <span key="action">{renderActions(notification)}</span>,
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    avatar={
                      <Badge dot={!notification.isRead}>
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            display: 'grid',
                            placeItems: 'center',
                            background: '#f3f4f6',
                            color: '#111827',
                          }}
                        >
                          {categoryMeta.icon}
                        </div>
                      </Badge>
                    }
                    title={
                      <Space wrap>
                        <Typography.Text strong>{notification.title}</Typography.Text>
                        <Tag color={categoryMeta.color}>{categoryMeta.label}</Tag>
                        <Tag color={PRIORITY_COLORS[priority]}>{humanize(priority)}</Tag>
                        <Tag color={STATUS_COLORS[status]}>{humanize(status)}</Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={6}>
                        <Typography.Text type="secondary">{notification.body}</Typography.Text>
                        <Space wrap size={8}>
                          {notification.employee?.name ? (
                            <Typography.Text type="secondary">
                              <TeamOutlined /> {notification.employee.name}
                            </Typography.Text>
                          ) : null}
                          {requestId ? <Typography.Text type="secondary">Ref: {String(requestId).slice(0, 8)}</Typography.Text> : null}
                          <Typography.Text type="secondary">
                            {notification.createdAt ? dayjs(notification.createdAt).fromNow() : ''}
                          </Typography.Text>
                        </Space>
                      </Space>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}

        {total > 12 ? (
          <div className="flex justify-end mt-4">
            <Pagination current={page} pageSize={12} total={total} onChange={setPage} showSizeChanger={false} />
          </div>
        ) : null}
      </Card>
    </div>
  );
}
