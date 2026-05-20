interface LoadingStateProps {
  text?: string;
}

export function LoadingState({ text = "Cargando información..." }: LoadingStateProps) {
  return (
    <div className="flex min-h-56 items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-white/70 p-8 text-center text-stone-600">
      <div>
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#f4d7cd] border-t-[#cf5b40]" />
        <p className="font-medium">{text}</p>
      </div>
    </div>
  );
}
