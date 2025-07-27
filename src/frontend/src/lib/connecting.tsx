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
    <div className="relative space-y-6 p-4 sm:p-6">
      {/* Status Header */}
      <Card className="rounded-2xl border border-yellow-300 p-6 text-center shadow-sm">
        <div className="mb-4">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100/60">
            {isQrGiver ? <QrCodeIcon className="h-8 w-8 text-yellow-100" /> : <Scan className="h-8 w-8 text-yellow-100" />}
          </div>
          <h2 className="mb-2 font-bold text-xl text-yellow-600">{isQrGiver ? "Show Your QR Code" : "Scan QR Code"}</h2>
          <p className="text-sm text-yellow-700">{isQrGiver ? "Present this QR code to your partner" : "Find your partner and scan their QR code"}</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-2 font-medium text-sm text-yellow-800">
          <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
          Connecting
        </div>
      </Card>

      {/* Partner Info */}
      {gameStatus.partner_name && (
        <Card className="rounded-2xl border border-purple-300 p-4 shadow-sm">
          <div className="flex items-center justify-center gap-4">
            <Users className="h-6 w-6 flex-shrink-0 text-purple-600" />
            <span className="font-semibold text-base text-gray-300">
              Your Partner <span className="font-bold text-lg text-purple-700">{gameStatus.partner_name}</span>
            </span>
          </div>
        </Card>
      )}

      {/* QR Code Display */}
      {isQrGiver && gameStatus.qr_code && (
        <Card className="rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col items-center justify-center">
            <h3 className="mb-4 flex items-center justify-center gap-2 font-semibold text-base text-gray-300">
              <QrCodeIcon className="h-5 w-5" />
              Your QR Code
            </h3>
            {/* QR Code */}
            <div className="rounded-xl bg-gray-100 p-3 shadow-md">
              <QRCode value={gameStatus.qr_code} size={160} />
            </div>
          </div>
        </Card>
      )}

      {/* QR Scanner */}
      {!isQrGiver && (
        <Card className="rounded-2xl p-6 shadow-sm">
          <div className="text-center">
            <h3 className="mb-4 flex items-center justify-center gap-2 font-semibold text-base text-gray-300">
              <Camera className="h-5 w-5" />
              {isScanning ? "Scanning..." : "Ready to Scan"}
            </h3>
            {/* Camera Permission Denied */}
            {hasPermission === false && (
              <div className="mb-4 rounded-xl border-2 border-red-300 bg-red-50 p-4 shadow-inner">
                <div className="text-center">
                  <X className="mx-auto mb-2 h-8 w-8 text-red-500" />
                  <p className="mb-2 text-red-700 text-sm">Camera access denied or not available</p>
                  <p className="text-red-600 text-xs">Please enable camera permissions in your browser settings</p>
                </div>
              </div>
            )}
            {/* Camera Scanner View */}
            {isScanning && (
              <div className="relative mb-4 overflow-hidden rounded-lg border-2 border-purple-300 shadow-md">
                <video ref={videoRef} className="mx-auto w-full max-w-sm" style={{ maxHeight: "300px" }}>
                  <track kind="captions" srcLang="en" label="English captions" />
                </video>
              </div>
            )}
            {/* Default Scanner Instructions */}
            {!isScanning && hasPermission !== false && (
              <div className="mb-4 rounded-xl border-2 border-gray-300 border-dashed bg-gray-50 p-6 shadow-inner">
                <Scan className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                <p className="text-gray-500 text-sm">Find your partner and scan their QR code</p>
              </div>
            )}
            <Button
              onClick={handleScanClick}
              className={`w-full rounded-lg py-3 font-semibold text-base text-white transition-all duration-200 ${
                isScanning ? "bg-red-600 hover:bg-red-700" : "bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800"
              }`}
              disabled={hasPermission === false}
            >
              {isScanning ? (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Stop Scanning
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  Start Scanning
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Instructions */}
      <Card className="rounded-2xl p-6 shadow-sm">
        <h3 className="text-center font-semibold text-base text-gray-300">What's Next?</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 font-bold text-purple-600 text-sm shadow-sm">1</div>
            <div>
              <p className="font-medium text-gray-300 text-sm">Connect with your partner</p>
              <p className="text-gray-500 text-xs">{isQrGiver ? "Show your QR code" : "Scan their QR code"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 font-bold text-purple-600 text-sm shadow-sm">2</div>
            <div>
              <p className="font-medium text-gray-300 text-sm">Answer questions</p>
              <p className="text-gray-500 text-xs">Learn about each other through fun questions</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 font-bold text-purple-600 text-sm shadow-sm">3</div>
            <div>
              <p className="font-medium text-gray-300 text-sm">Earn points</p>
              <p className="text-gray-500 text-xs">Get points for correct answers</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Floating Chat Button - Only show if we have a partner */}
      {gameStatus.partner_name && (
        <Drawer open={isChatOpen} onOpenChange={setIsChatOpen}>
          <DrawerTrigger asChild>
            <div className="fixed right-4 bottom-4 z-50">
              <Button className="relative h-12 w-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-700 p-0 shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-purple-800 hover:shadow-xl">
                <MessageCircle className="h-6 w-6 text-white" />
                {/* Unread message count indicator */}
                {unreadCount > 0 && (
                  <div className="-right-1 -top-1 absolute flex h-5 w-5 items-center justify-center rounded-full border border-white bg-red-500">
                    <span className="font-bold text-white text-xs">{unreadCount > 9 ? "9+" : unreadCount}</span>
                  </div>
                )}
              </Button>
            </div>
          </DrawerTrigger>
          <DrawerContent className="flex h-[85vh] flex-col">
            <DrawerHeader className="p-4 text-white shadow-md">
              <div className="flex items-center">
                <div className="text-left">
                  <DrawerTitle className="font-semibold text-lg text-white">Chat with {gameStatus.partner_name}</DrawerTitle>
                  <p className="text-xs opacity-90">{isConnectedToWS ? "Connected" : "Connecting..."}</p>
                </div>
              </div>
            </DrawerHeader>
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 pb-20">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-gray-500">
                  <MessageCircle className="mb-4 h-16 w-16 text-gray-300" />
                  <h3 className="mb-2 font-semibold text-lg">Start chatting!</h3>
                  <p className="text-gray-500 text-sm">Coordinate with your partner to find each other's location.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, idx) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                    <div key={message.message + idx} className={`flex ${!message.isPartner ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-xl px-4 py-2 shadow-sm ${!message.isPartner ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"}`}>
                        <p className="break-words text-sm">{message.message}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>
            {/* Chat Input - Fixed at bottom */}
            <div className="absolute right-0 bottom-0 left-0 border-t bg-background p-4 shadow-lg">
              <div className="flex items-end gap-3">
                <Input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                  disabled={!isConnectedToWS}
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim() || !isConnectedToWS} size="icon" className="rounded-full">
                  <Send className="h-5 w-5 text-white" />
                </Button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  )
}
