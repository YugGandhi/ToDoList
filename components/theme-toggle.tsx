"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Sun } from "lucide-react"

export function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme("light")}
      aria-label="Toggle theme"
      className="text-white"
    >
      <Sun className="h-5 w-5" />
    </Button>
  )
}
