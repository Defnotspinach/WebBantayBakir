import { useEffect, useState } from "react";

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setFade(true), 1500);
    const timer2 = setTimeout(() => onFinish(), 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-[#0B1120] z-50 transition-opacity duration-500 ${
        fade ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-4">
        <img
          src="/icon.png"
          alt="Logo"
          className="w-24 h-24 animate-pulse"
        />
        <p className="text-green-400 text-lg font-semibold">
          Bantay Bakir
        </p>
      </div>
    </div>
  );
}
