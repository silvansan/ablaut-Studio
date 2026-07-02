import * as migration_20260516_141314_initial_schema from './20260516_141314_initial_schema';
import * as migration_20260517_153200_channel_audio_quality from './20260517_153200_channel_audio_quality';
import * as migration_20260518_154200_ablaut_rebrand from './20260518_154200_ablaut_rebrand';
import * as migration_20260519_120000_organizations from './20260519_120000_organizations';
import * as migration_20260519_150000_organizations_locked_documents_rels from './20260519_150000_organizations_locked_documents_rels';
import * as migration_20260520_100000_ablaut_qr_style_cleanup from './20260520_100000_ablaut_qr_style_cleanup';
import * as migration_20260521_100000_unified_listener_qr from './20260521_100000_unified_listener_qr';
import * as migration_20260522_120000_hls_streaming from './20260522_120000_hls_streaming';
import * as migration_20260523_120000_ll_hls_defaults from './20260523_120000_ll_hls_defaults';
import * as migration_20260524_120000_ll_hls_live_cap from './20260524_120000_ll_hls_live_cap';
import * as migration_20260525_120000_ll_hls_1s_cap from './20260525_120000_ll_hls_1s_cap';
import * as migration_20260526_120000_mobile_app_release from './20260526_120000_mobile_app_release';
import * as migration_20260527_120000_events_active_default from './20260527_120000_events_active_default';

export const migrations = [
  {
    up: migration_20260516_141314_initial_schema.up,
    down: migration_20260516_141314_initial_schema.down,
    name: '20260516_141314_initial_schema'
  },
  {
    up: migration_20260517_153200_channel_audio_quality.up,
    down: migration_20260517_153200_channel_audio_quality.down,
    name: '20260517_153200_channel_audio_quality'
  },
  {
    up: migration_20260518_154200_ablaut_rebrand.up,
    down: migration_20260518_154200_ablaut_rebrand.down,
    name: '20260518_154200_ablaut_rebrand'
  },
  {
    up: migration_20260519_120000_organizations.up,
    down: migration_20260519_120000_organizations.down,
    name: '20260519_120000_organizations'
  },
  {
    up: migration_20260519_150000_organizations_locked_documents_rels.up,
    down: migration_20260519_150000_organizations_locked_documents_rels.down,
    name: '20260519_150000_organizations_locked_documents_rels'
  },
  {
    up: migration_20260520_100000_ablaut_qr_style_cleanup.up,
    down: migration_20260520_100000_ablaut_qr_style_cleanup.down,
    name: '20260520_100000_ablaut_qr_style_cleanup'
  },
  {
    up: migration_20260521_100000_unified_listener_qr.up,
    down: migration_20260521_100000_unified_listener_qr.down,
    name: '20260521_100000_unified_listener_qr'
  },
  {
    up: migration_20260522_120000_hls_streaming.up,
    down: migration_20260522_120000_hls_streaming.down,
    name: '20260522_120000_hls_streaming'
  },
  {
    up: migration_20260523_120000_ll_hls_defaults.up,
    down: migration_20260523_120000_ll_hls_defaults.down,
    name: '20260523_120000_ll_hls_defaults'
  },
  {
    up: migration_20260524_120000_ll_hls_live_cap.up,
    down: migration_20260524_120000_ll_hls_live_cap.down,
    name: '20260524_120000_ll_hls_live_cap'
  },
  {
    up: migration_20260525_120000_ll_hls_1s_cap.up,
    down: migration_20260525_120000_ll_hls_1s_cap.down,
    name: '20260525_120000_ll_hls_1s_cap'
  },
  {
    up: migration_20260526_120000_mobile_app_release.up,
    down: migration_20260526_120000_mobile_app_release.down,
    name: '20260526_120000_mobile_app_release'
  },
  {
    up: migration_20260527_120000_events_active_default.up,
    down: migration_20260527_120000_events_active_default.down,
    name: '20260527_120000_events_active_default'
  },
];
