import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Switch } from './ui/switch'
import { Label } from './ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { X, Globe, Save, Loader2, Chrome } from 'lucide-react'
import {
  getSearchProvider,
  setSearchProvider,
  getSearxNGInstance,
  setSearxNGInstance,
  getBraveApiKey,
  setBraveApiKey,
} from '@/lib/web-search'
import {
  detectInstalledBrowsers,
  getBrowserDisplayName,
  type BrowserType,
} from '@/lib/browser-search'
import { toast } from '@/hooks/use-toast'

interface SearchSettingsProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchSettings({ isOpen, onClose }: SearchSettingsProps) {
  const [provider, setProviderState] = useState('duckduckgo')
  const [searxngInstance, setSearxngInstanceState] = useState('https://searx.be')
  const [braveApiKey, setBraveApiKeyState] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  
  // Browser automation settings
  const [browserType, setBrowserType] = useState<BrowserType>('api-only')
  const [headlessMode, setHeadlessMode] = useState(true)
  const [undetectedMode, setUndetectedMode] = useState(true)
  const [availableBrowsers, setAvailableBrowsers] = useState<BrowserType[]>(['api-only'])
  const [detectingBrowsers, setDetectingBrowsers] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadSettings()
      detectBrowsers()
    }
  }, [isOpen])

  const loadSettings = async () => {
    const savedProvider = await getSearchProvider()
    const savedInstance = await getSearxNGInstance()
    const savedApiKey = await getBraveApiKey()
    
    setProviderState(savedProvider)
    setSearxngInstanceState(savedInstance)
    setBraveApiKeyState(savedApiKey || '')
    
    // Load browser settings from localStorage
    const savedBrowser = localStorage.getItem('search_browser_type') as BrowserType || 'api-only'
    const savedHeadless = localStorage.getItem('search_headless') !== 'false'
    const savedUndetected = localStorage.getItem('search_undetected') !== 'false'
    
    setBrowserType(savedBrowser)
    setHeadlessMode(savedHeadless)
    setUndetectedMode(savedUndetected)
  }
  
  const detectBrowsers = async () => {
    setDetectingBrowsers(true)
    try {
      const browsers = await detectInstalledBrowsers()
      setAvailableBrowsers(browsers)
      
      // If current selection is not available, reset to api-only
      if (!browsers.includes(browserType)) {
        setBrowserType('api-only')
      }
    } catch (error) {
      console.error('Failed to detect browsers:', error)
      toast({
        title: 'Browser Detection Failed',
        description: 'Could not detect installed browsers. API-only mode will be used.',
        variant: 'destructive',
      })
    } finally {
      setDetectingBrowsers(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      await setSearchProvider(provider)
      await setSearxNGInstance(searxngInstance)
      if (braveApiKey) {
        await setBraveApiKey(braveApiKey)
      }
      
      // Save browser settings
      localStorage.setItem('search_browser_type', browserType)
      localStorage.setItem('search_headless', String(headlessMode))
      localStorage.setItem('search_undetected', String(undetectedMode))
      
      toast({
        title: 'Settings Saved',
        description: 'Search settings have been updated successfully',
      })
      
      onClose()
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast({
        title: 'Save Failed',
        description: 'Failed to save search settings',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Search Settings</CardTitle>
                <CardDescription>
                  Configure your web search provider
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Search Provider</label>
            <Select value={provider} onValueChange={setProviderState}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="duckduckgo">
                  DuckDuckGo (Recommended - Free & Private)
                </SelectItem>
                <SelectItem value="searxng">
                  SearxNG (Opensource Metasearch)
                </SelectItem>
                <SelectItem value="brave">
                  Brave Search (Requires API Key)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {provider === 'duckduckgo' && '✅ No setup required, works out of the box'}
              {provider === 'searxng' && '🔧 Configure instance URL below'}
              {provider === 'brave' && '🔑 Free tier available at search.brave.com'}
            </p>
          </div>

          {/* SearxNG Instance */}
          {provider === 'searxng' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">SearxNG Instance URL</label>
              <Input
                placeholder="https://searx.be"
                value={searxngInstance}
                onChange={(e) => setSearxngInstanceState(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Public instances: searx.be, searx.org, or self-host your own
              </p>
            </div>
          )}

          {/* Brave API Key */}
          {provider === 'brave' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Brave API Key</label>
              <Input
                type="password"
                placeholder="Enter your Brave Search API key"
                value={braveApiKey}
                onChange={(e) => setBraveApiKeyState(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Get a free API key at search.brave.com/api
              </p>
            </div>
          )}

          {/* Browser Automation Settings */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Chrome className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-semibold">Browser Automation</h3>
              <span className="text-xs bg-amber-500/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded">
                Requires Backend
              </span>
            </div>
            
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-700 dark:text-amber-400">
              ℹ️ Browser automation requires a Node.js backend server and is not available in browser-only mode. Currently using API-only search.
            </div>
            
            {/* Browser Selection */}
            <div className="space-y-2">
              <Label htmlFor="browser-type">Browser Type</Label>
              {detectingBrowsers ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 border rounded-lg">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Detecting installed browsers...
                </div>
              ) : (
                <Select value={browserType} onValueChange={(v) => setBrowserType(v as BrowserType)}>
                  <SelectTrigger id="browser-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBrowsers.map((browser) => (
                      <SelectItem key={browser} value={browser}>
                        {getBrowserDisplayName(browser)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-xs text-muted-foreground">
                {browserType === 'api-only' 
                  ? '✅ Fast API-based search, no browser needed' 
                  : '🌐 Uses real browser for more accurate results'}
              </p>
            </div>
            
            {/* Headless Mode */}
            {browserType !== 'api-only' && (
              <>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="headless">Headless Mode</Label>
                    <p className="text-xs text-muted-foreground">
                      Run browser in background (faster, no window)
                    </p>
                  </div>
                  <Switch
                    id="headless"
                    checked={headlessMode}
                    onCheckedChange={setHeadlessMode}
                  />
                </div>
                
                {/* Undetected Mode */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="undetected">Undetected Mode (Stealth)</Label>
                    <p className="text-xs text-muted-foreground">
                      Bypass bot detection with stealth plugin
                    </p>
                  </div>
                  <Switch
                    id="undetected"
                    checked={undetectedMode}
                    onCheckedChange={setUndetectedMode}
                  />
                </div>
              </>
            )}
          </div>

          {/* Provider Info */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <h4 className="text-sm font-semibold">Search Methods</h4>
            <div className="text-xs space-y-1">
              <p><strong>API Only:</strong> Fast, lightweight, uses DuckDuckGo/Brave/SearxNG APIs</p>
              <p><strong>Browser:</strong> Real browser automation, bypasses restrictions, more accurate</p>
              <p><strong>Stealth Mode:</strong> Undetected ChromeDriver, avoids bot detection</p>
            </div>
          </div>

          {/* Save Button */}
          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

