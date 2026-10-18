import { redirect } from 'next/navigation'

type PageProps = {
  params: Promise<{ eventSlug: string }>
}

/** Adding a channel now happens in a drawer on the event's Channels tab. */
export default async function NewChannelPage({ params }: PageProps) {
  const { eventSlug } = await params
  redirect(`/events/${eventSlug}?addChannel=1`)
}
