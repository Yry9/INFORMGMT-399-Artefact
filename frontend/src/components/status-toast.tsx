import { Check } from 'lucide-react';

export function StatusToast({ message }: { message: string }) {
  return (
    <div className="toast-message" role="status" data-testid="status-toast">
      <Check size={14} style={{ verticalAlign: 'middle', marginRight: 7 }} />
      {message}
    </div>
  );
}
