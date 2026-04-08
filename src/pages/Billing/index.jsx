/**
 * @module BillingPage
 * @description Subscription plans and invoice management.
 */
import { useState } from 'react';
import { App, Modal } from 'antd';
import PageHeader from '../../components/common/PageHeader.jsx';
import PlanCard from './PlanCard.jsx';
import InvoiceTable from './InvoiceTable.jsx';
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

export default function BillingPage() {
  const { message } = App.useApp();
  const [payingInvoiceId, setPayingInvoiceId] = useState(null);
  const { data: planData, isLoading: isPlanLoading } = useGetCurrentPlanQuery();
  const { data: invoiceData, isLoading: isInvoiceLoading } = useGetInvoicesQuery();
  const [downloadInvoice] = useLazyDownloadInvoiceQuery();
  const [createInvoiceOrder] = useCreateInvoiceOrderMutation();
  const [verifyInvoicePayment] = useVerifyInvoicePaymentMutation();
  const normalizedPlan = planData?.plan || planData || null;

  const handleUpgrade = () => {
    Modal.info({
      title: 'Billing Support',
      content: 'For plan changes, please contact AttendEase billing support.',
    });
  };

  const handleDownload = async (invoiceId) => {
    try {
      const invoiceFile = await downloadInvoice(invoiceId).unwrap();
      const blob = new Blob([invoiceFile.content || 'Invoice preview unavailable'], {
        type: 'text/plain;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = invoiceFile.filename || `${invoiceId}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      message.error(error?.data?.error?.message || 'Unable to prepare invoice');
    }
  };

  const handlePay = async (invoice) => {
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
        },
        theme: {
          color: '#1677ff',
        },
        modal: {
          ondismiss: () => {
            setPayingInvoiceId(null);
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
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Billing" subtitle="Manage subscription and invoices" />

      <div className="px-6 py-6 max-w-7xl mx-auto">
        <PlanCard
          plan={normalizedPlan}
          onUpgrade={handleUpgrade}
          loading={isPlanLoading}
        />
      </div>

      <div className="px-6 py-6 max-w-7xl mx-auto">
        <InvoiceTable
          data={invoiceData?.invoices || []}
          loading={isInvoiceLoading}
          payingInvoiceId={payingInvoiceId}
          onDownload={handleDownload}
          onPay={handlePay}
        />
      </div>
    </div>
  );
}
