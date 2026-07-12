import SemanticEditor from "@/components/editor/SemanticEditor";

export default function NewArticlePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Create New Article</h1>
        <p className="text-muted-foreground">Powered by the 12-Step Semantic Writer Pipeline.</p>
      </div>
      <SemanticEditor />
    </div>
  );
}
