import "./globals.css";
import Navbar from '../components/Navbar';

export const metadata = {
  title: "BillGuard - Personal Finance Tracker",
  description: "Track your expenses, and payments.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
