import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { LANG_NAMES, LANGS, useLang } from "@/lib/i18n";
import { colors } from "@/lib/theme";
import { s } from "./ui";

export function LanguageButton() {
  const { lang, t, setLang } = useLang();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.language}
        onPress={() => setOpen(true)}
        style={[s.chip, { minHeight: 36 }]}
        hitSlop={8}
      >
        <Text style={s.chipText}>{lang.toUpperCase()}</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }} onPress={() => setOpen(false)}>
          <View style={{ backgroundColor: colors.night2, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 8, paddingBottom: 40 }}>
            <Text style={[s.h2, { marginBottom: 8 }]}>{t.language}</Text>
            {LANGS.map((l) => (
              <Pressable
                key={l}
                accessibilityRole="button"
                accessibilityState={{ selected: l === lang }}
                onPress={() => {
                  setLang(l);
                  setOpen(false);
                }}
                style={{ padding: 14, borderRadius: 14, backgroundColor: l === lang ? colors.lime : colors.night }}
              >
                <Text style={{ color: l === lang ? colors.night : colors.white, fontWeight: "700", fontSize: 16 }}>{LANG_NAMES[l]}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
