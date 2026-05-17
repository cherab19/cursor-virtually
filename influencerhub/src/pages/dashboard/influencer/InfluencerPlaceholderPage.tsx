interface InfluencerPlaceholderPageProps {
  title: string;
  description: string;
}

export function InfluencerPlaceholderPage({ title, description }: InfluencerPlaceholderPageProps) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/10 p-8">
      <h1 className="font-display text-2xl font-bold text-card-foreground">{title}</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
