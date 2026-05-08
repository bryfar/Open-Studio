import { redirect } from 'next/navigation';

export default function HomePage() {
  const homeTarget = process.env.OPENSTUDIO_HOME;
  redirect(homeTarget === 'landing' ? '/convix' : '/dashboard');
}
