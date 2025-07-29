import { type GameStatus, type GetUser, apiGameChatChat, apiGameScanQrScanQrCode } from "@/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Camera, MessageCircle, QrCodeIcon, Scan, Send, Users, X } from "lucide-react"
import QrScanner from "qr-scanner"
import { useEffect, useRef, useState } from "react"
import QRCode from "react-qr-code"
import { toast } from "sonner"

interface ConnectingProps {
  gameStatus: GameStatus
  user: GetUser
}

interface ChatMessage {
  isPartner: boolean
  message: string
  isRead?: boolean
}

export function Connecting({ gameStatus, user }: ConnectingProps) {
  const isQrGiver = gameStatus.qr_code !== null
  const [isScanning, setIsScanning] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const qrScannerRef = useRef<QrScanner | null>(null)

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isConnectedToWS, setIsConnectedToWS] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const socketRef = useRef<WebSocket | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // WebSocket connection
  useEffect(() => {
    if (gameStatus.partner_name) {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
      const host = window.location.host
      const socket = new WebSocket(`${protocol}//${host}/ws/${user.id}`)

      socket.addEventListener("open", () => {
        setIsConnectedToWS(true)
      })

      socket.addEventListener("message", (event) => {
        const data = JSON.parse(event.data)
        setMessages((prev) => [
          ...prev,
          {
            isPartner: true,
            message: data.message,
            isRead: false,
          },
        ])
        // Increment unread count only if chat is closed
        if (!isChatOpen) {
          setUnreadCount((prev) => prev + 1)
        }
      })

      socket.addEventListener("close", () => {
        setIsConnectedToWS(false)
      })

      socket.addEventListener("error", (error) => {
        console.error("WebSocket error:", error)
        setIsConnectedToWS(false)
      })

      socketRef.current = socket

      return () => {
        socket.close()
        socketRef.current = null
      }
    }
  }, [user.id, gameStatus.partner_name, isChatOpen])

  // Auto-scroll chat to bottom
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (isChatOpen) {
      setUnreadCount(0)
      setMessages((prev) => prev.map((msg) => ({ ...msg, isRead: true })))
    }
  }, [isChatOpen])

  useEffect(() => {
    // Cleanup scanner on unmount
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy()
      }
    }
  }, [])

  const startScanning = async () => {
    // Wait for video element to be available
    const waitForVideoElement = () => {
      return new Promise<HTMLVideoElement>((resolve, reject) => {
        if (videoRef.current) {
          resolve(videoRef.current)
          return
        }
        // Wait a bit for the element to render
        const checkInterval = setInterval(() => {
          if (videoRef.current) {
            clearInterval(checkInterval)
            resolve(videoRef.current)
          }
        }, 50)
        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkInterval)
          reject(new Error("Video element not found"))
        }, 5000)
      })
    }

    try {
      setIsScanning(true)
      // Wait for the video element to be rendered
      const videoElement = await waitForVideoElement()

      // Check if camera is available
      const hasCamera = await QrScanner.hasCamera()
      if (!hasCamera) {
        setHasPermission(false)
        setIsScanning(false)
        return
      }

      // Create QR Scanner instance
      const qrScanner = new QrScanner(
        videoElement,
        (result) => {
          handleQRDetected(result.data)
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: "environment", // Use back camera on mobile
        },
      )
      qrScannerRef.current = qrScanner

      // Start scanning
      await qrScanner.start()
      setHasPermission(true)
    } catch (error) {
      setHasPermission(false)
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop()
      qrScannerRef.current.destroy()
      qrScannerRef.current = null
    }
    setIsScanning(false)
  }

  const handleQRDetected = async (qrData: string) => {
    const response = await apiGameScanQrScanQrCode({
      body: {
        qr_code: qrData,
      },
    })

    if (response.status === 201) {
      toast.success("You have connected with your partner!")
    } else {
      toast.error("Failed to scan QR code", {
        description: response.error?.detail,
      })
    }

    stopScanning()
  }

  const handleScanClick = () => {
    if (isScanning) {
      stopScanning()
    } else {
      startScanning()
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !gameStatus.partner_name) return

    setMessages((prev) => [
      ...prev,
      {
        isPartner: false,
        message: newMessage.trim(),
        isRead: true,
      },
    ])
    await apiGameChatChat({
      body: {
        message: newMessage.trim(),
      },
    })
    setNewMessage("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="space-y-6 p-4">
      {/* Status Header */}
      <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-6 text-center backdrop-blur-sm">
        <div>
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
            {isQrGiver ? <QrCodeIcon className="h-10 w-10 text-white" /> : <Scan className="h-10 w-10 text-white" />}
          </div>
          <h2 className="font-bold text-2xl text-amber-400">{isQrGiver ? "Show Your QR Code" : "Scan QR Code"}</h2>
          <p className="text-amber-200/80 text-sm leading-relaxed">{isQrGiver ? "Present this QR code to your partner" : "Find your partner and scan their QR code"}</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-4 py-2 font-medium text-amber-300 text-sm backdrop-blur-sm">
          <div className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
          Connecting
        </div>
      </Card>

      {/* Partner Info */}
      {gameStatus.partner_name && (
        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-purple-700/10 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-purple-600">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="text-center">
              <p className="text-slate-300 text-sm">Your Partner</p>
              <p className="font-bold text-lg text-purple-400">{gameStatus.partner_name}</p>
            </div>
          </div>
        </Card>
      )}

      {/* QR Code Display */}
      {isQrGiver && gameStatus.qr_code && (
        <Card className="border-slate-700/50 bg-slate-800/50 p-6 backdrop-blur-sm">
          <div className="text-center">
            <h3 className="mb-6 flex items-center justify-center gap-2 font-semibold text-lg text-slate-200">
              <QrCodeIcon className="h-5 w-5 text-purple-400" />
              Your QR Code
            </h3>
            {/* QR Code */}
            <div className="mx-auto mb-4 w-fit rounded-2xl bg-white p-4 shadow-xl">
              <QRCode value={gameStatus.qr_code} size={200} />
            </div>
          </div>
        </Card>
      )}

      {/* QR Scanner */}
      {!isQrGiver && (
        <Card className="border-slate-700/50 bg-slate-800/50 p-6 backdrop-blur-sm">
          <div className="text-center">
            <h3 className="mb-6 flex items-center justify-center gap-2 font-semibold text-lg text-slate-200">
              <Camera className="h-5 w-5 text-purple-400" />
              {isScanning ? "Scanning..." : "Ready to Scan"}
            </h3>

            {/* Camera Permission Denied */}
            {hasPermission === false && (
              <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-6">
                <div className="text-center">
                  <X className="mx-auto mb-3 h-12 w-12 text-red-400" />
                  <p className="mb-2 font-medium text-red-300">Camera access denied or not available</p>
                  <p className="text-red-400/80 text-sm">Please enable camera permissions in your browser settings</p>
                </div>
              </div>
            )}

            {/* Camera Scanner View */}
            {isScanning && (
              <div className="relative mb-6 overflow-hidden rounded-xl border border-purple-500/20 shadow-lg">
                <video ref={videoRef} className="mx-auto w-full max-w-sm rounded-xl" style={{ maxHeight: "300px" }}>
                  <track kind="captions" srcLang="en" label="English captions" />
                </video>
                <div className="absolute inset-0 rounded-xl ring-2 ring-purple-500/50 ring-offset-2 ring-offset-slate-800" />
              </div>
            )}

            {/* Default Scanner Instructions */}
            {!isScanning && hasPermission !== false && (
              <div className="mb-6 rounded-xl border border-slate-600 border-dashed bg-slate-700/30 p-8">
                <Scan className="mx-auto mb-4 h-16 w-16 text-slate-400" />
                <p className="font-medium text-slate-300">Find your partner and scan their QR code</p>
              </div>
            )}

            <Button
              onClick={handleScanClick}
              className={`w-full py-3 font-semibold text-base transition-all duration-200 ${
                isScanning
                  ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                  : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              }`}
              disabled={hasPermission === false}
            >
              {isScanning ? (
                <>
                  <X className="h-4 w-4" />
                  Stop Scanning
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" />
                  Scan
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Instructions */}
      <Card className="border-slate-700/50 bg-slate-800/50 p-6 backdrop-blur-sm">
        <h3 className="text-center font-semibold text-lg text-slate-200">What's Next?</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-700 font-bold text-sm text-white shadow-sm">
              1
            </div>
            <div>
              <p className="font-medium text-slate-300">Connect with your partner</p>
              <p className="text-slate-400 text-sm">{isQrGiver ? "Show your QR code" : "Scan their QR code"}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-700 font-bold text-sm text-white shadow-sm">
              2
            </div>
            <div>
              <p className="font-medium text-slate-300">Answer questions</p>
              <p className="text-slate-400 text-sm">Learn about each other through fun questions</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-700 font-bold text-sm text-white shadow-sm">
              3
            </div>
            <div>
              <p className="font-medium text-slate-300">Earn points</p>
              <p className="text-slate-400 text-sm">Get points for correct answers</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Floating Chat Button - Only show if we have a partner */}
      {gameStatus.partner_name && (
        <Drawer open={isChatOpen} onOpenChange={setIsChatOpen}>
          <DrawerTrigger asChild>
            <div className="fixed right-4 bottom-4 z-50">
              <Button className="relative h-14 w-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 p-0 shadow-xl transition-all duration-200 hover:scale-105 hover:from-blue-600 hover:to-purple-700 hover:shadow-2xl">
                <MessageCircle className="h-6 w-6 text-white" />
                {/* Unread message count indicator */}
                {unreadCount > 0 && (
                  <div className="-right-1 -top-1 absolute flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-800 bg-red-500">
                    <span className="font-bold text-white text-xs">{unreadCount > 9 ? "9+" : unreadCount}</span>
                  </div>
                )}
              </Button>
            </div>
          </DrawerTrigger>
          <DrawerContent className="flex h-[85vh] flex-col border-slate-700 bg-slate-900">
            <DrawerHeader className="border-slate-700 border-b bg-gradient-to-r from-blue-600 to-purple-600 p-4">
              <div className="flex items-center">
                <div className="text-left">
                  <DrawerTitle className="font-semibold text-lg text-white">Chat with {gameStatus.partner_name}</DrawerTitle>
                  <p className="text-blue-100/80 text-xs">{isConnectedToWS ? "Connected" : "Connecting..."}</p>
                </div>
              </div>
            </DrawerHeader>
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 pb-20">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <MessageCircle className="mb-4 h-16 w-16 text-slate-600" />
                  <h3 className="mb-2 font-semibold text-lg text-slate-300">Start chatting!</h3>
                  <p className="text-slate-400 text-sm">Coordinate with your partner to find each other's location.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, idx) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                    <div key={message.message + idx} className={`flex ${!message.isPartner ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                          !message.isPartner ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white" : "border border-slate-600 bg-slate-700 text-slate-200"
                        }`}
                      >
                        <p className="break-words text-sm">{message.message}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>
            {/* Chat Input - Fixed at bottom */}
            <div className="absolute right-0 bottom-0 left-0 border-slate-700 border-t bg-slate-900 p-4">
              <div className="flex items-end gap-3">
                <Input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 border-slate-600 bg-slate-800 text-white placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  disabled={!isConnectedToWS}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || !isConnectedToWS}
                  size="icon"
                  className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <Send className="h-4 w-4 text-white" />
                </Button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  )
}
