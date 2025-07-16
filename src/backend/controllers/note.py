# from typing import Annotated
# from uuid import uuid4

# from advanced_alchemy.types.file_object import FileObject
# from litestar import get, post
# from litestar.controller import Controller
# from litestar.di import Provide
# from litestar.enums import RequestEncodingType
# from litestar.params import Body

# from backend.lib.dependencies import provide_file_service, provide_note_service
# from backend.lib.services import FileService, NoteService
# from backend.schema.note import PostNote


# class NoteController(Controller):
#     path = "/notes"
#     dependencies = {
#         "note_service": Provide(provide_note_service),
#         "file_service": Provide(provide_file_service),
#     }

#     @post()
#     async def post_note(
#         self,
#         data: Annotated[PostNote, Body(media_type=RequestEncodingType.MULTI_PART)],
#         note_service: NoteService,
#         file_service: FileService,
#     ) -> None:
#         note = await note_service.create(
#             data={
#                 "title": data.title,
#                 "body": data.body,
#             },
#         )

#         if data.files:
#             await file_service.create_many(
#                 data=[
#                     {
#                         "blob": FileObject(
#                             backend="note_files",
#                             filename=f"{uuid4()}_{file.filename}",
#                             content_type=file.content_type,
#                             content=await file.read(),
#                         ),
#                         "note_id": note.id,
#                     }
#                     for file in data.files
#                 ],
#             )

#     @get()
#     async def get_notes(
#         self,
#         note_service: NoteService,
#     ) -> None:
#         a = await note_service.list()
#         # sqlalchemy.exc.MissingGreenlet: greenlet_spawn has not been called; can't call await_only() here. Was IO attempted in an unexpected place? (Background on this error at: https://sqlalche.me/e/20/xd2s)
#         for note in a:
#             print(note.files)
