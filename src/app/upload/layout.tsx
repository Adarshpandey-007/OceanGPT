import { ToastProvider } from '../../components/ui/ToastProvider';

export default function UploadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ToastProvider>{children}</ToastProvider>;
}