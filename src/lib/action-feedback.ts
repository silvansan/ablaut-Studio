export type ActionFeedback = {
  message: string
  ok: boolean
}

export const initialActionFeedback: ActionFeedback = {
  message: '',
  ok: true,
}

export function successFeedback(message: string): ActionFeedback {
  return { message, ok: true }
}

export function errorFeedback(message: string): ActionFeedback {
  return { message, ok: false }
}

export type ActionFeedbackHandler = (
  previousState: ActionFeedback,
  formData: FormData,
) => Promise<ActionFeedback>
