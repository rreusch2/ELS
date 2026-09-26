import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, CheckRow, DateField, Field, Loader, Notice, SelectField } from "@/components/ui";
import { invokeApplication, openCheckout } from "@/lib/checkout";
import { formatCurrency, formatDate } from "@/lib/format";
import { useListing, useSiteSettings } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { colors, fonts } from "@/theme";
import {
  STEPS,
  emptyCoApplicant,
  initialFormState,
  validateStep,
  type ApplicationFormState,
} from "@/lib/applicationForm";

const MAX_FILES = 5;

export default function ApplyScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data: listing, isLoading } = useListing(slug);
  const { data: settings } = useSiteSettings();
  const router = useRouter();
  const [form, setForm] = useState<ApplicationFormState>(initialFormState);
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState<DocumentPicker.DocumentPickerAsset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm((current) => {
      const needed = Math.max(0, current.adult_count - 1);
      if (current.data.co_applicants.length === needed) return current;
      const next = current.data.co_applicants.length > needed
        ? current.data.co_applicants.slice(0, needed)
        : [...current.data.co_applicants, ...Array.from({ length: needed - current.data.co_applicants.length }, emptyCoApplicant)];
      return { ...current, data: { ...current.data, co_applicants: next } };
    });
  }, [form.adult_count]);

  if (isLoading || !settings) return <Loader />;
  if (!listing || !["available", "pending"].includes(listing.status)) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingTitle}>This home isn't accepting applications.</Text>
        <Button label="Back" onPress={() => router.back()} />
      </View>
    );
  }

  const update = (patch: Partial<ApplicationFormState>) => setForm((current) => ({ ...current, ...patch }));
  const updateData = <K extends keyof ApplicationFormState["data"]>(key: K, value: ApplicationFormState["data"][K]) =>
    setForm((current) => ({ ...current, data: { ...current.data, [key]: value } }));

  function next() {
    const message = validateStep(step, form);
    setError(message);
    if (!message) setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  async function submit() {
    if (!listing) return;
    for (let index = 0; index < STEPS.length; index++) {
      const message = validateStep(index, form);
      if (message) {
        setError(message);
        setStep(index);
        return;
      }
    }
    setSubmitting(true);
    setError(null);
    try {
      const uploadId = crypto.randomUUID();
      const documentPaths: string[] = [];
      for (const [index, file] of files.entries()) {
        const safeName = (file.name || `document-${index + 1}`).replace(/[^\w.\-]+/g, "_").slice(-120);
        const path = `${uploadId}/${index + 1}-${safeName}`;
        const response = await fetch(file.uri);
        const body = await response.arrayBuffer();
        const { error: uploadError } = await supabase.storage.from("application-documents").upload(path, body, {
          contentType: file.mimeType ?? "application/octet-stream",
          upsert: false,
        });
        if (uploadError) throw new Error(`Couldn't upload ${file.name}. Try a different file.`);
        documentPaths.push(path);
      }

      const result = await invokeApplication({
        listing_id: listing.id,
        applicant: { first_name: form.first_name, last_name: form.last_name, email: form.email, phone: form.phone },
        desired_move_in: form.desired_move_in,
        adult_count: form.adult_count,
        data: form.data,
        document_paths: documentPaths,
      });
      const outcome = await openCheckout(result.checkout_url);
      if (outcome === "success") router.replace("/apply/success");
      else router.replace({ pathname: "/apply/canceled", params: { application: result.application_id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  const total = settings.application_fee_cents * form.adult_count;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.property}>{listing.title}</Text>
      <Text style={styles.meta}>{listing.address_line1} · {formatCurrency(listing.rent_cents)}/mo</Text>
      <View style={styles.progress}>
        {STEPS.map((item, index) => (
          <View key={item.key} style={[styles.dot, index <= step && styles.dotOn]} />
        ))}
      </View>
      <Text style={styles.stepTitle}>{STEPS[step].title}</Text>
      <Text style={styles.stepHint}>{STEPS[step].description}</Text>

      <View style={styles.form}>
        {step === 0 ? <ApplicantStep form={form} update={update} updateData={updateData} fee={settings.application_fee_cents} /> : null}
        {step === 1 ? <ResidenceStep form={form} updateData={updateData} /> : null}
        {step === 2 ? <IncomeStep form={form} updateData={updateData} /> : null}
        {step === 3 ? <HouseholdStep form={form} updateData={updateData} /> : null}
        {step === 4 ? <DocumentsStep form={form} updateData={updateData} files={files} setFiles={setFiles} setError={setError} /> : null}
        {step === 5 ? <ReviewStep form={form} update={update} fee={settings.application_fee_cents} files={files} address={listing.address_line1} /> : null}
      </View>

      {error ? <Notice>{error}</Notice> : null}

      <View style={styles.nav}>
        {step > 0 ? <View style={{ flex: 1 }}><Button label="Back" variant="outline" onPress={() => { setError(null); setStep((current) => current - 1); }} disabled={submitting} /></View> : null}
        <View style={{ flex: 1 }}>
          {step < STEPS.length - 1 ? (
            <Button label="Continue" onPress={next} />
          ) : (
            <Button label={submitting ? "Submitting…" : `Pay ${formatCurrency(total, { cents: true })}`} variant="gold" loading={submitting} onPress={submit} />
          )}
        </View>
      </View>
    </ScrollView>
  );
}

type UpdateData = <K extends keyof ApplicationFormState["data"]>(key: K, value: ApplicationFormState["data"][K]) => void;

function ApplicantStep({ form, update, updateData, fee }: { form: ApplicationFormState; update: (patch: Partial<ApplicationFormState>) => void; updateData: UpdateData; fee: number }) {
  const today = new Date();
  return (
    <>
      <Field label="First name" required value={form.first_name} onChangeText={(value) => update({ first_name: value })} />
      <Field label="Last name" required value={form.last_name} onChangeText={(value) => update({ last_name: value })} />
      <Field label="Email" required keyboardType="email-address" autoCapitalize="none" value={form.email} onChangeText={(value) => update({ email: value })} />
      <Field label="Phone" required keyboardType="phone-pad" value={form.phone} onChangeText={(value) => update({ phone: value })} />
      <DateField label="Date of birth" required value={form.data.date_of_birth} maximumDate={today} onChange={(value) => updateData("date_of_birth", value)} />
      <DateField label="Desired move-in" required value={form.desired_move_in} minimumDate={today} onChange={(value) => update({ desired_move_in: value })} />
      <SelectField
        label="Adults who will live here, including you"
        required
        value={String(form.adult_count)}
        options={[1, 2, 3, 4, 5, 6].map((count) => ({ label: `${count} ${count === 1 ? "adult" : "adults"}`, value: String(count) }))}
        onChange={(value) => update({ adult_count: Number(value) })}
      />
      <Text style={styles.note}>The application fee is {formatCurrency(fee)} per adult. You'll add the other adults on the Household step.</Text>
    </>
  );
}

function ResidenceStep({ form, updateData }: { form: ApplicationFormState; updateData: UpdateData }) {
  const current = form.data.current_address;
  const previous = form.data.previous_address;
  const setCurrent = (patch: Partial<typeof current>) => updateData("current_address", { ...current, ...patch });
  const setPrevious = (patch: Partial<typeof previous>) => updateData("previous_address", { ...previous, ...patch });
  return (
    <>
      <Text style={styles.group}>Current address</Text>
      <Field label="Street" required value={current.street} onChangeText={(value) => setCurrent({ street: value })} />
      <Field label="City" required value={current.city} onChangeText={(value) => setCurrent({ city: value })} />
      <Field label="State" required autoCapitalize="characters" maxLength={2} value={current.state} onChangeText={(value) => setCurrent({ state: value.toUpperCase() })} />
      <Field label="ZIP" required keyboardType="number-pad" value={current.zip} onChangeText={(value) => setCurrent({ zip: value })} />
      <Field label="Moved in" placeholder="YYYY-MM" value={current.move_in_date} onChangeText={(value) => setCurrent({ move_in_date: value })} />
      <Field label="Monthly rent" keyboardType="decimal-pad" value={current.monthly_rent} onChangeText={(value) => setCurrent({ monthly_rent: value })} />
      <Field label="Landlord name" value={current.landlord_name} onChangeText={(value) => setCurrent({ landlord_name: value })} />
      <Field label="Landlord phone" keyboardType="phone-pad" value={current.landlord_phone} onChangeText={(value) => setCurrent({ landlord_phone: value })} />
      <Field label="Reason for moving" value={current.reason_for_leaving} onChangeText={(value) => setCurrent({ reason_for_leaving: value })} />
      <Text style={styles.group}>Previous address, if less than 2 years</Text>
      <Field label="Street" value={previous.street} onChangeText={(value) => setPrevious({ street: value })} />
      <Field label="City" value={previous.city} onChangeText={(value) => setPrevious({ city: value })} />
      <Field label="Landlord" value={previous.landlord_name} onChangeText={(value) => setPrevious({ landlord_name: value })} />
      <Field label="Landlord phone" keyboardType="phone-pad" value={previous.landlord_phone} onChangeText={(value) => setPrevious({ landlord_phone: value })} />
    </>
  );
}

function IncomeStep({ form, updateData }: { form: ApplicationFormState; updateData: UpdateData }) {
  const employment = form.data.employment;
  const set = (patch: Partial<typeof employment>) => updateData("employment", { ...employment, ...patch });
  const employed = employment.status.startsWith("Employed") || employment.status === "Self-employed";
  return (
    <>
      <SelectField label="Employment status" value={employment.status} options={["Employed full-time", "Employed part-time", "Self-employed", "Retired", "Student", "Not currently employed"]} onChange={(value) => set({ status: value })} />
      {employed ? (
        <>
          <Field label="Employer" required value={employment.employer} onChangeText={(value) => set({ employer: value })} />
          <Field label="Position" value={employment.position} onChangeText={(value) => set({ position: value })} />
          <Field label="Supervisor phone" keyboardType="phone-pad" value={employment.supervisor_phone} onChangeText={(value) => set({ supervisor_phone: value })} />
        </>
      ) : null}
      <Field label="Gross monthly income" required keyboardType="decimal-pad" hint="Before taxes, for you only." value={employment.monthly_income} onChangeText={(value) => set({ monthly_income: value })} />
      <Field label="Other income" value={employment.other_income} onChangeText={(value) => set({ other_income: value })} />
    </>
  );
}

function HouseholdStep({ form, updateData }: { form: ApplicationFormState; updateData: UpdateData }) {
  const data = form.data;
  return (
    <>
      {data.co_applicants.map((person, index) => {
        const set = (patch: Partial<typeof person>) => updateData("co_applicants", data.co_applicants.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
        return (
          <View key={index} style={styles.groupCard}>
            <Text style={styles.group}>Adult {index + 2}</Text>
            <Field label="First name" required value={person.first_name} onChangeText={(value) => set({ first_name: value })} />
            <Field label="Last name" required value={person.last_name} onChangeText={(value) => set({ last_name: value })} />
            <Field label="Email" required keyboardType="email-address" autoCapitalize="none" value={person.email} onChangeText={(value) => set({ email: value })} />
            <Field label="Phone" keyboardType="phone-pad" value={person.phone} onChangeText={(value) => set({ phone: value })} />
            <Field label="Relationship to you" value={person.relationship} onChangeText={(value) => set({ relationship: value })} />
          </View>
        );
      })}
      <SelectField label="Occupants under 18" value={data.minors_count} options={["0", "1", "2", "3", "4", "5", "6"]} onChange={(value) => updateData("minors_count", value)} />
      <Text style={styles.note}>Pet and vehicle details can be added in the notes on the next step if they apply.</Text>
    </>
  );
}

function DocumentsStep({
  form,
  updateData,
  files,
  setFiles,
  setError,
}: {
  form: ApplicationFormState;
  updateData: UpdateData;
  files: DocumentPicker.DocumentPickerAsset[];
  setFiles: (files: DocumentPicker.DocumentPickerAsset[]) => void;
  setError: (error: string | null) => void;
}) {
  const references = form.data.references;
  const history = form.data.history;
  const setRef = (index: number, patch: Partial<(typeof references)[number]>) =>
    updateData("references", references.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));

  async function pick() {
    const result = await DocumentPicker.getDocumentAsync({ type: ["image/*", "application/pdf"], multiple: true, copyToCacheDirectory: true });
    if (result.canceled) return;
    const tooBig = result.assets.find((file) => (file.size ?? 0) > 10 * 1024 * 1024);
    if (tooBig) {
      setError(`${tooBig.name} is larger than 10 MB.`);
      return;
    }
    setFiles([...files, ...result.assets].slice(0, MAX_FILES));
    setError(null);
  }

  return (
    <>
      <Text style={styles.group}>Personal reference</Text>
      <Field label="Name" required value={references[0].name} onChangeText={(value) => setRef(0, { name: value })} />
      <Field label="Relationship" value={references[0].relationship} onChangeText={(value) => setRef(0, { relationship: value })} />
      <Field label="Phone" required keyboardType="phone-pad" value={references[0].phone} onChangeText={(value) => setRef(0, { phone: value })} />
      <SelectField label="Have you ever been evicted?" value={history.evicted} options={["No", "Yes"]} onChange={(value) => updateData("history", { ...history, evicted: value })} />
      <SelectField label="Have you ever broken a lease?" value={history.broken_lease} options={["No", "Yes"]} onChange={(value) => updateData("history", { ...history, broken_lease: value })} />
      <Button label={files.length ? `${files.length} file${files.length > 1 ? "s" : ""} attached` : "Upload ID or pay stubs"} variant="outline" onPress={pick} />
      <Field label="Anything else we should know?" multiline value={form.data.additional_notes} onChangeText={(value) => updateData("additional_notes", value)} />
    </>
  );
}

function ReviewStep({ form, update, fee, files, address }: { form: ApplicationFormState; update: (patch: Partial<ApplicationFormState>) => void; fee: number; files: DocumentPicker.DocumentPickerAsset[]; address: string }) {
  const rows: [string, string][] = [
    ["Name", `${form.first_name} ${form.last_name}`],
    ["Email", form.email],
    ["Move-in", formatDate(form.desired_move_in)],
    ["Adults", String(form.adult_count)],
    ["Income", form.data.employment.monthly_income ? `$${form.data.employment.monthly_income}` : "—"],
    ["Files", files.length ? `${files.length} attached` : "None"],
  ];
  const setConsent = (key: keyof ApplicationFormState["consents"], value: boolean) => update({ consents: { ...form.consents, [key]: value } });
  return (
    <>
      <View style={styles.groupCard}>
        {rows.map(([label, value]) => (
          <View key={label} style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>{label}</Text>
            <Text style={styles.reviewValue}>{value}</Text>
          </View>
        ))}
      </View>
      <View style={styles.feeBox}>
        <Text style={styles.feeLabel}>Due today</Text>
        <Text style={styles.feeValue}>{formatCurrency(fee * form.adult_count, { cents: true })}</Text>
        <Text style={styles.feeNote}>{formatCurrency(fee, { cents: true })} × {form.adult_count} {form.adult_count === 1 ? "adult" : "adults"}. Card details are handled by Stripe.</Text>
      </View>
      <CheckRow checked={form.consents.accurate} onChange={(value) => setConsent("accurate", value)}>I certify this application is true and complete.</CheckRow>
      <CheckRow checked={form.consents.screening} onChange={(value) => setConsent("screening", value)}>I authorize ELS Properties to verify this information and obtain credit and background reports for every adult applicant.</CheckRow>
      <CheckRow checked={form.consents.fee} onChange={(value) => setConsent("fee", value)}>I understand the fee for {address} is non-refundable and that applying does not guarantee approval.</CheckRow>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.slate50 },
  content: { padding: 20, gap: 10, paddingBottom: 48 },
  property: { fontFamily: fonts.serif, fontSize: 26, color: colors.navy900 },
  meta: { fontFamily: fonts.medium, color: colors.slate500 },
  progress: { flexDirection: "row", gap: 6, marginTop: 8 },
  dot: { flex: 1, height: 4, borderRadius: 4, backgroundColor: colors.slate200 },
  dotOn: { backgroundColor: colors.gold400 },
  stepTitle: { fontFamily: fonts.serif, fontSize: 28, color: colors.navy900, marginTop: 8 },
  stepHint: { fontFamily: fonts.sans, color: colors.slate500 },
  form: { gap: 14, marginTop: 8 },
  nav: { flexDirection: "row", gap: 10, marginTop: 8 },
  note: { fontFamily: fonts.sans, color: colors.slate600, lineHeight: 20 },
  group: { fontFamily: fonts.semibold, color: colors.navy900, fontSize: 16, marginTop: 4 },
  groupCard: { gap: 12, backgroundColor: colors.white, borderRadius: 16, padding: 14 },
  reviewRow: { flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 6 },
  reviewLabel: { fontFamily: fonts.sans, color: colors.slate500 },
  reviewValue: { fontFamily: fonts.semibold, color: colors.navy900, flexShrink: 1, textAlign: "right" },
  feeBox: { backgroundColor: colors.navy900, borderRadius: 18, padding: 16, gap: 4 },
  feeLabel: { fontFamily: fonts.medium, color: colors.navy100 },
  feeValue: { fontFamily: fonts.serif, fontSize: 32, color: colors.gold300 },
  feeNote: { fontFamily: fonts.sans, color: colors.navy100, lineHeight: 20 },
  missing: { flex: 1, justifyContent: "center", padding: 24, gap: 16, backgroundColor: colors.slate50 },
  missingTitle: { fontFamily: fonts.serif, fontSize: 28, color: colors.navy900 },
});
