/**
 * @module BillingPage
 * @description Subscription plans and invoice management.
 */
import { useMemo, useState } from 'react';
import { Alert, App, Button, Card, Col, Form, Input, Modal, Row, Select, Space, Statistic } from 'antd';
import { CalendarOutlined, CheckCircleOutlined, CreditCardOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader.jsx';
import PlanCard from './PlanCard.jsx';
import InvoiceTable from './InvoiceTable.jsx';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import {
  useCreateInvoiceOrderMutation,
  useGetCurrentPlanQuery,
  useGetInvoicesQuery,
  useLazyDownloadInvoiceQuery,
  useVerifyInvoicePaymentMutation,
} from '../../store/api/billingApi.js';

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(window.Razorpay);
      return;
    }

    const existingScript = document.querySelector('script[data-razorpay="true"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.Razorpay), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Unable to load Razorpay checkout')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.razorpay = 'true';
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => reject(new Error('Unable to load Razorpay checkout'));
    document.body.appendChild(script);
  });
}

function isInvoiceOverdue(invoice) {
  return invoice?.isOverdue || (invoice?.status !== 'paid' && invoice?.dueDate && new Date(invoice.dueDate) < new Date());
}

export default function BillingPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [payingInvoiceId, setPayingInvoiceId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showPlanRequest, setShowPlanRequest] = useState(false);
  const { data: planData, isLoading: isPlanLoading } = useGetCurrentPlanQuery();
  const { data: invoiceData, isLoading: isInvoiceLoading } = useGetInvoicesQuery();
  const [downloadInvoice] = useLazyDownloadInvoiceQuery();
  const [createInvoiceOrder] = useCreateInvoiceOrderMutation();
  const [verifyInvoicePayment] = useVerifyInvoicePaymentMutation();
  const normalizedPlan = planData?.plan || planData || null;
  const invoices = invoiceData?.invoices || [];
  const currentInvoice = invoiceData?.currentInvoice || normalizedPlan?.currentInvoice || invoices.find((invoice) => invoice.isCurrent);

  const billingStats = useMemo(() => {
    const dueInvoices = invoices.filter((invoice) => invoice.status !== 'paid');
    const overdueInvoices = dueInvoices.filter(isInvoiceOverdue);

    return {
      currentAmount: currentInvoice?.amount || normalizedPlan?.monthlyAmount || 0,
      dueCount: dueInvoices.length,
      overdueCount: overdueInvoices.length,
      paidCount: invoices.filter((invoice) => invoice.status === 'paid').length,
    };
  }, [currentInvoice?.amount, invoices, normalizedPlan?.monthlyAmount]);

  const filteredInvoices = useMemo(() => {
    const term = search.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const status = isInvoiceOverdue(invoice) ? 'overdue' : invoice.status || 'due';
      const matchesStatus =
        statusFilter === 'all' ||
        statusFilter === status ||
        (statusFilter === 'due' && invoice.status !== 'paid' && status !== 'overdue');
      const matchesSearch =
        !term ||
        invoice.invoiceNumber?.toLowerCase().includes(term) ||
        invoice.planLabel?.toLowerCase().includes(term) ||
        invoice.plan?.toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [invoices, search, statusFilter]);

  const handleUpgrade = () => {
    setShowPlanRequest(true);
  };

  const submitPlanRequest = async () => {
    const values = await form.validateFields();
    Modal.success({
      title: 'Plan request noted',
      content: `Request for ${values.plan} plan has been prepared. Billing support workflow can be connected here later.`,
    });
    setShowPlanRequest(false);
    form.resetFields();
  };

  const handleDownload = async (invoiceId) => {
    try {
      const invoiceFile = await downloadInvoice(invoiceId).unwrap();
      const blob = new Blob([invoiceFile.content || 'Invoice preview unavailable'], {
        type: invoiceFile.contentType || 'text/html;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = invoiceFile.filename || `${invoiceId}.html`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      message.error(error?.data?.error?.message || 'Unable to prepare invoice');
    }
  };

  const handlePay = async (invoice) => {
    const idempotencyKey = `${invoice.id}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    setPayingInvoiceId(invoice.id);

    try {
      await loadRazorpayScript();
      const orderPayload = await createInvoiceOrder(invoice.id).unwrap();
      const RazorpayConstructor = window.Razorpay;

      if (!RazorpayConstructor) {
        throw new Error('Razorpay checkout is unavailable');
      }

      const razorpay = new RazorpayConstructor({
        key: orderPayload.razorpayKeyId,
        amount: orderPayload.order.amount,
        currency: orderPayload.order.currency,
        name: orderPayload.organisation?.name || 'AttendEase',
        description: `Invoice ${orderPayload.invoice.invoiceNumber}`,
        order_id: orderPayload.order.id,
        handler: async (response) => {
          try {
            await verifyInvoicePayment({
              invoiceId: invoice.id,
              ...response,
              _idempotencyKey: idempotencyKey,
            }).unwrap();

            message.success('Payment successful');
          } catch (error) {
            message.error(error?.data?.error?.message || 'Payment verification failed');
          } finally {
            setPayingInvoiceId(null);
          }
        },
        notes: {
          invoiceNumber: orderPayload.invoice.invoiceNumber,
          idempotencyKey,
        },
        theme: {
          color: '#1677ff',
        },
        modal: {
          ondismiss: () => {
            setPayingInvoiceId(null);
            message.info('Payment cancelled. You can retry anytime.');
          },
        },
      });

      razorpay.open();
    } catch (error) {
      setPayingInvoiceId(null);
      message.error(error?.data?.error?.message || error.message || 'Unable to start payment');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Billing" subtitle="Manage subscription, invoices, and payment status" />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Current bill"
              value={billingStats.currentAmount}
              formatter={(value) => formatCurrency(value, currentInvoice?.currency || 'INR')}
              prefix={<CreditCardOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Due invoices" value={billingStats.dueCount} prefix={<CalendarOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Overdue"
              value={billingStats.overdueCount}
              valueStyle={{ color: billingStats.overdueCount ? '#dc2626' : undefined }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Paid invoices" value={billingStats.paidCount} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
      </Row>

      {currentInvoice && currentInvoice.status !== 'paid' ? (
        <Alert
          type={isInvoiceOverdue(currentInvoice) ? 'error' : 'warning'}
          showIcon
          message={
            isInvoiceOverdue(currentInvoice)
              ? `Invoice ${currentInvoice.invoiceNumber} is overdue`
              : `Invoice ${currentInvoice.invoiceNumber} is due`
          }
          description={`Amount ${formatCurrency(currentInvoice.amount, currentInvoice.currency || 'INR')} due by ${
            currentInvoice.dueDate ? formatDate(currentInvoice.dueDate) : 'the due date'
          }.`}
          action={
            <Button size="small" type="primary" onClick={() => handlePay(currentInvoice)}>
              Pay Now
            </Button>
          }
        />
      ) : null}

      <PlanCard
        plan={normalizedPlan}
        currentInvoice={currentInvoice}
        onUpgrade={handleUpgrade}
        loading={isPlanLoading}
      />

      <Card
        title="Invoices"
        extra={
          <Space wrap>
            <Input.Search
              allowClear
              placeholder="Search invoice or plan"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              style={{ width: 240 }}
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 160 }}
              options={[
                { label: 'All invoices', value: 'all' },
                { label: 'Due', value: 'due' },
                { label: 'Overdue', value: 'overdue' },
                { label: 'Paid', value: 'paid' },
              ]}
            />
          </Space>
        }
      >
        <InvoiceTable
          data={filteredInvoices}
          loading={isInvoiceLoading}
          payingInvoiceId={payingInvoiceId}
          onDownload={handleDownload}
          onPay={handlePay}
        />
      </Card>

      <Alert
        type="info"
        showIcon
        message="Payment help"
        description="If a Razorpay payment succeeds but the invoice still shows due, do not pay again immediately. Refresh this page first, then contact billing support with the invoice number and payment id."
      />

      <Modal
        title="Request plan change"
        open={showPlanRequest}
        onCancel={() => setShowPlanRequest(false)}
        onOk={submitPlanRequest}
        okText="Prepare Request"
      >
        <Form form={form} layout="vertical" initialValues={{ plan: 'growth' }}>
          <Form.Item name="plan" label="Requested plan" rules={[{ required: true, message: 'Select a plan' }]}>
            <Select
              options={[
                { label: 'Starter', value: 'starter' },
                { label: 'Standard', value: 'standard' },
                { label: 'Growth', value: 'growth' },
                { label: 'Enterprise', value: 'enterprise' },
              ]}
            />
          </Form.Item>
          <Form.Item name="message" label="Note for billing support">
            <Input.TextArea rows={4} placeholder="Mention employee count, required features, or billing questions" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
