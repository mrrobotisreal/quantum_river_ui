import { Sun } from "lucide-react";
import { MoonIcon as Moon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import winappsLogo from "@/assets/logo_transparent_shadow.svg";
import qrIcon from "@/assets/QuantumRiverIcon.png";
import githubLogo from "@/assets/github.svg";

const ThemeToggle = () => {
  const { setTheme, theme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="rounded-full !bg-transparent hover:!bg-gray-100 dark:hover:!bg-gray-800 [&]:bg-transparent"
    >
      <Sun className="h-10 w-10 rotate-0 scale-100 transition-all text-gray-700 dark:text-gray-200 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-10 w-10 rotate-90 scale-0 transition-all text-gray-700 dark:text-gray-200 dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};

const TopNav: React.FC = () => {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <a
          href="https://winapps.io/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
        >
          <img
            src={winappsLogo}
            alt="WinApps Logo"
            className="h-12 w-12"
          />
          <span className="text-xl font-semibold text-white hidden md:block" style={{ fontFamily: "ubuntu" }}>WinApps</span>
        </a>

        <div className="flex items-center space-x-3">
          <img
            src={qrIcon}
            alt="Media Manipulator Icon"
            className="h-10 w-10 rounded-sm"
          />
          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-bold text-white leading-tight">Quantum River</h1>
            <p className="text-xs md:text-sm text-gray-300 hidden sm:block">Generate QR Codes for URLs, WiFi, contacts, and more</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="rounded-full !bg-transparent hover:!bg-gray-100 dark:hover:!bg-gray-800 [&]:bg-transparent"
          >
            <a
              href="https://github.com/mrrobotisreal/quantum_river_ui"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={githubLogo} alt="GitHub" className="h-6 w-6 dark:invert" />
              <span className="sr-only">View on GitHub</span>
            </a>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
};

export default TopNav;
