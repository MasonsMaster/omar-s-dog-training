import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";

export default function MonthlyReportDownload({ clientEmail }) {
  const [downloading, setDownloading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(0); // 0 = current month, -1 = last month, etc.

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await base44.functions.invoke("generateMonthlyReport", {
        monthOffset: selectedMonth,
      });

      if (!res.data.success) {
        toast.error("Failed to generate report");
        setDownloading(false);
        return;
      }

      // Decode and download
      const pdfBytes = Uint8Array.from(atob(res.data.pdfBase64), (c) => c.charCodeAt(0));
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = res.data.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Report downloaded!");
    } catch (error) {
      toast.error("Download failed: " + error.message);
    } finally {
      setDownloading(false);
    }
  };

  const monthOptions = [
    { value: 0, label: "This Month" },
    { value: -1, label: "Last Month" },
    { value: -2, label: "2 Months Ago" },
    { value: -3, label: "3 Months Ago" },
  ];

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-lg">Download Monthly Report</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Get a comprehensive PDF summary of your training progress, including sessions, focus areas, and insights from Omar.
      </p>

      <div>
        <label className="text-xs font-semibold mb-2 block">Select Month</label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          disabled={downloading}
          className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          {monthOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <Button
        onClick={handleDownload}
        disabled={downloading}
        className="w-full rounded-full font-bold gap-2"
      >
        {downloading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Download PDF Report
          </>
        )}
      </Button>
    </div>
  );
}