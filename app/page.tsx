import { redirect } from 'next/navigation';

export default function HomePage() {
  // Instantly push all new visitors to the dashboard (which will then securely route them to the login screen if they don't have an account)
  redirect('/dashboard');
}