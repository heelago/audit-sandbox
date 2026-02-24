import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { InstructorOnboardingHub } from '@/components/onboarding/InstructorOnboardingHub';

export default async function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.role !== 'instructor') {
    redirect('/');
  }

  return (
    <>
      <InstructorOnboardingHub />
      {children}
    </>
  );
}
