import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface EligibilityAlertEmailProps {
  userName: string;
  handle: string;
  previousStatus: string; // "eligible" | "ineligible" | "restricted"
  newStatus: string;
  followers: number;
  recheckUrl?: string;
}

const STATUS_LABEL: Record<string, string> = {
  eligible: "Eligible ✅",
  ineligible: "Not eligible yet",
  restricted: "Restricted ❌",
};

export function EligibilityAlertEmail({
  userName,
  handle,
  previousStatus,
  newStatus,
  followers,
  recheckUrl = "http://localhost:3000/",
}: EligibilityAlertEmailProps) {
  const improved = newStatus === "eligible" && previousStatus !== "eligible";
  return (
    <Html>
      <Head />
      <Preview>{handle} eligibility changed: {STATUS_LABEL[previousStatus]} → {STATUS_LABEL[newStatus]}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>TikTok Monetization Checker</Heading>
          </Section>
          <Section style={card}>
            <Heading style={h1}>Eligibility alert{improved ? " 🎉" : ""}</Heading>
            <Text style={paragraph}>Hi {userName},</Text>
            <Text style={paragraph}>
              We re-checked <span style={handleStyle}>{handle}</span> as part
              of our scheduled audit. Your eligibility status has changed:
            </Text>
            <Section style={summaryBox}>
              <Text style={summaryRow}>
                <strong>Handle:</strong> {handle}
              </Text>
              <Text style={summaryRow}>
                <strong>Followers:</strong> {followers.toLocaleString("en-US")}
              </Text>
              <Text style={summaryRow}>
                <strong>Previous status:</strong> {STATUS_LABEL[previousStatus] ?? previousStatus}
              </Text>
              <Text style={summaryRow}>
                <strong>New status:</strong> {STATUS_LABEL[newStatus] ?? newStatus}
              </Text>
            </Section>
            {improved && (
              <Text style={paragraph}>
                🎉 Great news — your account is now eligible for TikTok
                monetization! Head to the dashboard and apply now.
              </Text>
            )}
            {newStatus === "restricted" && (
              <Text style={paragraph}>
                Your account was flagged as restricted. You can pay the unlock
                fee to expedite the appeal, or wait for TikTok to review.
              </Text>
            )}
            <Section style={ctaSection}>
              <a href={recheckUrl} style={ctaButton}>
                Open dashboard
              </a>
            </Section>
            <Hr style={hr} />
            <Text style={footer}>
              You&apos;re receiving this because you saved an audit for{" "}
              {handle} on TikTok Monetization Checker. To stop receiving these
              alerts, delete the audit from your dashboard.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default EligibilityAlertEmail;

const body: React.CSSProperties = {
  backgroundColor: "#060b13",
  margin: 0,
  padding: "32px 0",
  fontFamily: "Inter, system-ui, sans-serif",
};
const container: React.CSSProperties = { maxWidth: "560px", margin: "0 auto", padding: 0 };
const header: React.CSSProperties = { textAlign: "center", padding: "24px 0" };
const logo: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 700,
  color: "#00f2fe",
  margin: 0,
  letterSpacing: "-0.01em",
};
const card: React.CSSProperties = {
  backgroundColor: "#0d1626",
  border: "1px solid #1a2942",
  borderRadius: "16px",
  padding: "32px",
};
const h1: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: 700,
  color: "#ffffff",
  margin: "0 0 16px 0",
};
const paragraph: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#cbd5e1",
  margin: "12px 0",
};
const summaryBox: React.CSSProperties = {
  backgroundColor: "#080e19",
  border: "1px solid #1a2942",
  borderRadius: "8px",
  padding: "16px",
  margin: "16px 0",
};
const summaryRow: React.CSSProperties = {
  fontSize: "13px",
  color: "#e2e8f0",
  margin: "4px 0",
  lineHeight: 1.5,
};
const handleStyle: React.CSSProperties = { color: "#00f2fe", fontWeight: 600 };
const ctaSection: React.CSSProperties = { textAlign: "center", margin: "24px 0 8px 0" };
const ctaButton: React.CSSProperties = {
  display: "inline-block",
  backgroundImage: "linear-gradient(90deg, #fe2c55 0%, #ff527b 45%, #00f2fe 100%)",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 600,
  textDecoration: "none",
  padding: "12px 24px",
  borderRadius: "10px",
};
const hr: React.CSSProperties = { borderColor: "#1a2942", margin: "24px 0" };
const footer: React.CSSProperties = { fontSize: "12px", color: "#64748b", lineHeight: 1.5 };
