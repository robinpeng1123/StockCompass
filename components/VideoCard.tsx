import { VideoLesson } from "@/lib/mockData";

export function VideoCard({ video }: { video: VideoLesson }) {
  return (
    <div className="glass-panel overflow-hidden p-0">
      <div className="aspect-video w-full bg-black">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${video.videoId}`}
          title={video.title}
          className="h-full w-full"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <div className="p-3.5">
        <div className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{video.topic}</div>
        <div className="mt-0.5 text-sm font-semibold text-ink-primary">{video.title}</div>
        <div className="mt-0.5 text-xs text-ink-secondary">{video.channel}</div>
      </div>
    </div>
  );
}
