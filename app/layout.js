import { Heebo, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import Preferences from "@/components/Preferences";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
});
const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata = {
  title: "Leviathan",
  description: "AI study companion that also launches your career — feed it your exams, it feeds you a career.",
};

// Runs before the page is painted: applies the saved theme and language to <html>
// (data-theme, lang, dir) so a refresh doesn't flash the default dark / English / LTR first.
// Defaults are dark + English. Must match components/Preferences.js.
const initPreferences = `(function(){try{
var d=document.documentElement;
var t=localStorage.getItem('theme');
var l=localStorage.getItem('siteLanguage');
if(t!=='light'&&t!=='auto')t='dark';
if(l!=='he'&&l!=='ar')l='en';
var r=t==='auto'?(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):t;
d.setAttribute('data-theme',r);d.style.colorScheme=r;
d.lang=l;d.dir=(l==='he'||l==='ar')?'rtl':'ltr';
}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning: the script above changes these attributes before React loads
    <html lang="en" dir="ltr" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: initPreferences }} />
      </head>
      <body
        className={`${heebo.variable} ${notoArabic.variable} min-h-screen antialiased`}
      >
        <Preferences />
        {children}
      </body>
    </html>
  );
}
