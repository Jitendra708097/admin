/**
 * @module AttendanceDetail
 * @description Single day attendance detail modal with all sessions.
 */
import { Modal, Table, Empty, Tag, Statistic, Row, Col, Card } from 'antd';
import dayjs from 'dayjs';

export default function AttendanceDetail({ open, data, loading = false, onClose }) {
  if (!data && !loading) return null;

  const columns = [
    {
      title: 'Check-in',
      dataIndex: 'checkInTime',
      key: 'checkInTime',
      render: (value) => (value ? dayjs(value).format('DD MMM YYYY, HH:mm') : '-'),
    },
    {
      title: 'Check-out',
      dataIndex: 'checkOutTime',
      key: 'checkOutTime',
      render: (value) => (value ? dayjs(value).format('DD MMM YYYY, HH:mm') : '-'),
    },
    {
      title: 'Duration',
      dataIndex: 'workedMinutes',
      key: 'workedMinutes',
      render: (value) => {
        const totalMinutes = Number(value || 0);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours}h ${minutes}m`;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag>{status}</Tag>,
    },
  ];

  const sessions = data?.sessions || [];
  const workingHours = Number(data?.totalWorkedMins || 0) / 60;

  return (
    <Modal
      title={`${data?.employee?.name || 'Attendance'} - ${data?.date ? dayjs(data.date).format('DD MMM YYYY') : ''}`}
      open={open}
      onCancel={onClose}
      width={700}
      footer={null}
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12}>
          <Card size="small">
            <Statistic title="Total Hours" value={workingHours.toFixed(1)} suffix="hr" loading={loading} />
          </Card>
        </Col>
        <Col xs={12}>
          <Card size="small">
            <Statistic title="Sessions" value={sessions.length} loading={loading} />
          </Card>
        </Col>
      </Row>

      <h3>Sessions Detail</h3>
      {sessions.length > 0 ? (
        <Table columns={columns} dataSource={sessions} loading={loading} pagination={false} size="small" rowKey="id" />
      ) : (
        <Empty description={loading ? 'Loading sessions...' : 'No sessions'} />
      )}
    </Modal>
  );
}
