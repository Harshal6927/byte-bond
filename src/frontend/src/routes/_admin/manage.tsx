// import {
//   apiEventsEventIdDeleteEvent,
//   apiEventsEventIdPatchEvent,
//   apiEventsGetEvents,
//   apiEventsPostEvent,
//   apiGameLeaderboardEventIdGetLeaderboard,
//   apiGameStartStartGame,
//   apiGameStopStopGame,
//   apiQuestionsGetQuestions,
//   apiQuestionsPostQuestion,
//   apiQuestionsQuestionIdDeleteQuestion,
//   apiQuestionsQuestionIdPatchQuestion,
//   apiUsersGetUsers,
//   apiUsersUserIdDeleteUser,
// } from "@/client"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_admin/manage")({
  component: ManagePage,
})

function ManagePage() {
  return <div>Hello "/_admin/manage"!</div>
}
