import * as React from "react"
import { cn } from "../../lib/utils"

interface SimpleSelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

interface SimpleSelectTriggerProps {
  className?: string
  children: React.ReactNode
}

interface SimpleSelectContentProps {
  children: React.ReactNode
  className?: string
}

interface SimpleSelectItemProps {
  value: string
  children: React.ReactNode
  className?: string
}

interface SimpleSelectValueProps {
  placeholder?: string
}

const SimpleSelectContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
} | null>(null)

export const SimpleSelect = React.forwardRef<HTMLDivElement, SimpleSelectProps>(
  ({ value, onValueChange, children, className }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)

    return (
      <SimpleSelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen }}>
        <div ref={ref} className={cn("relative", className)}>
          {children}
        </div>
      </SimpleSelectContext.Provider>
    )
  }
)
SimpleSelect.displayName = "SimpleSelect"

export const SimpleSelectTrigger = React.forwardRef<HTMLButtonElement, SimpleSelectTriggerProps>(
  ({ className, children }, ref) => {
    const context = React.useContext(SimpleSelectContext)
    
    if (!context) {
      throw new Error("SimpleSelectTrigger must be used within SimpleSelect")
    }

    const { isOpen, setIsOpen } = context

    return (
      <button
        ref={ref}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      >
        {children}
        <svg
          className="h-4 w-4 opacity-50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    )
  }
)
SimpleSelectTrigger.displayName = "SimpleSelectTrigger"

export const SimpleSelectValue = ({ placeholder }: SimpleSelectValueProps) => {
  const context = React.useContext(SimpleSelectContext)
  
  if (!context) {
    throw new Error("SimpleSelectValue must be used within SimpleSelect")
  }

  const { value } = context

  return <span>{value || placeholder}</span>
}

export const SimpleSelectContent = React.forwardRef<HTMLDivElement, SimpleSelectContentProps>(
  ({ children, className }, ref) => {
    const context = React.useContext(SimpleSelectContext)
    
    if (!context) {
      throw new Error("SimpleSelectContent must be used within SimpleSelect")
    }

    const { isOpen, setIsOpen } = context

    if (!isOpen) return null

    return (
      <>
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
        <div
          ref={ref}
          className={cn(
            "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80",
            className
          )}
        >
          {children}
        </div>
      </>
    )
  }
)
SimpleSelectContent.displayName = "SimpleSelectContent"

export const SimpleSelectItem = React.forwardRef<HTMLDivElement, SimpleSelectItemProps>(
  ({ value, children, className }, ref) => {
    const context = React.useContext(SimpleSelectContext)
    
    if (!context) {
      throw new Error("SimpleSelectItem must be used within SimpleSelect")
    }

    const { value: selectedValue, onValueChange, setIsOpen } = context
    const isSelected = selectedValue === value

    return (
      <div
        ref={ref}
        onClick={() => {
          onValueChange?.(value)
          setIsOpen(false)
        }}
        className={cn(
          "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
          isSelected && "bg-accent",
          className
        )}
      >
        {children}
      </div>
    )
  }
)
SimpleSelectItem.displayName = "SimpleSelectItem"
