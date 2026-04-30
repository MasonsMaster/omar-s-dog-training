import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CreditCard, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function BillingOverview({ clientEmail }) {
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices", clientEmail],
    queryFn: () => base44.entities.Invoice.filter({ client_email: clientEmail }, "-created_date", 20),
  });

  const activeInvoices = invoices.filter(inv => inv.status === "paid");
  const pendingInvoices = invoices.filter(inv => inv.status === "pending");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading billing...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Subscription */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h3 className="font-bold text-lg">Active Subscription</h3>
            </div>
            <p className="text-sm text-green-800">You're all set! Enjoy unlimited training access.</p>
          </div>
          <div className="text-right">
            {activeInvoices[0] && (
              <div className="text-xs text-green-700">
                <div className="font-bold">${activeInvoices[0].amount}</div>
                <div>Next renewal: {format(parseISO(activeInvoices[0].due_date), 'MMM d, yyyy')}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pending Invoices */}
      {pendingInvoices.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-sm mb-1">Payment Due</h3>
              <p className="text-xs text-amber-800 mb-3">
                You have {pendingInvoices.length} pending invoice{pendingInvoices.length !== 1 ? "s" : ""}.
              </p>
              {pendingInvoices.map(inv => (
                <div key={inv.id} className="text-xs text-amber-700 mb-1">
                  ${inv.amount} due by {format(parseISO(inv.due_date), 'MMM d, yyyy')}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Payment History */}
      {invoices.length > 0 && (
        <div>
          <h3 className="font-bold text-sm mb-3">Payment History</h3>
          <div className="space-y-2">
            {invoices.slice(0, 5).map((inv) => (
              <div key={inv.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg text-sm">
                <div>
                  <div className="font-semibold">{inv.program}</div>
                  <div className="text-xs text-muted-foreground">{format(parseISO(inv.created_date || inv.due_date), 'MMM d, yyyy')}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold">${inv.amount}</span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      inv.status === "paid"
                        ? "bg-green-100 text-green-700"
                        : inv.status === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : inv.status === "overdue"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {inv.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {invoices.length === 0 && (
        <div className="text-center py-8 bg-card border border-dashed border-border rounded-2xl">
          <CreditCard className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No invoices yet.</p>
        </div>
      )}
    </div>
  );
}