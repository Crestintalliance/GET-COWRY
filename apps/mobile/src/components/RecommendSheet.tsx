import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { api } from "@/lib/api";
import { useLang } from "@/lib/i18n";
import { colors } from "@/lib/theme";
import { Button, Chip, s } from "./ui";

type Category = "eat" | "do" | "go";

function Field({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: colors.white, fontWeight: "700" }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        accessibilityLabel={label}
        multiline={multiline}
        maxLength={multiline ? 600 : 120}
        placeholderTextColor={colors.mist}
        style={{
          minHeight: multiline ? 96 : 50,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.line,
          backgroundColor: colors.night,
          color: colors.white,
          fontSize: 16,
          paddingHorizontal: 14,
          paddingTop: multiline ? 12 : 0,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
    </View>
  );
}

/** Lets a traveler send a place they love. It appears once the team approves it. */
export function RecommendSheet({ code, visible, onClose, initial = "eat" }: { code: string; visible: boolean; onClose: () => void; initial?: Category }) {
  const { t } = useLang();
  const f = t.guide.form;
  const [category, setCategory] = useState<Category>(initial);
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [note, setNote] = useState("");
  const [by, setBy] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function close() {
    setName("");
    setArea("");
    setNote("");
    setError(null);
    setSent(false);
    onClose();
  }

  async function send() {
    if (name.trim().length < 2) return setError(f.tooShort);
    setBusy(true);
    setError(null);
    try {
      await api.suggest(code, { category, name: name.trim(), area: area.trim(), note: note.trim(), submittedBy: by.trim() || undefined });
      setSent(true);
    } catch {
      setError(t.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close} transparent={Platform.OS === "web"}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.night2 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={s.h2}>{f.title}</Text>
            <Pressable accessibilityRole="button" onPress={close} hitSlop={10}>
              <Text style={{ color: colors.lime, fontWeight: "700", fontSize: 16 }}>{f.cancel}</Text>
            </Pressable>
          </View>
          {sent ? (
            <View style={{ gap: 16 }}>
              <Text style={[s.body, { fontSize: 17 }]}>{f.thanks}</Text>
              <Button label="OK" onPress={close} />
            </View>
          ) : (
            <>
              <View style={{ gap: 8 }}>
                <Text style={{ color: colors.white, fontWeight: "700" }}>{f.category}</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {(["eat", "do", "go"] as Category[]).map((c) => (
                    <Chip key={c} label={t.guide[c]} active={c === category} onPress={() => setCategory(c)} />
                  ))}
                </View>
              </View>
              <Field label={f.name} value={name} onChange={setName} />
              <Field label={f.area} value={area} onChange={setArea} />
              <Field label={f.note} value={note} onChange={setNote} multiline />
              <Field label={f.by} value={by} onChange={setBy} />
              {error && <Text style={s.error}>{error}</Text>}
              <Button label={f.send} busy={busy} onPress={send} />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
