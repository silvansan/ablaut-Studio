export const APP_NOTICES = {
  channelListenerPage: (enabled: boolean) =>
    enabled ? 'Listener page is now on. Share the Listener QR.' : 'Listener page is now off.',
  channelSaved: 'Channel settings saved.',
  channelSpeakerPage: (enabled: boolean) =>
    enabled ? 'Speaker page is now on. Share the Speaker / translator QR.' : 'Speaker page is now off.',
  channelSummarySaved: 'Channel details updated.',
  copyLinkFailed: 'Could not copy the link. Select and copy it manually.',
  copyLinkSuccess: 'Link copied to clipboard.',
  eventSaved: 'Event settings saved.',
  genericError: 'Something went wrong. Try again.',
} as const
