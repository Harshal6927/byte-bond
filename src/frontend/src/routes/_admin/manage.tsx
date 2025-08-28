import {
  type GetEvent,
  type GetQuestion,
  apiEventsEventIdDeleteEvent,
  apiEventsEventIdPatchEvent,
  apiEventsGetEvents,
  apiEventsPostEvent,
  apiGameStartStartGame,
  apiGameStopStopGame,
  apiQuestionsGetQuestions,
  apiQuestionsPostQuestion,
  apiQuestionsQuestionIdDeleteQuestion,
  apiQuestionsQuestionIdPatchQuestion,
} from "@/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { zodResolver } from "@hookform/resolvers/zod"
import { createFileRoute } from "@tanstack/react-router"
import { CircleAlert, Edit, Eye, HelpCircle, Play, Plus, Square, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

export const Route = createFileRoute("/_admin/manage")({
  component: ManagePage,
})

// Form schemas
const createEventSchema = z.object({
  name: z.string().min(1, "Event name is required").max(255, "Event name must be 255 characters or less"),
  code: z.string().min(1, "Event code is required").max(64, "Event code must be 64 characters or less"),
})

const editEventSchema = z.object({
  name: z.string().min(1, "Event name is required").max(255, "Event name must be 255 characters or less"),
  code: z.string().min(1, "Event code is required").max(64, "Event code must be 64 characters or less"),
  is_active: z.boolean(),
  whitelist: z.string().refine((val) => {
    try {
      JSON.parse(val)
      return true
    } catch {
      return false
    }
  }, "Must be valid JSON"),
})

const createQuestionSchema = z.object({
  question: z.string().min(1, "Question is required").max(500, "Question must be 500 characters or less"),
  question_type: z.enum(["multiple_choice", "true_false", "default"]),
  options: z.string().optional(),
  is_signup_question: z.boolean(),
  is_game_question: z.boolean(),
})

const editQuestionSchema = z.object({
  question: z.string().min(1, "Question is required").max(500, "Question must be 500 characters or less"),
  question_type: z.enum(["multiple_choice", "true_false", "default"]),
  options: z.string().optional(),
  is_signup_question: z.boolean(),
  is_game_question: z.boolean(),
})

type CreateEventFormData = z.infer<typeof createEventSchema>
type EditEventFormData = z.infer<typeof editEventSchema>
type CreateQuestionFormData = z.infer<typeof createQuestionSchema>
type EditQuestionFormData = z.infer<typeof editQuestionSchema>

function ManagePage() {
  const [events, setEvents] = useState<GetEvent[]>([])
  const [questions, setQuestions] = useState<GetQuestion[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [questionsLoading, setQuestionsLoading] = useState(true)
  const [gameLoading, setGameLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Question dialog states
  const [createQuestionDialogOpen, setCreateQuestionDialogOpen] = useState(false)
  const [viewQuestionDialogOpen, setViewQuestionDialogOpen] = useState(false)
  const [editQuestionDialogOpen, setEditQuestionDialogOpen] = useState(false)
  const [deleteQuestionDialogOpen, setDeleteQuestionDialogOpen] = useState(false)

  // Form states
  const [selectedEventForAction, setSelectedEventForAction] = useState<GetEvent | null>(null)
  const [selectedQuestionForAction, setSelectedQuestionForAction] = useState<GetQuestion | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  // React Hook Form instances
  const createForm = useForm<CreateEventFormData>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      name: "",
      code: "",
    },
    mode: "onBlur",
  })

  const editForm = useForm<EditEventFormData>({
    resolver: zodResolver(editEventSchema),
    defaultValues: {
      name: "",
      code: "",
      is_active: false,
      whitelist: "",
    },
    mode: "onBlur",
  })

  const createQuestionForm = useForm<CreateQuestionFormData>({
    resolver: zodResolver(createQuestionSchema),
    defaultValues: {
      question: "",
      question_type: "default",
      options: "",
      is_signup_question: true,
      is_game_question: true,
    },
    mode: "onBlur",
  })

  const editQuestionForm = useForm<EditQuestionFormData>({
    resolver: zodResolver(editQuestionSchema),
    defaultValues: {
      question: "",
      question_type: "default",
      options: "",
      is_signup_question: true,
      is_game_question: true,
    },
    mode: "onBlur",
  })

  useEffect(() => {
    fetchEvents()
    fetchQuestions()
  }, [])

  const fetchEvents = async () => {
    setEventsLoading(true)
    setError(null)

    try {
      const response = await apiEventsGetEvents()
      if (response.status === 200 && response.data) {
        setEvents(response.data.items || [])
      } else {
        setError("Failed to fetch events")
      }
    } catch (err) {
      setError("Failed to fetch events")
    }

    setEventsLoading(false)
  }

  const fetchQuestions = async () => {
    setQuestionsLoading(true)
    setError(null)

    try {
      const response = await apiQuestionsGetQuestions({ query: { limit: -1 } })
      if (response.status === 200 && response.data) {
        setQuestions(response.data.items || [])
      } else {
        setError("Failed to fetch questions")
      }
    } catch (err) {
      setError("Failed to fetch questions")
    }

    setQuestionsLoading(false)
  }

  const handleCreateEvent = async (data: CreateEventFormData) => {
    setFormLoading(true)
    try {
      const response = await apiEventsPostEvent({ body: data })
      if (response.status === 201) {
        await fetchEvents()
        setCreateDialogOpen(false)
        createForm.reset()
        toast.success("Event created successfully!")
      } else {
        toast.error("Failed to create event", {
          description: response.error?.detail || "Please try again",
        })
      }
    } catch (err) {
      toast.error("Failed to create event")
    }
    setFormLoading(false)
  }

  const handleViewEvent = async (event: GetEvent) => {
    setSelectedEventForAction(event)
    setViewDialogOpen(true)
  }

  const handleEditEvent = async (event: GetEvent) => {
    setSelectedEventForAction(event)
    editForm.reset({
      name: event.name,
      code: event.code,
      is_active: event.is_active,
      whitelist: JSON.stringify(event.whitelist, null, 2),
    })
    setEditDialogOpen(true)
  }

  const handleUpdateEvent = async (data: EditEventFormData) => {
    if (!selectedEventForAction) return

    setFormLoading(true)
    try {
      const whitelistJson = JSON.parse(data.whitelist)
      const response = await apiEventsEventIdPatchEvent({
        path: { event_id: selectedEventForAction.id },
        body: {
          name: data.name,
          code: data.code,
          is_active: data.is_active,
          whitelist: whitelistJson,
        },
      })
      if (response.status === 200) {
        await fetchEvents()
        setEditDialogOpen(false)
        editForm.reset()
        setSelectedEventForAction(null)
        toast.success("Event updated successfully!")
      } else {
        toast.error("Failed to update event", {
          description: response.error?.detail || "Please try again",
        })
      }
    } catch (err) {
      toast.error("Failed to update event")
    }
    setFormLoading(false)
  }

  const handleDeleteEvent = async (event: GetEvent) => {
    setSelectedEventForAction(event)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteEvent = async () => {
    if (!selectedEventForAction) return

    setFormLoading(true)
    try {
      const response = await apiEventsEventIdDeleteEvent({
        path: { event_id: selectedEventForAction.id },
      })
      if (response.status === 200) {
        await fetchEvents()
        setDeleteDialogOpen(false)
        setSelectedEventForAction(null)
      } else {
        setError(response.error?.detail || "Unknown error")
      }
    } catch (err) {
      setError("Failed to delete event")
    }
    setFormLoading(false)
  }

  const handleStartGameForEvent = async (eventId: number) => {
    setGameLoading(true)
    setError(null)

    try {
      const response = await apiGameStartStartGame({
        body: { event_id: eventId },
      })

      if (response.status === 201) {
        await fetchEvents()
      } else {
        setError(response.error?.detail || "Unknown error")
      }
    } catch (err) {
      setError("Failed to start game")
    }

    setGameLoading(false)
  }

  const handleStopGameForEvent = async (eventId: number) => {
    setGameLoading(true)
    setError(null)

    try {
      const response = await apiGameStopStopGame({
        body: { event_id: eventId },
      })

      if (response.status === 201) {
        await fetchEvents()
      } else {
        setError(response.error?.detail || "Unknown error")
      }
    } catch (err) {
      setError("Failed to stop game")
    }

    setGameLoading(false)
  }

  // Question management handlers
  const handleCreateQuestion = async (data: CreateQuestionFormData) => {
    setFormLoading(true)
    try {
      let options: string[] | null = null
      if (data.options?.trim()) {
        options = data.options
          .split("\n")
          .map((option) => option.trim())
          .filter((option) => option.length > 0)
      }

      const response = await apiQuestionsPostQuestion({
        body: {
          question: data.question,
          question_type: data.question_type,
          options: options,
          is_signup_question: data.is_signup_question,
          is_game_question: data.is_game_question,
        },
      })
      if (response.status === 201) {
        await fetchQuestions()
        setCreateQuestionDialogOpen(false)
        createQuestionForm.reset()
        toast.success("Question created successfully!")
      } else {
        toast.error("Failed to create question", {
          description: response.error?.detail || "Please try again",
        })
      }
    } catch (err) {
      toast.error("Failed to create question")
    }
    setFormLoading(false)
  }

  const handleViewQuestion = async (question: GetQuestion) => {
    setSelectedQuestionForAction(question)
    setViewQuestionDialogOpen(true)
  }

  const handleEditQuestion = async (question: GetQuestion) => {
    setSelectedQuestionForAction(question)
    editQuestionForm.reset({
      question: question.question,
      question_type: question.question_type,
      options: question.options?.join("\n") || "",
      is_signup_question: question.is_signup_question,
      is_game_question: question.is_game_question,
    })
    setEditQuestionDialogOpen(true)
  }

  const handleUpdateQuestion = async (data: EditQuestionFormData) => {
    if (!selectedQuestionForAction) return

    setFormLoading(true)
    try {
      let options: string[] | null = null
      if (data.options?.trim()) {
        options = data.options
          .split("\n")
          .map((option) => option.trim())
          .filter((option) => option.length > 0)
      }

      const response = await apiQuestionsQuestionIdPatchQuestion({
        path: { question_id: selectedQuestionForAction.id },
        body: {
          question: data.question,
          question_type: data.question_type,
          options: options,
          is_signup_question: data.is_signup_question,
          is_game_question: data.is_game_question,
        },
      })
      if (response.status === 200) {
        await fetchQuestions()
        setEditQuestionDialogOpen(false)
        editQuestionForm.reset()
        setSelectedQuestionForAction(null)
        toast.success("Question updated successfully!")
      } else {
        toast.error("Failed to update question", {
          description: response.error?.detail || "Please try again",
        })
      }
    } catch (err) {
      toast.error("Failed to update question")
    }
    setFormLoading(false)
  }

  const handleDeleteQuestion = async (question: GetQuestion) => {
    setSelectedQuestionForAction(question)
    setDeleteQuestionDialogOpen(true)
  }

  const confirmDeleteQuestion = async () => {
    if (!selectedQuestionForAction) return

    setFormLoading(true)
    try {
      const response = await apiQuestionsQuestionIdDeleteQuestion({
        path: { question_id: selectedQuestionForAction.id },
      })
      if (response.status === 200) {
        await fetchQuestions()
        setDeleteQuestionDialogOpen(false)
        setSelectedQuestionForAction(null)
        toast.success("Question deleted successfully!")
      } else {
        setError(response.error?.detail || "Unknown error")
      }
    } catch (err) {
      setError("Failed to delete question")
    }
    setFormLoading(false)
  }

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="font-bold text-3xl text-foreground">Admin Panel</h1>
        <p className="text-muted-foreground">Manage your ByteBond events and games</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center justify-between rounded-md border border-destructive/50 bg-destructive/10 p-3">
          <p className="flex items-center gap-2">
            <CircleAlert className="h-4 w-4 text-destructive" />
            {error}
          </p>
          <Button variant="outline" size="sm" onClick={() => setError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Admin Cards */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Event Management & Game Control */}
        <div className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Event Management
              </CardTitle>
              <CardDescription>Create and manage events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Create Event Dialog */}
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full justify-start" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="min-w-[50%]">
                  <DialogHeader>
                    <DialogTitle>Create New Event</DialogTitle>
                    <DialogDescription>Create a new event for participants to join and play.</DialogDescription>
                  </DialogHeader>
                  <Form {...createForm}>
                    <form onSubmit={createForm.handleSubmit(handleCreateEvent)} className="space-y-4">
                      <FormField
                        control={createForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter event name" {...field} disabled={formLoading} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Code</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter unique event code" {...field} disabled={formLoading} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setCreateDialogOpen(false)
                            createForm.reset()
                          }}
                          disabled={formLoading}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={formLoading}>
                          {formLoading ? "Creating..." : "Create Event"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              {/* Events List */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Existing Events</h4>
                {eventsLoading ? (
                  <div className="text-muted-foreground text-sm">Loading events...</div>
                ) : events.length > 0 ? (
                  <div className="custom-scrollbar max-h-[24rem] space-y-2 overflow-y-auto">
                    {events.map((event) => (
                      <div key={event.id} className="flex items-center justify-between rounded-md border p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{event.name}</span>
                          <span className={`h-2 w-2 rounded-full ${event.is_active ? "bg-green-500" : "bg-red-500"}`} />
                        </div>
                        <div className="flex gap-1">
                          {event.is_active ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleStopGameForEvent(event.id)}
                              disabled={gameLoading}
                              className="text-orange-600 hover:text-orange-700"
                            >
                              <Square className="h-3 w-3" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleStartGameForEvent(event.id)}
                              disabled={gameLoading}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => handleViewEvent(event)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleEditEvent(event)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteEvent(event)} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm">No events found</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Question Management */}
        <div className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Question Management
              </CardTitle>
              <CardDescription>Create and manage questions for the game</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Create Question Dialog */}
              <Dialog open={createQuestionDialogOpen} onOpenChange={setCreateQuestionDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full justify-start" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Question
                  </Button>
                </DialogTrigger>
                <DialogContent className="min-w-[50%]">
                  <DialogHeader>
                    <DialogTitle>Create New Question</DialogTitle>
                    <DialogDescription>Create a new question for participants to answer.</DialogDescription>
                  </DialogHeader>
                  <Form {...createQuestionForm}>
                    <form onSubmit={createQuestionForm.handleSubmit(handleCreateQuestion)} className="space-y-4">
                      <FormField
                        control={createQuestionForm.control}
                        name="question"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Question</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter question" {...field} disabled={formLoading} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createQuestionForm.control}
                        name="question_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Question Type</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value} disabled={formLoading}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="default">Default (Open Text)</SelectItem>
                                  <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                  <SelectItem value="true_false">True/False</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createQuestionForm.control}
                        name="options"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Options (one per line, for MCQ/True-False)</FormLabel>
                            <FormControl>
                              <textarea
                                {...field}
                                rows={4}
                                placeholder="Option 1&#10;Option 2&#10;Option 3"
                                disabled={formLoading}
                                className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-4">
                        <FormField
                          control={createQuestionForm.control}
                          name="is_signup_question"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <input type="checkbox" checked={field.value} onChange={field.onChange} disabled={formLoading} className="rounded border border-input" />
                              </FormControl>
                              <FormLabel className="font-normal text-sm">Signup Question</FormLabel>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createQuestionForm.control}
                          name="is_game_question"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <input type="checkbox" checked={field.value} onChange={field.onChange} disabled={formLoading} className="rounded border border-input" />
                              </FormControl>
                              <FormLabel className="font-normal text-sm">Game Question</FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setCreateQuestionDialogOpen(false)
                            createQuestionForm.reset()
                          }}
                          disabled={formLoading}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={formLoading}>
                          {formLoading ? "Creating..." : "Create Question"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              {/* Questions List */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Existing Questions</h4>
                {questionsLoading ? (
                  <div className="text-muted-foreground text-sm">Loading questions...</div>
                ) : questions.length > 0 ? (
                  <div className="custom-scrollbar max-h-[24.5rem] space-y-2 overflow-y-auto">
                    {questions.map((question) => (
                      <div key={question.id} className="flex items-start justify-between rounded-md border p-3">
                        <div className="flex-1 space-y-1">
                          <span className="line-clamp-2 font-medium text-sm">{question.question}</span>
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-muted px-2 py-1 text-xs">{question.question_type.replace("_", " ")}</span>
                            {question.is_signup_question && <span className="rounded bg-blue-100 px-2 py-1 text-blue-800 text-xs dark:bg-blue-900 dark:text-blue-200">Signup</span>}
                            {question.is_game_question && <span className="rounded bg-green-100 px-2 py-1 text-green-800 text-xs dark:bg-green-900 dark:text-green-200">Game</span>}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleViewQuestion(question)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleEditQuestion(question)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteQuestion(question)} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm">No questions found</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* View Event Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="min-w-[50%]">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>View detailed information about this event.</DialogDescription>
          </DialogHeader>
          {selectedEventForAction && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Event Name</Label>
                <div className="rounded-md border bg-muted/30 p-3 text-sm">{selectedEventForAction.name}</div>
              </div>
              <div className="space-y-2">
                <Label>Event Code</Label>
                <div className="rounded-md border bg-muted/30 p-3 font-mono text-sm">{selectedEventForAction.code}</div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="rounded-md border bg-muted/30 p-3 text-sm">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-medium text-xs ${
                      selectedEventForAction.is_active
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${selectedEventForAction.is_active ? "bg-green-500" : "bg-red-500"}`} />
                    {selectedEventForAction.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Whitelist Configuration</Label>
                <div className="rounded-md border bg-muted/30 p-3 text-sm">
                  <pre className="whitespace-pre-wrap font-mono text-xs">{JSON.stringify(selectedEventForAction.whitelist, null, 2)}</pre>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Created At</Label>
                <div className="rounded-md border bg-muted/30 p-3 text-sm">{new Date(selectedEventForAction.created_at).toLocaleString()}</div>
              </div>
              <div className="space-y-2">
                <Label>Updated At</Label>
                <div className="rounded-md border bg-muted/30 p-3 text-sm">{new Date(selectedEventForAction.updated_at).toLocaleString()}</div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="min-w-[50%]">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>Update the event details and whitelist configuration.</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdateEvent)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter event name" {...field} disabled={formLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter unique event code" {...field} disabled={formLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Status</FormLabel>
                    <FormControl>
                      <Select onValueChange={(value) => field.onChange(value === "true")} value={field.value ? "true" : "false"} disabled={formLoading}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Active</SelectItem>
                          <SelectItem value="false">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="whitelist"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Whitelist Configuration</FormLabel>
                    <FormControl>
                      <textarea
                        {...field}
                        rows={8}
                        placeholder='{"emails": ["user@example.com", "admin@example.com"]}'
                        disabled={formLoading}
                        className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:ring-destructive/40"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditDialogOpen(false)
                    editForm.reset()
                    setSelectedEventForAction(null)
                  }}
                  disabled={formLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? "Updating..." : "Update Event"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Event Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="min-w-[50%]">
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>Are you sure you want to delete this event? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          {selectedEventForAction && (
            <div className="space-y-2">
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
                <p className="font-medium text-sm">Event: {selectedEventForAction.name}</p>
                <p className="text-muted-foreground text-sm">Code: {selectedEventForAction.code}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setSelectedEventForAction(null)
              }}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteEvent} disabled={formLoading}>
              {formLoading ? "Deleting..." : "Delete Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Question Dialog */}
      <Dialog open={viewQuestionDialogOpen} onOpenChange={setViewQuestionDialogOpen}>
        <DialogContent className="min-w-[50%]">
          <DialogHeader>
            <DialogTitle>Question Details</DialogTitle>
            <DialogDescription>View detailed information about this question.</DialogDescription>
          </DialogHeader>
          {selectedQuestionForAction && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Question</Label>
                <div className="rounded-md border bg-muted/30 p-3 text-sm">{selectedQuestionForAction.question}</div>
              </div>
              <div className="space-y-2">
                <Label>Question Type</Label>
                <div className="rounded-md border bg-muted/30 p-3 text-sm">{selectedQuestionForAction.question_type.replace("_", " ")}</div>
              </div>
              {selectedQuestionForAction.options && selectedQuestionForAction.options.length > 0 && (
                <div className="space-y-2">
                  <Label>Options</Label>
                  <div className="rounded-md border bg-muted/30 p-3 text-sm">
                    <ul className="list-inside list-disc space-y-1">
                      {selectedQuestionForAction.options.map((option) => (
                        <li key={option}>{option}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              <div className="flex gap-4">
                <div className="space-y-2">
                  <Label>Signup Question</Label>
                  <div
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-medium text-xs ${
                      selectedQuestionForAction.is_signup_question
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                    }`}
                  >
                    {selectedQuestionForAction.is_signup_question ? "Yes" : "No"}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Game Question</Label>
                  <div
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-medium text-xs ${
                      selectedQuestionForAction.is_game_question
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                    }`}
                  >
                    {selectedQuestionForAction.is_game_question ? "Yes" : "No"}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Created At</Label>
                <div className="rounded-md border bg-muted/30 p-3 text-sm">{new Date(selectedQuestionForAction.created_at).toLocaleString()}</div>
              </div>
              <div className="space-y-2">
                <Label>Updated At</Label>
                <div className="rounded-md border bg-muted/30 p-3 text-sm">{new Date(selectedQuestionForAction.updated_at).toLocaleString()}</div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewQuestionDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Question Dialog */}
      <Dialog open={editQuestionDialogOpen} onOpenChange={setEditQuestionDialogOpen}>
        <DialogContent className="min-w-[50%]">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
            <DialogDescription>Update the question details and options.</DialogDescription>
          </DialogHeader>
          <Form {...editQuestionForm}>
            <form onSubmit={editQuestionForm.handleSubmit(handleUpdateQuestion)} className="space-y-4">
              <FormField
                control={editQuestionForm.control}
                name="question"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter question" {...field} disabled={formLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editQuestionForm.control}
                name="question_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Type</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value} disabled={formLoading}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default (Open Text)</SelectItem>
                          <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                          <SelectItem value="true_false">True/False</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editQuestionForm.control}
                name="options"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Options (one per line, for MCQ/True-False)</FormLabel>
                    <FormControl>
                      <textarea
                        {...field}
                        rows={4}
                        disabled={formLoading}
                        className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-4">
                <FormField
                  control={editQuestionForm.control}
                  name="is_signup_question"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <input type="checkbox" checked={field.value} onChange={field.onChange} disabled={formLoading} className="rounded border border-input" />
                      </FormControl>
                      <FormLabel className="font-normal text-sm">Signup Question</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={editQuestionForm.control}
                  name="is_game_question"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <input type="checkbox" checked={field.value} onChange={field.onChange} disabled={formLoading} className="rounded border border-input" />
                      </FormControl>
                      <FormLabel className="font-normal text-sm">Game Question</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditQuestionDialogOpen(false)
                    editQuestionForm.reset()
                    setSelectedQuestionForAction(null)
                  }}
                  disabled={formLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? "Updating..." : "Update Question"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Question Dialog */}
      <Dialog open={deleteQuestionDialogOpen} onOpenChange={setDeleteQuestionDialogOpen}>
        <DialogContent className="min-w-[50%]">
          <DialogHeader>
            <DialogTitle>Delete Question</DialogTitle>
            <DialogDescription>Are you sure you want to delete this question? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          {selectedQuestionForAction && (
            <div className="space-y-2">
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
                <p className="font-medium text-sm">Question: {selectedQuestionForAction.question}</p>
                <p className="text-muted-foreground text-sm">Type: {selectedQuestionForAction.question_type.replace("_", " ")}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteQuestionDialogOpen(false)
                setSelectedQuestionForAction(null)
              }}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteQuestion} disabled={formLoading}>
              {formLoading ? "Deleting..." : "Delete Question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
