import { useState } from 'react';
import { useMigrationForm, type SubmitResult } from './hooks/useMigrationForm';
import { InputScreen } from './components/input/InputScreen';
import { ResultsPreview } from './components/ResultsPreview';

export function App() {
  const [result, setResult] = useState<SubmitResult | null>(null);
  const form = useMigrationForm({ onSubmitted: setResult });

  return (
    <div className="min-h-screen w-full bg-bg text-ink antialiased">
      {result ? (
        <ResultsPreview result={result} onBack={() => setResult(null)} />
      ) : (
        <InputScreen form={form} />
      )}
    </div>
  );
}
