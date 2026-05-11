import { Alert, Avatar, Button, Card, Col, Empty, List, Progress, Row, Space, Statistic, Table, Tag, Tooltip, Typography } from 'antd';
import {
  AlertOutlined,
  ApartmentOutlined,
  AuditOutlined,
  BankOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  FieldTimeOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UserSwitchOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import PageHeader from '../../components/common/PageHeader.jsx';
import Skeleton from '../../components/common/Skeleton.jsx';
import AttendanceTrendChart from '../../components/AttendanceTrendChart.jsx';
import LateBarChart from '../../components/charts/LateBarChart.jsx';
import StatusPieChart from '../../components/charts/StatusPieChart.jsx';
import { useGetAdminDashboardSummaryQuery } from '../../store/api/dashboardApi.js';

dayjs.extend(relativeTime);

const { Text, Title } = Typography;

const CARD_STYLE = { borderRadius: 8 };

function hasChartData(data = []) {
  return data.some((item) => Number(item.value || item.present || item.absent || item.leave || item.late || item.count || 0) > 0);
}

function MetricCard({ title, value, icon, color, suffix, onClick, tooltip }) {
  const content = (
    <Card bordered={false} style={CARD_STYLE} hoverable={Boolean(onClick)} onClick={onClick}>
      <Statistic
        title={title}
        value={value}
        suffix={suffix}
        prefix={icon}
        valueStyle={{ color }}
      />
    </Card>
  );

  return tooltip ? <Tooltip title={tooltip}>{content}</Tooltip> : content;
}

function HealthCheck({ item }) {
  const color = item.status === 'ok' ? 'green' : item.status === 'warning' ? 'orange' : 'blue';
  const icon = item.status === 'ok' ? <CheckCircleOutlined /> : <WarningOutlined />;

  return (
    <List.Item
      actions={[
        item.actionUrl ? (
          <Button key="open" type="link" size="small" href={item.actionUrl}>
            Open
          </Button>
        ) : null,
      ].filter(Boolean)}
    >
      <List.Item.Meta
        avatar={<Avatar icon={icon} style={{ background: color === 'green' ? '#16a34a' : color === 'orange' ? '#d97706' : '#2563eb' }} />}
        title={<Space><Text strong>{item.title}</Text><Tag color={color}>{item.status}</Tag></Space>}
        description={item.message}
      />
    </List.Item>
  );
}

function ActivityList({ items = [] }) {
  if (!items.length) {
    return <Empty description="No admin activity today" />;
  }

  return (
    <List
      dataSource={items}
      renderItem={(item) => (
        <List.Item>
          <List.Item.Meta
            avatar={<Avatar icon={<ClockCircleOutlined />} />}
            title={<Text strong>{item.label}</Text>}
            description={
              <Space size={8} wrap>
                <Text type="secondary">{item.actorRole || 'system'}</Text>
                <Text type="secondary">{item.createdAt ? dayjs(item.createdAt).fromNow() : 'recently'}</Text>
              </Space>
            }
          />
          <Tag color="blue">{item.entityType || 'activity'}</Tag>
        </List.Item>
      )}
    />
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading, isFetching, refetch } = useGetAdminDashboardSummaryQuery(undefined, {
    pollingInterval: 60000,
  });

  const stats = data?.todayStats || {};
  const pending = data?.pending || {};
  const health = data?.health || {};
  const trend = data?.trend || [];
  const breakdown = data?.breakdown || {};
  const billing = data?.billing || {};

  const statusPieData = useMemo(
    () => [
      { name: 'Present', value: stats.presentCount || 0 },
      { name: 'Absent/Not Marked', value: stats.absentCount || 0 },
      { name: 'On Leave', value: stats.leaveCount || 0 },
      { name: 'Late', value: stats.lateCount || 0 },
    ],
    [stats.presentCount, stats.absentCount, stats.leaveCount, stats.lateCount]
  );

  const breakdownColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Employees', dataIndex: 'employeeCount', key: 'employeeCount', width: 100 },
    { title: 'Present', dataIndex: 'present', key: 'present', width: 90 },
    { title: 'Absent', dataIndex: 'absent', key: 'absent', width: 90 },
    { title: 'Late', dataIndex: 'late', key: 'late', width: 80 },
  ];

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 12 }} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={`Today: ${data?.today || dayjs().format('YYYY-MM-DD')} - ${data?.organisation?.name || 'Organisation overview'}`}
        actions={[
          <Button key="refresh" onClick={() => refetch()} loading={isFetching}>
            Refresh
          </Button>,
          <Button key="live" type="primary" icon={<EyeOutlined />} onClick={() => navigate('/attendance/live')}>
            Live Board
          </Button>,
        ]}
      />

      {pending.total > 0 ? (
        <Alert
          showIcon
          type="warning"
          message={`${pending.total} admin approvals need attention`}
          description="Review pending leave, regularisation, and device exception requests before the day-end attendance close."
          action={<Button size="small" onClick={() => navigate('/leaves?view=pending')}>Review</Button>}
        />
      ) : null}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <MetricCard title="Active Employees" value={stats.employeeCount || 0} icon={<TeamOutlined />} onClick={() => navigate('/employees')} />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <MetricCard title="Present Today" value={stats.presentCount || 0} icon={<CheckCircleOutlined />} color="#0f766e" onClick={() => navigate('/attendance?status=present')} />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <MetricCard title="Absent / Not Marked" value={stats.absentCount || 0} icon={<AlertOutlined />} color="#dc2626" onClick={() => navigate('/attendance?status=not_marked')} />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <MetricCard title="Late Today" value={stats.lateCount || 0} icon={<FieldTimeOutlined />} color="#d97706" onClick={() => navigate('/attendance?isLate=true')} />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <MetricCard title="Still Checked In" value={stats.stillCheckedInCount || 0} icon={<ClockCircleOutlined />} color="#2563eb" onClick={() => navigate('/attendance/live')} />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <MetricCard title="Manual Overrides" value={stats.manualOverrideCount || 0} icon={<AuditOutlined />} color="#7c3aed" onClick={() => navigate('/attendance')} />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <MetricCard title="Anomalies" value={stats.anomalyCount || 0} icon={<SafetyCertificateOutlined />} color={stats.anomalyCount ? '#dc2626' : '#0f766e'} onClick={() => navigate('/attendance')} />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <MetricCard title="Billing" value={billing.latestStatus || 'No payment'} icon={<CreditCardOutlined />} color={billing.latestStatus === 'failed' ? '#dc2626' : undefined} onClick={() => navigate('/billing')} />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          {hasChartData(trend) ? (
            <AttendanceTrendChart data={trend} height={300} />
          ) : (
            <Card title="30-Day Attendance Trend" bordered={false} style={CARD_STYLE}>
              <div style={{ minHeight: 300, display: 'grid', placeItems: 'center' }}>
                <Empty description="No attendance trend yet" />
              </div>
            </Card>
          )}
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Today Status" bordered={false} style={CARD_STYLE}>
            {hasChartData(statusPieData) ? (
              <StatusPieChart data={statusPieData} height={300} />
            ) : (
              <div style={{ minHeight: 300, display: 'grid', placeItems: 'center' }}>
                <Empty description="No attendance marked today" />
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="Pending Work" bordered={false} style={CARD_STYLE}>
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              <Button block icon={<CalendarOutlined />} onClick={() => navigate('/leaves?view=pending')}>
                Pending leaves: {pending.leaves || 0}
              </Button>
              <Button block icon={<UserSwitchOutlined />} onClick={() => navigate('/regularisations')}>
                Regularisations: {pending.regularisations || 0}
              </Button>
              <Button block icon={<SafetyCertificateOutlined />} onClick={() => navigate('/device-exceptions')}>
                Device exceptions: {pending.deviceExceptions || 0}
              </Button>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="System Health" bordered={false} style={CARD_STYLE}>
            <Space direction="vertical" style={{ width: '100%' }} size={16}>
              <div>
                <Text strong>Face enrollment</Text>
                <Progress percent={health.faceEnrollmentCoverage || 0} size="small" status={(health.employeesWithoutFace || 0) > 0 ? 'active' : 'success'} />
              </div>
              <div>
                <Text strong>Geofence coverage</Text>
                <Progress percent={health.geofenceCoverage || 0} size="small" status={(health.branchesMissingGeofence || 0) > 0 ? 'active' : 'success'} />
              </div>
              <Space wrap>
                <Tag color={health.kioskModeEnabled ? 'green' : 'default'}>Kiosk {health.kioskModeEnabled ? 'enabled' : 'disabled'}</Tag>
                <Tag color={(health.notificationsEnabledCount || 0) > 0 ? 'blue' : 'orange'}>
                  Notifications {health.notificationsEnabledCount || 0}/{health.notificationChannelCount || 0}
                </Tag>
              </Space>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Top Late Today" bordered={false} style={CARD_STYLE}>
            {hasChartData(data?.topLateEmployees || []) ? (
              <LateBarChart data={data.topLateEmployees} height={260} />
            ) : (
              <div style={{ minHeight: 260, display: 'grid', placeItems: 'center' }}>
                <Empty description="No late employees today" />
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Branch Breakdown" bordered={false} style={CARD_STYLE} extra={<Button type="link" onClick={() => navigate('/branches')}>Branches</Button>}>
            <Table
              size="small"
              rowKey="id"
              dataSource={breakdown.branches || []}
              columns={breakdownColumns}
              pagination={false}
              locale={{ emptyText: <Empty description="No branch attendance today" /> }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Department Breakdown" bordered={false} style={CARD_STYLE} extra={<Button type="link" onClick={() => navigate('/departments')}>Departments</Button>}>
            <Table
              size="small"
              rowKey="id"
              dataSource={breakdown.departments || []}
              columns={breakdownColumns}
              pagination={false}
              locale={{ emptyText: <Empty description="No department attendance today" /> }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title="Setup Checks" bordered={false} style={CARD_STYLE}>
            <List
              dataSource={health.checks || []}
              renderItem={(item) => <HealthCheck item={item} />}
              locale={{ emptyText: <Empty description="No setup checks available" /> }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card title="Recent Activity Today" bordered={false} style={CARD_STYLE}>
            <ActivityList items={data?.recentActivity || []} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card bordered={false} style={CARD_STYLE}>
            <Space size={24} wrap>
              <Space>
                <BankOutlined />
                <Text>Plan: <Text strong>{data?.organisation?.plan || 'trial'}</Text></Text>
              </Space>
              <Space>
                <EnvironmentOutlined />
                <Text>Timezone: <Text strong>{data?.organisation?.timezone || 'Asia/Kolkata'}</Text></Text>
              </Space>
              <Space>
                <ApartmentOutlined />
                <Text>Shifts configured: <Text strong>{health.shiftCount || 0}</Text></Text>
              </Space>
              <Title level={5} style={{ margin: 0 }}>Last updated {dayjs().format('hh:mm A')}</Title>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
