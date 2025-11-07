import { useState } from 'react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { 
  Search, 
  X, 
  Filter,
  Calendar,
  Bot
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

export interface SearchFilters {
  query: string
  models: string[]
  dateRange: 'all' | 'today' | 'week' | 'month'
}

interface ConversationSearchProps {
  onSearch: (filters: SearchFilters) => void
  availableModels: string[]
}

export function ConversationSearch({ onSearch, availableModels }: ConversationSearchProps) {
  const [query, setQuery] = useState('')
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery)
    onSearch({
      query: newQuery,
      models: selectedModels,
      dateRange,
    })
  }

  const handleModelToggle = (model: string) => {
    const updated = selectedModels.includes(model)
      ? selectedModels.filter(m => m !== model)
      : [...selectedModels, model]
    
    setSelectedModels(updated)
    onSearch({
      query,
      models: updated,
      dateRange,
    })
  }

  const handleDateRangeChange = (range: 'all' | 'today' | 'week' | 'month') => {
    setDateRange(range)
    onSearch({
      query,
      models: selectedModels,
      dateRange: range,
    })
  }

  const handleClearFilters = () => {
    setQuery('')
    setSelectedModels([])
    setDateRange('all')
    onSearch({
      query: '',
      models: [],
      dateRange: 'all',
    })
  }

  const hasActiveFilters = query || selectedModels.length > 0 || dateRange !== 'all'

  return (
    <div className="p-3 border-b space-y-2">
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search conversations..."
            className="pl-9 pr-9"
          />
          {query && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={hasActiveFilters && selectedModels.length === 0 && dateRange === 'all' ? 'bg-primary/10' : ''}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Models
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {availableModels.length > 0 ? (
              availableModels.map((model) => (
                <DropdownMenuCheckboxItem
                  key={model}
                  checked={selectedModels.includes(model)}
                  onCheckedChange={() => handleModelToggle(model)}
                >
                  {model}
                </DropdownMenuCheckboxItem>
              ))
            ) : (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                No models available
              </div>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuLabel className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date Range
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={dateRange === 'all'}
              onCheckedChange={() => handleDateRangeChange('all')}
            >
              All Time
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={dateRange === 'today'}
              onCheckedChange={() => handleDateRangeChange('today')}
            >
              Today
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={dateRange === 'week'}
              onCheckedChange={() => handleDateRangeChange('week')}
            >
              This Week
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={dateRange === 'month'}
              onCheckedChange={() => handleDateRangeChange('month')}
            >
              This Month
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {selectedModels.length > 0 && (
              <span className="bg-primary/10 px-2 py-1 rounded">
                {selectedModels.length} model{selectedModels.length !== 1 ? 's' : ''}
              </span>
            )}
            {dateRange !== 'all' && (
              <span className="bg-primary/10 px-2 py-1 rounded capitalize">
                {dateRange}
              </span>
            )}
          </div>
          <Button
            onClick={handleClearFilters}
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}

