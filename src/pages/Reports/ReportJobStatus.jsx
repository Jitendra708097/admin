/**
 * @module ReportJobStatus
 * @description Report generation job status and download.
 */
import { Button, Card, Popconfirm, Progress, Result, Space, Spin } from "antd";
import { CloseCircleOutlined, DownloadOutlined } from "@ant-design/icons";

export default function ReportJobStatus({ jobId, status, progress, onDownload, onCancel, loading, cancelLoading }) {
  if (!jobId) return null;

  const isCompleted = status === "completed";
  const isFailed = status === "failed";
  const canCancel = ["waiting", "delayed", "paused"].includes(status);

  return (
    <Card title="Report Generation Status" className="bg-white shadow border border-gray-100">
      {isFailed ? (
        <Result status="error" title="Generation Failed" subTitle="Please try again later" />
      ) : (
        <div className="space-y-4">
          <Spin spinning={!isCompleted && !isFailed}>
            <Progress
              percent={progress || 0}
              status={isCompleted ? "success" : isFailed ? "exception" : "active"}
              format={(percent) => percent + "%"}
            />
            <p className="mt-4 text-center font-medium">{status.toUpperCase()}</p>

            {isCompleted && (
              <Space className="mt-4 flex justify-center w-full">
                <Button type="primary" icon={<DownloadOutlined />} loading={loading} onClick={onDownload}>
                  Download Report
                </Button>
              </Space>
            )}

            {canCancel && (
              <Space className="mt-4 flex justify-center w-full">
                <Popconfirm
                  title="Cancel report generation?"
                  description="This removes the queued report job."
                  okText="Cancel report"
                  okButtonProps={{ danger: true, loading: cancelLoading }}
                  onConfirm={onCancel}
                >
                  <Button danger icon={<CloseCircleOutlined />} loading={cancelLoading}>
                    Cancel
                  </Button>
                </Popconfirm>
              </Space>
            )}
          </Spin>
        </div>
      )}
    </Card>
  );
}
