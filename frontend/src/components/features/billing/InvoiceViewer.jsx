import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { billingService } from '../../../services/billing';
import { Download, Printer } from 'lucide-react';
import { Button } from '../../ui/Button';
import { useParams } from 'react-router-dom';

export const InvoiceViewer = () => {
  const { invoiceId } = useParams();
  
  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => billingService.getInvoice(invoiceId),
    enabled: !!invoiceId,
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    try {
      const blob = await billingService.downloadInvoice(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex justify-between items-center print:hidden">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Invoice #{invoice?.number}
        </h1>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Invoice Content */}
      <Card className="p-8 max-w-4xl mx-auto bg-white">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h2>
            <p className="text-gray-600">Invoice #{invoice?.number}</p>
            <Badge variant={invoice?.status === 'paid' ? 'success' : 'warning'} className="mt-2">
              {invoice?.status?.toUpperCase()}
            </Badge>
          </div>
          <div className="text-right">
            <div className="font-bold text-xl text-gray-900 mb-2">
              Your Company Name
            </div>
            <div className="text-gray-600 text-sm">
              <p>123 Business Street</p>
              <p>City, State 12345</p>
              <p>GST: 29ABCDE1234F1Z5</p>
            </div>
          </div>
        </div>

        {/* Bill To / From */}
        <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b border-gray-200">
          <div>
            <p className="text-sm font-semibold text-gray-600 mb-2">BILL TO</p>
            <div className="text-gray-900">
              <p className="font-semibold">{invoice?.customer?.name}</p>
              <p className="text-sm">{invoice?.customer?.email}</p>
              <p className="text-sm">{invoice?.customer?.address}</p>
              {invoice?.customer?.gstin && (
                <p className="text-sm">GST: {invoice?.customer?.gstin}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-600 mb-2">INVOICE DETAILS</p>
            <div className="text-gray-900 text-sm">
              <p>Issue Date: {format(new Date(invoice?.date), 'MMM dd, yyyy')}</p>
              <p>Due Date: {format(new Date(invoice?.dueDate), 'MMM dd, yyyy')}</p>
              {invoice?.paidDate && (
                <p className="text-green-600">
                  Paid: {format(new Date(invoice?.paidDate), 'MMM dd, yyyy')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 text-sm font-semibold text-gray-600">DESCRIPTION</th>
                <th className="text-center py-3 text-sm font-semibold text-gray-600">QTY</th>
                <th className="text-right py-3 text-sm font-semibold text-gray-600">RATE</th>
                <th className="text-right py-3 text-sm font-semibold text-gray-600">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {invoice?.items?.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="py-3 text-gray-900">
                    <div className="font-medium">{item.description}</div>
                    {item.details && (
                      <div className="text-xs text-gray-500 mt-1">{item.details}</div>
                    )}
                  </td>
                  <td className="text-center py-3 text-gray-900">{item.quantity}</td>
                  <td className="text-right py-3 text-gray-900">₹{item.rate}</td>
                  <td className="text-right py-3 font-medium text-gray-900">
                    ₹{item.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64">
            <div className="flex justify-between py-2 text-gray-900">
              <span>Subtotal</span>
              <span>₹{invoice?.subtotal}</span>
            </div>
            {invoice?.discount > 0 && (
              <div className="flex justify-between py-2 text-green-600">
                <span>Discount</span>
                <span>-₹{invoice?.discount}</span>
              </div>
            )}
            <div className="flex justify-between py-2 text-gray-900">
              <span>CGST (9%)</span>
              <span>₹{invoice?.cgst}</span>
            </div>
            <div className="flex justify-between py-2 text-gray-900">
              <span>SGST (9%)</span>
              <span>₹{invoice?.sgst}</span>
            </div>
            <div className="flex justify-between py-3 border-t-2 border-gray-300 font-bold text-lg text-gray-900">
              <span>TOTAL</span>
              <span>₹{invoice?.total}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-6">
          <div className="text-sm text-gray-600">
            <p className="font-semibold mb-2">Payment Information:</p>
            {invoice?.status === 'paid' ? (
              <p className="text-green-600">
                This invoice has been paid via {invoice?.paymentMethod} on{' '}
                {format(new Date(invoice?.paidDate), 'MMM dd, yyyy')}
              </p>
            ) : (
              <>
                <p>Payment is due by {format(new Date(invoice?.dueDate), 'MMMM dd, yyyy')}</p>
                <p className="mt-2">
                  Please include invoice number #{invoice?.number} with your payment.
                </p>
              </>
            )}
          </div>
          <div className="mt-6 text-xs text-gray-500">
            <p>Thank you for your business!</p>
            <p className="mt-1">
              For any questions regarding this invoice, please contact support@yourcompany.com
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
