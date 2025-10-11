import { useEffect } from 'react';
import { useSocket } from './useSocket';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export const useRealTimeUpdates = () => {
  const { socket, isConnected, on, off } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isConnected) return;

    // Balance updates
    const handleBalanceUpdate = (data) => {
      queryClient.invalidateQueries(['account-balance']);
      toast.success(`Balance updated: ${data.newBalance}`);
    };

    // Call events
    const handleCallStarted = (data) => {
      queryClient.invalidateQueries(['recent-activity']);
      toast.info(`Call started: ${data.to}`);
    };

    const handleCallEnded = (data) => {
      queryClient.invalidateQueries(['recent-activity']);
      queryClient.invalidateQueries(['usage-metrics']);
      queryClient.invalidateQueries(['cdr']);
      toast.success(`Call ended: ${data.duration}s - ₹${data.cost}`);
    };

    // Invoice events
    const handleInvoiceCreated = (data) => {
      queryClient.invalidateQueries(['invoices']);
      toast.info(`New invoice created: ${data.invoiceNumber}`);
    };

    const handleInvoicePaid = (data) => {
      queryClient.invalidateQueries(['invoices']);
      queryClient.invalidateQueries(['account-balance']);
      toast.success(`Invoice paid: ${data.invoiceNumber}`);
    };

    // Payment events
    const handlePaymentSuccess = (data) => {
      queryClient.invalidateQueries(['account-balance']);
      queryClient.invalidateQueries(['invoices']);
      toast.success(`Payment successful: ₹${data.amount}`);
    };

    const handlePaymentFailed = (data) => {
      toast.error(`Payment failed: ${data.reason}`);
    };

    // Subscription events
    const handleSubscriptionUpdated = (data) => {
      queryClient.invalidateQueries(['subscription']);
      toast.info(`Subscription updated: ${data.planName}`);
    };

    const handleSubscriptionExpired = (data) => {
      queryClient.invalidateQueries(['subscription']);
      toast.error('Your subscription has expired. Please renew to continue service.');
    };

    // Alerts
    const handleLowBalance = (data) => {
      toast.error(`Low balance alert: ₹${data.balance}. Please top up to continue service.`, {
        duration: 10000,
      });
    };

    const handleUsageLimit = (data) => {
      toast.warning(`Usage limit alert: You've used ${data.percentage}% of your ${data.resource} limit.`, {
        duration: 8000,
      });
    };

    // Register listeners
    on('balance:updated', handleBalanceUpdate);
    on('call:started', handleCallStarted);
    on('call:ended', handleCallEnded);
    on('invoice:created', handleInvoiceCreated);
    on('invoice:paid', handleInvoicePaid);
    on('payment:success', handlePaymentSuccess);
    on('payment:failed', handlePaymentFailed);
    on('subscription:updated', handleSubscriptionUpdated);
    on('subscription:expired', handleSubscriptionExpired);
    on('alert:low_balance', handleLowBalance);
    on('alert:usage_limit', handleUsageLimit);

    // Cleanup
    return () => {
      off('balance:updated', handleBalanceUpdate);
      off('call:started', handleCallStarted);
      off('call:ended', handleCallEnded);
      off('invoice:created', handleInvoiceCreated);
      off('invoice:paid', handleInvoicePaid);
      off('payment:success', handlePaymentSuccess);
      off('payment:failed', handlePaymentFailed);
      off('subscription:updated', handleSubscriptionUpdated);
      off('subscription:expired', handleSubscriptionExpired);
      off('alert:low_balance', handleLowBalance);
      off('alert:usage_limit', handleUsageLimit);
    };
  }, [isConnected, on, off, queryClient]);

  return {
    isConnected,
  };
};
