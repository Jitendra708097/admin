import { Avatar, Card, Col, List, Row, Tag } from 'antd';
import { ClockCircleOutlined, TeamOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader.jsx';
import Skeleton from '../../components/common/Skeleton.jsx';
import StatusPieChart from '../../components/charts/StatusPieChart.jsx';
import LateBarChart from '../../components/charts/LateBarChart.jsx';
import StatCard from '../../components/StatCard.jsx';
import AttendanceTrendChart from '../../components/AttendanceTrendChart.jsx';
import {
  useGetAttendanceStatsTodayQuery,
  useGetAttendanceTrendQuery,
  useGetRecentActivityQuery,
  useGetTopLateEmployeesQuery,
} from '../../store/api/attendanceApi.js';

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useGetAttendanceStatsTodayQuery();
  const { data: trend = [], isLoading: trendLoading } = useGetAttendanceTrendQuery({ days: 30 });
  const { data: lateEmployees = [], isLoading: lateLoading } = useGetTopLateEmployeesQuery({ limit: 5 });
  const { data: activity = [], isLoading: activityLoading } = useGetRecentActivityQuery({ limit: 8 });

  const pieData = [
    { name: 'Present', value: stats?.presentCount || 0 },
    { name: 'Absent', value: stats?.absentCount || 0 },
    { name: 'On Leave', value: stats?.leaveCount || 0 },
    { name: 'Late', value: stats?.lateCount || 0 },
  ];

  // Show skeleton loading for stats while loading
  if (statsLoading) return <Skeleton />;
  
  // Show individual skeletons for sections still loading
  const trendSection = trendLoading ? <Skeleton active paragraph={{ rows: 4 }} /> : <AttendanceTrendChart data={trend} />;
  const lateSection = lateLoading ? <Skeleton active paragraph={{ rows: 3 }} /> : <LateBarChart data={lateEmployees} />;
  const activitySection = activityLoading ? <Skeleton /> : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <StatCard title="Total Employees" value={stats?.employeeCount || 0} prefix={<TeamOutlined />} />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard title="Checked In Today" value={stats?.checkedInCount || 0} valueStyle={{ color: '#52c41a' }} />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard title="Absent Today" value={stats?.absentCount || 0} valueStyle={{ color: '#ff4d4f' }} />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard title="Late Today" value={stats?.lateCount || 0} valueStyle={{ color: '#faad14' }} />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          {trendSection}
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Status Distribution" bordered={false} style={{ borderRadius: 16, boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)' }}>
            {trendLoading ? <Skeleton active /> : <StatusPieChart data={pieData} />}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title="Top Late Employees" bordered={false} style={{ borderRadius: 16, boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)' }}>
            {lateSection}
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card title="Pending Approvals" bordered={false} style={{ borderRadius: 16, boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <StatCard title="Pending Leaves" value={stats?.pendingLeaves || 0} valueStyle={{ color: '#1890ff' }} />
              </Col>
              <Col xs={24} md={8}>
                <StatCard title="Pending Regularisations" value={stats?.pendingRegularisations || 0} valueStyle={{ color: '#722ed1' }} />
              </Col>
              <Col xs={24} md={8}>
                <StatCard title="Pending Device Exceptions" value={stats?.pendingExceptions || 0} valueStyle={{ color: '#faad14' }} />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="Recent Activity" bordered={false} style={{ borderRadius: 16, boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)' }}>
            {activityLoading ? (
              <Skeleton />
            ) : (
              <List
                dataSource={activity}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar icon={<ClockCircleOutlined />} />}
                      title={item.empName || item.action}
                      description={item.time}
                    />
                    <Tag color="blue">{item.action || item.status || 'activity'}</Tag>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
