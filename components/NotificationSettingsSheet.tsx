import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, Pressable, Switch, Linking,
} from 'react-native';
import { Colors, FontSize, FontWeight, Spacing, Radius, Shadow } from '../constants/theme';
import {
  getNotificationSettings, saveNotificationSettings, scheduleDailyReminder,
  requestNotificationPermission, NotificationSettings,
} from '../services/notificationService';

interface NotificationSettingsSheetProps {
  visible: boolean;
  onClose: () => void;
}

const MINUTE_OPTIONS = [0, 15, 30, 45];

function formatTime(h: number, m: number): string {
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const min = m.toString().padStart(2, '0');
  return `${hour}:${min} ${period}`;
}

export function NotificationSettingsSheet({ visible, onClose }: NotificationSettingsSheetProps) {
  const [settings, setSettings] = useState<NotificationSettings>({ enabled: true, hour: 20, minute: 0 });
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (visible) {
      getNotificationSettings().then(setSettings);
      setSaved(false);
    }
  }, [visible]);

  const handleSave = async () => {
    if (settings.enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        setPermissionDenied(true);
        return;
      }
      setPermissionDenied(false);
    }
    await saveNotificationSettings(settings);
    await scheduleDailyReminder(settings);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1200);
  };

  const adjustHour = (delta: number) => {
    setSettings(s => ({ ...s, hour: (s.hour + delta + 24) % 24 }));
  };

  const cycleMinute = () => {
    const currentIdx = MINUTE_OPTIONS.indexOf(settings.minute);
    const next = MINUTE_OPTIONS[(currentIdx + 1) % MINUTE_OPTIONS.length];
    setSettings(s => ({ ...s, minute: next }));
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>🔔 Daily Reminder</Text>

        {permissionDenied && (
          <View style={styles.permBanner}>
            <Text style={styles.permText}>
              ⚠️ Notifications are disabled. Go to device Settings to enable them for LinguaLeap.
            </Text>
            <Pressable onPress={() => Linking.openSettings()} style={styles.openSettingsBtn}>
              <Text style={styles.openSettingsText}>Open Settings</Text>
            </Pressable>
          </View>
        )}

        {/* Enable toggle */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>Daily Reminder</Text>
            <Text style={styles.rowSub}>Get notified to practice each day</Text>
          </View>
          <Switch
            value={settings.enabled}
            onValueChange={v => setSettings(s => ({ ...s, enabled: v }))}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor="#fff"
          />
        </View>

        {/* Time picker */}
        {settings.enabled && (
          <>
            <Text style={styles.sectionLabel}>Reminder Time</Text>
            <View style={styles.timePicker}>
              {/* Hour */}
              <View style={styles.timeCol}>
                <Pressable onPress={() => adjustHour(1)} style={styles.arrowBtn}>
                  <Text style={styles.arrowText}>▲</Text>
                </Pressable>
                <Text style={styles.timeVal}>{settings.hour.toString().padStart(2, '0')}</Text>
                <Pressable onPress={() => adjustHour(-1)} style={styles.arrowBtn}>
                  <Text style={styles.arrowText}>▼</Text>
                </Pressable>
                <Text style={styles.timeUnit}>Hour</Text>
              </View>

              <Text style={styles.colon}>:</Text>

              {/* Minute */}
              <View style={styles.timeCol}>
                <Pressable onPress={cycleMinute} style={styles.arrowBtn}>
                  <Text style={styles.arrowText}>▲</Text>
                </Pressable>
                <Text style={styles.timeVal}>{settings.minute.toString().padStart(2, '0')}</Text>
                <Pressable onPress={cycleMinute} style={styles.arrowBtn}>
                  <Text style={styles.arrowText}>▼</Text>
                </Pressable>
                <Text style={styles.timeUnit}>Min</Text>
              </View>
            </View>

            <View style={styles.previewWrap}>
              <Text style={styles.previewText}>
                You will be reminded at {formatTime(settings.hour, settings.minute)} every day
              </Text>
            </View>
          </>
        )}

        {saved && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>✅ Reminder saved!</Text>
          </View>
        )}

        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.saveBtnText}>Save</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: Spacing.xl, gap: Spacing.md,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.sm },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, textAlign: 'center' },
  permBanner: { backgroundColor: Colors.errorBg, borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.sm },
  permText: { fontSize: FontSize.sm, color: Colors.error, lineHeight: 18 },
  openSettingsBtn: { alignSelf: 'flex-start' },
  openSettingsText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.accentBlue, textDecorationLine: 'underline' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md },
  rowLabel: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  rowSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  sectionLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  timePicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xl, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg },
  timeCol: { alignItems: 'center', gap: Spacing.sm },
  arrowBtn: { padding: Spacing.sm, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  arrowText: { fontSize: 20, color: Colors.primary, fontWeight: FontWeight.bold },
  timeVal: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, minWidth: 60, textAlign: 'center' },
  timeUnit: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.semibold },
  colon: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.lg },
  previewWrap: { backgroundColor: Colors.primaryBg, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.primaryLight },
  previewText: { fontSize: FontSize.sm, color: Colors.primaryDark, fontWeight: FontWeight.semibold, textAlign: 'center' },
  successBanner: { backgroundColor: Colors.successBg, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  successText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.primary },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 16, alignItems: 'center', ...Shadow.md, marginTop: Spacing.sm },
  saveBtnText: { color: '#fff', fontWeight: FontWeight.bold, fontSize: FontSize.lg },
});
