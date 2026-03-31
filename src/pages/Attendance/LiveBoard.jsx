import { Card, Col, Row, Statistic, Tag } from 'antd';
import PageHeader from '../../components/common/PageHeader.jsx';
import LiveAttendanceTable from '../../components/LiveAttendanceTable.jsx';
import { useGetLiveBoardQuery } from '../../store/api/attendanceApi.js';

export default function LiveBoardPage() {
  const { data, isLoading } = useGetLiveBoardQuery(
    { limit: 25 },
    {
      pollingInterval: 15000,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );

  const events = data?.events || [];
  const rows = data?.rows || [];
  const checkedInCount = data?.summary?.checkedInCount || 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Live Attendance Board" subtitle="Live check-in activity with 15 second auto refresh" />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card bordered={false} style={{ borderRadius: 16 }}>
            <Statistic title="Currently Checked In" value={checkedInCount} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card bordered={false} style={{ borderRadius: 16 }}>
            <Statistic title="Tracked Rows" value={rows.length} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card bordered={false} style={{ borderRadius: 16 }}>
            <Statistic title="Recent Events" value={events.length} />
          </Card>
        </Col>
      </Row>

      <Card title="Live Table" bordered={false} style={{ borderRadius: 16 }}>
        <LiveAttendanceTable data={rows} loading={isLoading} />
      </Card>

      <Card title="Recent Feed" bordered={false} style={{ borderRadius: 16 }}>
        <div className="space-y-3">
          {events.map((event, index) => (
            <div
              key={`${event.empId || 'event'}-${event.time || index}`}
              className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3"
            >
              <div>
                <div className="font-semibold text-gray-900">{event.empName || event.action}</div>
                <div className="text-sm text-gray-500">{event.time || '-'}</div>
              </div>
              <Tag color={event.action === 'check-in' ? 'green' : 'blue'}>{event.action || event.status}</Tag>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
