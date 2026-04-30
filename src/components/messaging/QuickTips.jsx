import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Lightbulb, Loader2, Trash2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

export default function QuickTips({ clientEmail, isTrainer = false }) {
  const qKey = ["quick-tips", clientEmail];
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: tips = [], isLoading } = useQuery({
    queryKey: qKey,
    queryFn: () =>
      base44.entities.Message.filter(
        {
          client_email: clientEmail,
          body: { $regex: "^\\[TIP\\]" },
        },
        "-created_date",
        20
      ),
    enabled: !!clientEmail,
  });

  const handleSubmitTip = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await base44.entities.Message.create({
        client_email: clientEmail,
        sender_email: "system",
        sender_name: "Quick Tip",
        is_trainer: isTrainer,
        body: `[TIP] ${title}\n\n${content}`,
        read_by_client: false,
        read_by_trainer: false,
      });

      toast.success("Tip shared!");
      setTitle("");
      setContent("");
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: qKey });
    } catch (error) {
      toast.error("Failed to save tip");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading tips...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* New Tip Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Lightbulb className="w-4 h-4" /> Share a Quick Tip
          </h3>
          <Input
            placeholder="Tip title (e.g., 'Leash Pulling Solution')"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            placeholder="Detailed tip content..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-24 px-3 py-2 rounded-md border border-input text-sm resize-none"
          />
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForm(false)}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmitTip}
              disabled={loading}
              className="rounded-full font-bold gap-1"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              Share
            </Button>
          </div>
        </div>
      )}

      {/* Tip List */}
      {tips.length === 0 ? (
        <div className="text-center py-8 bg-card border border-dashed border-border rounded-2xl">
          <Lightbulb className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-3">No quick tips yet</p>
          {isTrainer && (
            <Button
              size="sm"
              onClick={() => setShowForm(true)}
              className="rounded-full gap-2"
            >
              <Plus className="w-3.5 h-3.5" /> Share First Tip
            </Button>
          )}
        </div>
      ) : (
        <>
          {!showForm && isTrainer && (
            <Button
              size="sm"
              onClick={() => setShowForm(true)}
              variant="outline"
              className="rounded-full gap-2 w-full"
            >
              <Plus className="w-3.5 h-3.5" /> Add Tip
            </Button>
          )}
          <div className="space-y-2">
            {tips.map((tip) => {
              const match = tip.body.match(/^\[TIP\]\s+(.+?)\n\n([\s\S]+)$/);
              const tipTitle = match ? match[1] : "Tip";
              const tipContent = match ? match[2] : tip.body;

              return (
                <div
                  key={tip.id}
                  className="bg-blue-50 border border-blue-200 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-blue-900">
                          {tipTitle}
                        </h4>
                        <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                          {tipContent.substring(0, 150)}
                          {tipContent.length > 150 ? "..." : ""}
                        </p>
                        <p className="text-[10px] text-blue-600 mt-2">
                          {format(parseISO(tip.created_date), "MMM d, h:mm a")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}