import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Play, BookOpen, File, Clock } from "lucide-react";

const CATEGORIES = ["fundamentals", "intermediate", "advanced", "behavioral_challenges", "health_wellness", "nutrition"];

function ResourceCard({ resource }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:ring-2 ring-primary/50 transition-all cursor-pointer group">
      {resource.thumbnail_url && (
        <div className="w-full h-40 bg-muted overflow-hidden relative">
          <img src={resource.thumbnail_url} alt={resource.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          {resource.resource_type === "video" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
              <Play className="w-8 h-8 text-white" />
            </div>
          )}
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start gap-2 mb-2">
          {resource.resource_type === "video" && <Play className="w-4 h-4 text-primary shrink-0 mt-0.5" />}
          {resource.resource_type === "document" && <BookOpen className="w-4 h-4 text-primary shrink-0 mt-0.5" />}
          {resource.resource_type === "guide" && <File className="w-4 h-4 text-primary shrink-0 mt-0.5" />}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm line-clamp-2">{resource.title}</h3>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{resource.category.replace(/_/g, " ")}</span>
          </div>
        </div>
        {resource.duration_minutes && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <Clock className="w-3 h-3" /> {resource.duration_minutes} min
          </div>
        )}
        {resource.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{resource.description}</p>
        )}
        {resource.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {resource.tags.slice(0, 2).map(t => (
              <span key={t} className="text-[10px] font-bold bg-primary/5 text-primary border border-primary/15 px-2 py-0.5 rounded-full">
                {t}
              </span>
            ))}
            {resource.tags.length > 2 && (
              <span className="text-[10px] text-muted-foreground">+{resource.tags.length - 2}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResourceLibrary() {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [selectedResource, setSelectedResource] = useState(null);

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["training-resources-client"],
    queryFn: async () => {
      const all = await base44.entities.TrainingResource.filter({ is_published: true });
      return all.sort((a, b) => (b.order || 0) - (a.order || 0));
    },
  });

  const filtered = resources.filter(r =>
    (!search || r.title.toLowerCase().includes(search.toLowerCase()) || r.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))) &&
    (filterCategory === "all" || r.category === filterCategory)
  );

  if (selectedResource) {
    return (
      <div>
        <button onClick={() => setSelectedResource(null)} className="text-sm text-primary font-semibold mb-4 flex items-center gap-1 hover:underline">
          ← Back to Library
        </button>
        <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
          {selectedResource.file_url && (
            <div className="w-full bg-muted rounded-xl overflow-hidden">
              {selectedResource.resource_type === "video" ? (
                <iframe src={selectedResource.file_url} className="w-full aspect-video rounded-xl" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              ) : (
                <a href={selectedResource.file_url} target="_blank" rel="noopener noreferrer" className="block p-8 text-center hover:bg-accent transition-colors">
                  <File className="w-12 h-12 text-primary mx-auto mb-3" />
                  <div className="font-bold text-sm">Open {selectedResource.resource_type}</div>
                  <div className="text-xs text-muted-foreground mt-1">Click to download or view</div>
                </a>
              )}
            </div>
          )}
          <div>
            <h1 className="font-heading text-2xl mb-2">{selectedResource.title}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
              <span className="capitalize">{selectedResource.resource_type}</span>
              <span className="capitalize">{selectedResource.category.replace(/_/g, " ")}</span>
              {selectedResource.duration_minutes && <span>{selectedResource.duration_minutes} min</span>}
            </div>
            {selectedResource.description && (
              <p className="text-sm leading-relaxed text-foreground mb-4">{selectedResource.description}</p>
            )}
            {selectedResource.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedResource.tags.map(t => (
                  <span key={t} className="text-[10px] font-bold bg-primary/5 text-primary border border-primary/15 px-3 py-1 rounded-full">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-bold text-lg mb-1">Training Resource Library</h2>
        <p className="text-sm text-muted-foreground">Browse videos, guides, and documents to enhance your training.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search resources or tags..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading resources...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl">
          <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <div className="font-bold text-sm mb-1">No resources found</div>
          <p className="text-xs text-muted-foreground">Try adjusting your search or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(resource => (
            <div key={resource.id} onClick={() => setSelectedResource(resource)}>
              <ResourceCard resource={resource} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}