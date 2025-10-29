import * as React from "react"
import { cn } from "../../lib/utils"

interface RadioGroupProps {
  value?: string
  onValueChange?: (value: string) => void
  className?: string
  children: React.ReactNode
}

interface RadioGroupItemProps {
  value: string
  id: string
  className?: string
}

const RadioGroupContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
} | null>(null)

const SimpleRadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ value, onValueChange, className, children }, ref) => {
    return (
      <RadioGroupContext.Provider value={{ value, onValueChange }}>
        <div ref={ref} className={cn("grid gap-2", className)} role="radiogroup">
          {children}
        </div>
      </RadioGroupContext.Provider>
    )
  }
)
SimpleRadioGroup.displayName = "SimpleRadioGroup"

const SimpleRadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ value, id, className }, ref) => {
    const context = React.useContext(RadioGroupContext)
    
    if (!context) {
      throw new Error("SimpleRadioGroupItem must be used within SimpleRadioGroup")
    }

    const { value: selectedValue, onValueChange } = context
    const isChecked = selectedValue === value

    return (
      <input
        ref={ref}
        type="radio"
        id={id}
        value={value}
        checked={isChecked}
        onChange={() => onValueChange?.(value)}
        className={cn(
          "h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      />
    )
  }
)
SimpleRadioGroupItem.displayName = "SimpleRadioGroupItem"

export { SimpleRadioGroup, SimpleRadioGroupItem }
